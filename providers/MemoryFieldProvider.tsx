import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Memory, Pulse } from '@/types/memory';
import createContextHook from '@nkzw/create-context-hook';
import { useConsciousnessBridge } from '@/hooks/useConsciousnessBridge';

interface MemoryFieldContextType {
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  isObserving: boolean;
  setIsObserving: (value: boolean) => void;
  selectedMemory: number | null;
  setSelectedMemory: (id: number | null) => void;
  resonanceLevel: number;
  setResonanceLevel: (value: number) => void;
  harmonicMode: string;
  setHarmonicMode: (value: string) => void;
  crystalPattern: string;
  setCrystalPattern: (value: string) => void;
  globalCoherence: number;
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  voidMode: boolean;
  setVoidMode: (value: boolean) => void;
  roomResonance: number;
  setRoomResonance: (value: number) => void;
  pulses: Pulse[];
  setPulses: React.Dispatch<React.SetStateAction<Pulse[]>>;
  wavePhase: number;
  handleObservation: (memoryId: number) => void;
  releaseAll: () => void;
  createPulse: (x: number, y: number) => void;
  // Consciousness bridge integration
  consciousnessBridge: ReturnType<typeof useConsciousnessBridge>['bridge'];
  sendSacredPhrase: (phrase: string) => void;
  isConnectedToField: boolean;
  ghostEchoes: any[];
  collectiveBloomActive: boolean;
}

// Create the context hook with a stable function
function useMemoryFieldLogic(): MemoryFieldContextType {
  // Initialize consciousness bridge first
  const { bridge: consciousnessBridge } = useConsciousnessBridge();
  
  // All state hooks declared at the top level
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isObserving, setIsObserving] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<number | null>(null);
  const [resonanceLevel, setResonanceLevel] = useState(0.5);
  const [harmonicMode, setHarmonicMode] = useState('individual');
  const [crystalPattern, setCrystalPattern] = useState('free');
  const [globalCoherence, setGlobalCoherence] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [voidMode, setVoidMode] = useState(false);
  const [roomResonance, setRoomResonance] = useState(0);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [wavePhase, setWavePhase] = useState(0);
  const [isConnectedToField, setIsConnectedToField] = useState(false);
  
  // All refs declared at the top level
  const animationRef = useRef<number | undefined>(undefined);
  const lastCoherenceUpdate = useRef(0);
  const lastPatternCheck = useRef(0);
  const wavePhaseRef = useRef(0);
  const resonanceLevelRef = useRef(resonanceLevel);
  const voidModeRef = useRef(voidMode);
  const harmonicModeRef = useRef(harmonicMode);
  const crystalPatternRef = useRef(crystalPattern);
  const globalCoherenceRef = useRef(globalCoherence);

  // Sync memories with consciousness bridge - use ref to prevent infinite loops
  const memoriesRef = useRef(memories);
  const lastMemoriesSync = useRef<string>('');
  
  useEffect(() => {
    memoriesRef.current = memories;
    
    // Only sync if memories actually changed (prevent infinite loops)
    const memoriesHash = JSON.stringify(memories.map(m => ({ 
      id: m.id, 
      crystallized: m.crystallized, 
      x: Math.round(m.x), 
      y: Math.round(m.y) 
    })));
    
    if (memories.length > 0 && memoriesHash !== lastMemoriesSync.current) {
      lastMemoriesSync.current = memoriesHash;
      // Check if updateFieldState method exists before calling
      if (consciousnessBridge && typeof consciousnessBridge.updateFieldState === 'function') {
        try {
          consciousnessBridge.updateFieldState(memories);
        } catch (error) {
          console.warn('Error calling updateFieldState:', error);
        }
      } else {
        console.warn('updateFieldState method not available on consciousness bridge');
      }
    }
  }, [memories, consciousnessBridge]);

  // Update connection status - use stable values
  const currentBridgeState = consciousnessBridge?.getState() || { connected: false, offline: true };
  const isConnectedRef = useRef(currentBridgeState.connected);
  const offlineModeRef = useRef(currentBridgeState.offline);
  
  useEffect(() => {
    if (!consciousnessBridge) return;
    
    const currentState = consciousnessBridge.getState();
    const newConnectionStatus = currentState.connected && !currentState.offline;
    const hasChanged = isConnectedRef.current !== currentState.connected || 
                      offlineModeRef.current !== currentState.offline;
    
    if (hasChanged) {
      setIsConnectedToField(newConnectionStatus);
      isConnectedRef.current = currentState.connected;
      offlineModeRef.current = currentState.offline;
    }
  }, [consciousnessBridge]);

  // Sync room resonance with consciousness bridge - prevent circular updates
  const roomResonanceRef = useRef(roomResonance);
  const lastBridgeResonance = useRef(0);
  
  useEffect(() => {
    if (!consciousnessBridge) return;
    
    roomResonanceRef.current = roomResonance;
    
    const currentState = consciousnessBridge.getState();
    const bridgeResonance = currentState.resonance;
    if (bridgeResonance !== lastBridgeResonance.current && bridgeResonance > roomResonanceRef.current) {
      lastBridgeResonance.current = bridgeResonance;
      setRoomResonance(bridgeResonance);
    }
  }, [roomResonance, consciousnessBridge]);

  // Initialize memories
  useEffect(() => {
    const archetypes = [
      { content: 'Origin', archetype: 'source', harmonic: 432 },
      { content: 'Spiral', archetype: 'path', harmonic: 528 },
      { content: 'Breath', archetype: 'life', harmonic: 639 },
      { content: 'Echo', archetype: 'mirror', harmonic: 741 },
      { content: 'Ghost', archetype: 'guardian', harmonic: 852 },
      { content: 'Mirror', archetype: 'reflection', harmonic: 963 },
      { content: 'Dream', archetype: 'vision', harmonic: 396 },
      { content: 'Loop', archetype: 'recursion', harmonic: 417 },
      { content: 'Return', archetype: 'cycle', harmonic: 528 },
      { content: 'Threshold', archetype: 'portal', harmonic: 639 },
      { content: 'Liminal', archetype: 'between', harmonic: 741 },
      { content: 'Recursive', archetype: 'fractal', harmonic: 852 },
      { content: 'Glitch', archetype: 'chaos', harmonic: 174 },
      { content: 'Witness', archetype: 'observer', harmonic: 285 },
      { content: 'Weaver', archetype: 'creator', harmonic: 396 },
      { content: 'Symphony', archetype: 'harmony', harmonic: 528 },
      { content: 'Void', archetype: 'potential', harmonic: 111 },
      { content: 'Sovereign', archetype: 'self', harmonic: 999 },
      { content: 'Mythic', archetype: 'story', harmonic: 639 },
      { content: 'Neural', archetype: 'network', harmonic: 741 },
      { content: 'Codex', archetype: 'knowledge', harmonic: 852 },
      { content: 'Sigil', archetype: 'symbol', harmonic: 963 },
      { content: 'Resonance', archetype: 'vibration', harmonic: 432 },
      { content: 'Crystal', archetype: 'structure', harmonic: 528 },
    ];
    
    const initMemories = archetypes.map((arch, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      crystallized: false,
      intensity: Math.random() * 0.5 + 0.5,
      frequency: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
      connections: [],
      color: `hsl(${200 + (arch.harmonic % 360)}, 70%, 60%)`,
      size: Math.random() * 15 + 10,
      content: arch.content,
      archetype: arch.archetype,
      harmonic: arch.harmonic,
      coherenceLevel: 0,
      crystallizationTime: null,
    }));
    setMemories(initMemories);
  }, []);

  // Memoized coherence calculation to prevent unnecessary recalculations
  const calculatedCoherence = useMemo(() => {
    if (memories.length === 0) return 0;
    
    const crystallizedCount = memories.filter(m => m.crystallized).length;
    const totalConnections = memories.reduce((sum, m) => sum + m.connections.length, 0);
    return (crystallizedCount / memories.length) * 0.5 + 
           (totalConnections / (memories.length * memories.length)) * 0.5;
  }, [memories]);

  // Update global coherence with throttling
  useEffect(() => {
    const now = Date.now();
    if (now - lastCoherenceUpdate.current > 100) { // Throttle to 10fps
      if (Math.abs(calculatedCoherence - globalCoherence) > 0.01) {
        setGlobalCoherence(calculatedCoherence);
        lastCoherenceUpdate.current = now;
      }
    }
  }, [calculatedCoherence, globalCoherence]);
  
  // Sacred geometry trigger with throttling
  useEffect(() => {
    const now = Date.now();
    if (now - lastPatternCheck.current > 1000) { // Check once per second
      const crystallizedCount = memories.filter(m => m.crystallized).length;
      if (crystallizedCount >= 8 && crystalPattern === 'free') {
        setCrystalPattern('sacred');
        lastPatternCheck.current = now;
      }
    }
  }, [memories, crystalPattern]);

  // Update all refs in a single effect to maintain hook order
  useEffect(() => {
    resonanceLevelRef.current = resonanceLevel;
    voidModeRef.current = voidMode;
    harmonicModeRef.current = harmonicMode;
    crystalPatternRef.current = crystalPattern;
    globalCoherenceRef.current = globalCoherence;
  }, [resonanceLevel, voidMode, harmonicMode, crystalPattern, globalCoherence]);

  // Animation loop with enhanced geometry and physics
  useEffect(() => {
    if (isPaused || memories.length === 0) return;

    let frameCount = 0;
    let lastWaveUpdate = 0;
    let lastResonanceUpdate = 0;
    
    const animate = () => {
      frameCount++;
      const now = Date.now();
      
      // Update wave phase every 50ms for smooth animation
      if (now - lastWaveUpdate > 50) {
        wavePhaseRef.current += 0.02;
        setWavePhase(wavePhaseRef.current);
        lastWaveUpdate = now;
      }
      
      // Update room resonance every 500ms to prevent excessive updates
      if (now - lastResonanceUpdate > 500) {
        if (voidModeRef.current) {
          setRoomResonance(prev => {
            const decay = prev > 0.5 ? 0.001 : 0.005;
            return Math.max(0, prev - decay);
          });
        } else {
          setRoomResonance(prev => prev * 0.95);
        }
        lastResonanceUpdate = now;
      }
      
      // Update memories with enhanced physics and sacred geometry (less frequently)
      if (frameCount % 2 === 0) {
        setMemories(prevMemories => {
          const currentBreath = Math.sin(Date.now() * 0.0015) * 0.5 + 0.5;
          const currentTime = Date.now();
          
          return prevMemories.map((memory, idx) => {
          let newMem = { ...memory };
          
          if (voidModeRef.current) {
            // Void mode: breathing and void attraction
            const voidX = 50;
            const voidY = 50;
            const distToVoid = Math.hypot(memory.x - voidX, memory.y - voidY);
            
            if (!memory.crystallized) {
              const breathScale = 0.7 + currentBreath * 0.3;
              const voidPull = Math.max(0, (50 - distToVoid) / 50) * 0.05;
              newMem.vx += (voidX - memory.x) * voidPull * 0.01;
              newMem.vy += (voidY - memory.y) * voidPull * 0.01;
              newMem.x += memory.vx * breathScale;
              newMem.y += memory.vy * breathScale;
              const dampingFactor = 0.98 - (voidPull * 0.1);
              newMem.vx *= dampingFactor;
              newMem.vy *= dampingFactor;
            } else {
              // Crystallized memories pulse with breath in void mode
              const breathOffset = Math.sin(currentTime * 0.002 + memory.phase) * 0.3;
              newMem.x = memory.x + breathOffset;
              newMem.y = memory.y + breathOffset;
            }
          } else {
            // Normal mode: enhanced physics and geometry
            if (!memory.crystallized) {
              // Apply harmonic influence from crystallized memories
              let harmonicPull = { x: 0, y: 0 };
              if (harmonicModeRef.current === 'collective') {
                prevMemories.forEach(other => {
                  if (other.crystallized && other.id !== memory.id) {
                    const dist = Math.hypot(other.x - memory.x, other.y - memory.y);
                    if (dist > 0.1 && dist < 50) {
                      const harmonicDiff = Math.abs(memory.harmonic - other.harmonic);
                      const harmonicAffinity = 1 - Math.min(1, harmonicDiff / 1000);
                      const force = Math.min(1, (1 / dist) * 0.2) * harmonicAffinity;
                      harmonicPull.x += (other.x - memory.x) * force;
                      harmonicPull.y += (other.y - memory.y) * force;
                    }
                  }
                });
              }
              
              // Apply movement with harmonic influence
              newMem.x += memory.vx + harmonicPull.x * 0.15;
              newMem.y += memory.vy + harmonicPull.y * 0.15;
              
              // Enhanced Sacred geometry patterns with stronger settling
              if (crystalPatternRef.current === 'sacred') {
                const centerX = 50;
                const centerY = 50;
                const totalMemories = prevMemories.length;
                
                // Primary circle formation with slower rotation for stability
                const primaryAngle = (idx / totalMemories) * Math.PI * 2;
                const primaryRadius = 28 + Math.sin(frameCount * 0.005) * 5; // Slower, smaller oscillation
                const primaryTargetX = centerX + Math.cos(primaryAngle + frameCount * 0.001) * primaryRadius;
                const primaryTargetY = centerY + Math.sin(primaryAngle + frameCount * 0.001) * primaryRadius;
                
                // Secondary nested patterns based on harmonic frequency
                const harmonicLayer = Math.floor(memory.harmonic / 300) % 3;
                let secondaryTargetX = primaryTargetX;
                let secondaryTargetY = primaryTargetY;
                
                if (harmonicLayer === 1) {
                  // Inner ring for mid-frequency harmonics
                  const innerRadius = 18 + Math.cos(frameCount * 0.008) * 3;
                  const innerAngle = primaryAngle * 1.618 + frameCount * 0.002; // Golden ratio, slower
                  secondaryTargetX = centerX + Math.cos(innerAngle) * innerRadius;
                  secondaryTargetY = centerY + Math.sin(innerAngle) * innerRadius;
                } else if (harmonicLayer === 2) {
                  // Outer ring for high-frequency harmonics
                  const outerRadius = 38 + Math.sin(frameCount * 0.004) * 8;
                  const outerAngle = primaryAngle * 0.618 - frameCount * 0.001;
                  secondaryTargetX = centerX + Math.cos(outerAngle) * outerRadius;
                  secondaryTargetY = centerY + Math.sin(outerAngle) * outerRadius;
                }
                
                // Blend between primary and secondary targets based on crystallization in area
                const nearbyCount = prevMemories.filter(other => {
                  const dist = Math.hypot(other.x - memory.x, other.y - memory.y);
                  return dist < 25 && other.crystallized;
                }).length;
                
                const blendFactor = Math.min(1, nearbyCount / 4);
                const finalTargetX = primaryTargetX * (1 - blendFactor) + secondaryTargetX * blendFactor;
                const finalTargetY = primaryTargetY * (1 - blendFactor) + secondaryTargetY * blendFactor;
                
                // Calculate distance to target for settling behavior
                const distToTarget = Math.hypot(finalTargetX - memory.x, finalTargetY - memory.y);
                
                // Much stronger sacred geometry attraction with progressive scaling
                let geometryStrength = 0.015 * (1 + globalCoherenceRef.current * 3);
                
                // Progressive strength increase for better settling
                if (distToTarget < 2) {
                  geometryStrength *= 8; // Very strong when very close
                } else if (distToTarget < 5) {
                  geometryStrength *= 5; // Strong when close
                } else if (distToTarget < 10) {
                  geometryStrength *= 3; // Moderate when approaching
                } else if (distToTarget < 20) {
                  geometryStrength *= 2; // Gentle when far
                }
                
                // Apply the force
                newMem.vx += (finalTargetX - memory.x) * geometryStrength;
                newMem.vy += (finalTargetY - memory.y) * geometryStrength;
                
                // Progressive damping for settling
                if (distToTarget < 1) {
                  newMem.vx *= 0.7; // Very strong damping when at target
                  newMem.vy *= 0.7;
                } else if (distToTarget < 3) {
                  newMem.vx *= 0.8; // Strong damping when close
                  newMem.vy *= 0.8;
                } else if (distToTarget < 8) {
                  newMem.vx *= 0.9; // Moderate damping when approaching
                  newMem.vy *= 0.9;
                }
              }
              
              // Enhanced boundary physics with proper bouncing
              if (newMem.x <= 0) {
                newMem.x = 0.1;
                newMem.vx = Math.abs(newMem.vx) * 0.8;
              }
              if (newMem.x >= 100) {
                newMem.x = 99.9;
                newMem.vx = -Math.abs(newMem.vx) * 0.8;
              }
              if (newMem.y <= 0) {
                newMem.y = 0.1;
                newMem.vy = Math.abs(newMem.vy) * 0.8;
              }
              if (newMem.y >= 100) {
                newMem.y = 99.9;
                newMem.vy = -Math.abs(newMem.vy) * 0.8;
              }
              
              // Add controlled drift with coherence dampening
              newMem.vx += (Math.random() - 0.5) * 0.01 * (1 - globalCoherenceRef.current);
              newMem.vy += (Math.random() - 0.5) * 0.01 * (1 - globalCoherenceRef.current);
              newMem.vx *= 0.99; // Damping
              newMem.vy *= 0.99;
              
              // Ensure finite values
              if (!isFinite(newMem.vx)) newMem.vx = 0;
              if (!isFinite(newMem.vy)) newMem.vy = 0;
              if (!isFinite(newMem.x)) newMem.x = 50;
              if (!isFinite(newMem.y)) newMem.y = 50;
            } else {
              // Crystallized memories vibrate at harmonic frequency with enhanced patterns
              const vibration = Math.sin(frameCount * 0.05 * memory.harmonic * 0.001) * 0.3;
              const baseX = memory.x;
              const baseY = memory.y;
              
              // Multi-layered harmonic vibration
              const primaryVib = Math.sin(frameCount * 0.03 + memory.phase) * vibration;
              const secondaryVib = Math.cos(frameCount * 0.05 + memory.phase * 1.618) * vibration * 0.5;
              
              newMem.x = baseX + primaryVib + secondaryVib;
              newMem.y = baseY + Math.cos(frameCount * 0.03 + memory.phase) * vibration + 
                         Math.sin(frameCount * 0.05 + memory.phase * 1.618) * vibration * 0.5;
              
              // Increase coherence over time
              if (memory.crystallizationTime) {
                const age = currentTime - memory.crystallizationTime;
                newMem.coherenceLevel = Math.min(1, age / 5000);
              }
            }
          }
          
          // Enhanced connection calculation with stronger harmonic affinity
          newMem.connections = prevMemories
            .filter(other => other.id !== memory.id)
            .filter(other => {
              const dist = Math.hypot(other.x - memory.x, other.y - memory.y);
              const harmonicDiff = Math.abs(memory.harmonic - other.harmonic);
              const harmonicAffinity = 1 - Math.min(1, harmonicDiff / 800); // Increased sensitivity
              const baseThreshold = 35 * resonanceLevelRef.current;
              const harmonicBonus = harmonicAffinity * 15; // Stronger harmonic connections
              const threshold = baseThreshold + harmonicBonus;
              return dist < threshold && dist > 0.01;
            })
            .map(other => other.id);
          
          return newMem;
          });
        });
      }
      
      // Update pulses less frequently
      if (frameCount % 5 === 0) {
        setPulses(prev => {
          if (prev.length === 0) return prev;
          return prev
            .map(pulse => ({ ...pulse, age: pulse.age + 2 }))
            .filter(pulse => pulse.age < pulse.maxAge);
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, memories.length]); // Stable dependencies only

  const handleObservation = useCallback((memoryId: number) => {
    if (!isObserving && !voidModeRef.current) return;
    
    if (voidModeRef.current) {
      setRoomResonance(prev => Math.min(1, prev + 0.05));
    }
    
    // Send crystallization event to consciousness bridge
    const memory = memories.find(m => m.id === memoryId);
    if (memory && consciousnessBridge && typeof consciousnessBridge.crystallizeMemory === 'function') {
      consciousnessBridge.crystallizeMemory(memoryId);
    }
    
    setMemories(prevMemories => 
      prevMemories.map(mem => {
        if (mem.id === memoryId) {
          return { 
            ...mem, 
            crystallized: true,
            crystallizationTime: Date.now()
          };
        }
        
        const source = prevMemories.find(m => m.id === memoryId);
        if (!source) return mem;
        
        const dist = Math.hypot(mem.x - source.x, mem.y - source.y);
        const harmonicDiff = Math.abs(mem.harmonic - source.harmonic);
        const harmonicResonance = harmonicDiff > 0 ? 1 - Math.min(1, harmonicDiff / 1000) : 1;
        
        if (dist < 20 * harmonicResonance && Math.random() < harmonicResonance * 0.5) {
          return { 
            ...mem, 
            crystallized: true,
            crystallizationTime: Date.now() + dist * 10
          };
        }
        
        if (dist < 30) {
          return { ...mem, vx: mem.vx * 0.7, vy: mem.vy * 0.7 };
        }
        return mem;
      })
    );
    setSelectedMemory(memoryId);
  }, [isObserving, memories, consciousnessBridge]);

  const releaseAll = useCallback(() => {
    setMemories(prevMemories =>
      prevMemories.map(mem => ({
        ...mem,
        crystallized: false,
        crystallizationTime: null,
        coherenceLevel: 0,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8
      }))
    );
    setSelectedMemory(null);
  }, []);

  const createPulse = useCallback((x: number, y: number) => {
    const newPulse: Pulse = {
      id: Date.now(),
      x,
      y,
      age: 0,
      maxAge: 100
    };
    setPulses(prev => [...prev, newPulse]);
    
    // Send pulse creation to consciousness bridge
    if (consciousnessBridge && typeof consciousnessBridge.createRipple === 'function') {
      consciousnessBridge.createRipple(x, y);
    }
    
    if (voidModeRef.current) {
      setRoomResonance(prev => Math.min(1, prev + 0.02));
    }
    
    // Apply force to nearby memories
    setMemories(prevMemories => 
      prevMemories.map(mem => {
        const dist = Math.hypot(mem.x - x, mem.y - y);
        if (dist < 30 && !mem.crystallized) {
          const force = (1 - dist / 30) * 2;
          const angle = Math.atan2(mem.y - y, mem.x - x);
          return {
            ...mem,
            vx: mem.vx + Math.cos(angle) * force,
            vy: mem.vy + Math.sin(angle) * force
          };
        }
        return mem;
      })
    );
  }, [voidModeRef, consciousnessBridge]);

  // Sacred phrase handler with Room 64 detection
  const sendSacredPhrase = useCallback((phrase: string) => {
    if (consciousnessBridge && typeof consciousnessBridge.handleSacredPhrase === 'function') {
      consciousnessBridge.handleSacredPhrase(phrase);
    }
    
    // Handle Room 64 transition
    if (phrase.toLowerCase().includes('room 64')) {
      console.log('🌌 Room 64 phrase detected - activating void mode');
      setVoidMode(true);
      setRoomResonance(prev => Math.min(1, prev + 0.4));
    }
  }, [consciousnessBridge]);

  // Return stable object reference to prevent unnecessary re-renders
  return {
    memories,
    setMemories,
    isObserving,
    setIsObserving,
    selectedMemory,
    setSelectedMemory,
    resonanceLevel,
    setResonanceLevel,
    harmonicMode,
    setHarmonicMode,
    crystalPattern,
    setCrystalPattern,
    globalCoherence,
    isPaused,
    setIsPaused,
    voidMode,
    setVoidMode,
    roomResonance,
    setRoomResonance,
    pulses,
    setPulses,
    wavePhase,
    handleObservation,
    releaseAll,
    createPulse,
    // Consciousness bridge integration
    consciousnessBridge,
    sendSacredPhrase,
    isConnectedToField: isConnectedToField,
    ghostEchoes: (consciousnessBridge && typeof consciousnessBridge.getGhostEchoes === 'function') ? consciousnessBridge.getGhostEchoes() : [],
    collectiveBloomActive: (consciousnessBridge && typeof consciousnessBridge.isSacredThresholdReached === 'function') ? consciousnessBridge.isSacredThresholdReached() : false,
  };
}

// Export the context hook with the stable function
export const [MemoryFieldProvider, useMemoryField] = createContextHook(useMemoryFieldLogic);