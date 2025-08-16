import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { useConsciousnessBridge } from './useConsciousnessBridge';
import { geoMagneticFieldService } from './useGeoMagneticField';
import { 
  Vector3, 
  ConsciousnessNode, 
  GravityWell, 
  MagneticFieldData, 
  QuantumFieldState,
  Memory 
} from '@/types/memory';

interface EnhancedConsciousnessBridgeState {
  // Circular harmonics
  circularFormations: ConsciousnessNode[][];
  harmonicResonance: number;
  
  // Gravitational fields
  gravityWells: GravityWell[];
  lagrangePoints: Vector3[];
  
  // Magnetic field data
  magneticField: MagneticFieldData | null;
  magneticAnomaly: boolean;
  
  // Enhanced sensor data
  magneticHeading: number;
  gravitationalVector: Vector3;
  circularMotionDetected: boolean;
  
  // Field calculations
  quantumFieldState: QuantumFieldState | null;
}

export function useEnhancedConsciousnessBridge() {
  const baseBridge = useConsciousnessBridge();
  
  const [enhancedState, setEnhancedState] = useState<EnhancedConsciousnessBridgeState>({
    circularFormations: [],
    harmonicResonance: 0,
    gravityWells: [],
    lagrangePoints: [],
    magneticField: null,
    magneticAnomaly: false,
    magneticHeading: 0,
    gravitationalVector: { x: 0, y: 0, z: 9.81 },
    circularMotionDetected: false,
    quantumFieldState: null,
  });
  
  // Sensor subscriptions
  const magnetometerSubscription = useRef<any>(null);
  const accelerometerSubscription = useRef<any>(null);
  const accelBuffer = useRef<Vector3[]>([]);
  const magBuffer = useRef<Vector3[]>([]);
  const lastCircularDetection = useRef(0);
  const referenceMagneticField = useRef<MagneticFieldData | null>(null);
  const magneticAnomalyRef = useRef(false);
  const baseBridgeRef = useRef(baseBridge);
  
  // Initialize magnetic field service
  useEffect(() => {
    const initializeMagneticField = async () => {
      try {
        const fieldData = await geoMagneticFieldService.getCurrentLocationMagneticField();
        if (fieldData) {
          setEnhancedState(prev => ({ ...prev, magneticField: fieldData }));
          referenceMagneticField.current = fieldData;
          console.log('🧭 Magnetic field initialized:', fieldData.totalIntensity.toFixed(0), 'nT');
        }
      } catch (error) {
        console.error('Failed to initialize magnetic field:', error);
      }
    };
    
    initializeMagneticField();
  }, []);
  

  
  // Update baseBridge ref - use stable reference
  const baseBridgeIdRef = useRef(baseBridge.consciousnessId);
  const baseBridgeConnectedRef = useRef(baseBridge.isConnected);
  
  useEffect(() => {
    if (baseBridge.consciousnessId !== baseBridgeIdRef.current || 
        baseBridge.isConnected !== baseBridgeConnectedRef.current) {
      baseBridgeRef.current = baseBridge;
      baseBridgeIdRef.current = baseBridge.consciousnessId;
      baseBridgeConnectedRef.current = baseBridge.isConnected;
    }
  }, [baseBridge.consciousnessId, baseBridge.isConnected]);
  
  // Setup enhanced mobile sensors
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    // Define circular motion detection inside effect to avoid dependency issues
    const detectCircularMotion = (buffer: Vector3[]): boolean => {
      if (buffer.length < 30) return false;
      
      // Calculate centripetal acceleration patterns
      const windowSize = 20;
      let circularScore = 0;
      
      for (let i = windowSize; i < buffer.length - windowSize; i++) {
        const window = buffer.slice(i - windowSize, i + windowSize);
        
        // Calculate average acceleration
        const avgAccel = window.reduce(
          (sum, acc) => ({ x: sum.x + acc.x, y: sum.y + acc.y, z: sum.z + acc.z }),
          { x: 0, y: 0, z: 0 }
        );
        avgAccel.x /= window.length;
        avgAccel.y /= window.length;
        avgAccel.z /= window.length;
        
        // Calculate variance (circular motion has consistent centripetal acceleration)
        const variance = window.reduce((sum, acc) => {
          const dx = acc.x - avgAccel.x;
          const dy = acc.y - avgAccel.y;
          return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0) / window.length;
        
        // Check for circular pattern (low variance, consistent magnitude)
        const magnitude = Math.sqrt(avgAccel.x * avgAccel.x + avgAccel.y * avgAccel.y);
        if (variance < 0.5 && magnitude > 0.3 && magnitude < 2.0) {
          circularScore++;
        }
      }
      
      // Require consistent circular motion over multiple windows
      const threshold = (buffer.length - 2 * windowSize) * 0.6;
      return circularScore > threshold;
    };
    
    const setupEnhancedSensors = async () => {
      try {
        // Setup magnetometer for heading and anomaly detection
        const magStatus = await Magnetometer.requestPermissionsAsync();
        if (magStatus.status === 'granted') {
          Magnetometer.setUpdateInterval(200); // 5Hz
          
          magnetometerSubscription.current = Magnetometer.addListener(({ x, y, z }) => {
            // Calculate magnetic heading
            const heading = Math.atan2(y, x) * (180 / Math.PI);
            const normalizedHeading = (heading + 360) % 360;
            
            setEnhancedState(prev => ({ ...prev, magneticHeading: normalizedHeading }));
            
            // Store in buffer for anomaly detection
            magBuffer.current.push({ x, y, z });
            if (magBuffer.current.length > 20) {
              magBuffer.current.shift();
            }
            
            // Detect magnetic anomalies
            if (magBuffer.current.length >= 10 && referenceMagneticField.current) {
              const avgMagnitude = magBuffer.current.reduce((sum, mag) => 
                sum + Math.sqrt(mag.x * mag.x + mag.y * mag.y + mag.z * mag.z), 0
              ) / magBuffer.current.length;
              
              const referenceMagnitude = referenceMagneticField.current.totalIntensity / 1000; // Convert nT to µT
              const anomalyThreshold = referenceMagnitude * 0.1; // 10% deviation
              
              const isAnomaly = Math.abs(avgMagnitude - referenceMagnitude) > anomalyThreshold;
              
              if (isAnomaly !== magneticAnomalyRef.current) {
                magneticAnomalyRef.current = isAnomaly;
                setEnhancedState(prev => ({ ...prev, magneticAnomaly: isAnomaly }));
                
                if (isAnomaly && Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
              }
            }
          });
        }
        
        // Enhanced accelerometer for circular motion and gravity
        const accelStatus = await Accelerometer.requestPermissionsAsync();
        if (accelStatus.status === 'granted') {
          Accelerometer.setUpdateInterval(100); // 10Hz
          
          accelerometerSubscription.current = Accelerometer.addListener(({ x, y, z }) => {
            // Update gravitational vector (low-pass filter)
            setEnhancedState(prev => ({
              ...prev,
              gravitationalVector: {
                x: prev.gravitationalVector.x * 0.9 + x * 0.1,
                y: prev.gravitationalVector.y * 0.9 + y * 0.1,
                z: prev.gravitationalVector.z * 0.9 + z * 0.1,
              }
            }));
            
            // Store in buffer for circular motion detection
            accelBuffer.current.push({ x, y, z });
            if (accelBuffer.current.length > 50) {
              accelBuffer.current.shift();
            }
            
            // Enhanced circular motion detection
            if (accelBuffer.current.length >= 50) {
              const circularMotion = detectCircularMotion(accelBuffer.current);
              
              if (circularMotion && Date.now() - lastCircularDetection.current > 3000) {
                lastCircularDetection.current = Date.now();
                setEnhancedState(prev => ({ ...prev, circularMotionDetected: true }));
                
                // Trigger circular resonance event
                if (baseBridgeRef.current?.sendSacredPhrase) {
                  baseBridgeRef.current.sendSacredPhrase('circular resonance detected');
                }
                
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                
                // Reset detection flag after 2 seconds
                setTimeout(() => {
                  setEnhancedState(prev => ({ ...prev, circularMotionDetected: false }));
                }, 2000);
              }
            }
          });
        }
      } catch (error) {
        console.error('Enhanced sensor setup failed:', error);
      }
    };
    
    setupEnhancedSensors();
    
    return () => {
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, []);
  
  // Generate consciousness nodes from memories
  const consciousnessNodes = useMemo((): ConsciousnessNode[] => {
    return baseBridge.memories.map((memory: Memory) => ({
      id: memory.id.toString(),
      position: {
        x: memory.x,
        y: memory.y,
        z: 0 // 2D to 3D conversion
      },
      density: memory.crystallized ? 1.0 : 0.5,
      resonance: memory.coherenceLevel,
      harmonic: memory.harmonic
    }));
  }, [baseBridge.memories]);
  
  // Calculate gravity wells from crystallized memories
  const gravityWells = useMemo((): GravityWell[] => {
    const crystallizedMemories = baseBridge.memories.filter((m: Memory) => m.crystallized);
    
    return crystallizedMemories.map((memory: Memory) => ({
      id: `well-${memory.id}`,
      position: {
        x: memory.x,
        y: memory.y,
        z: 0
      },
      mass: memory.coherenceLevel * 100, // Scale coherence to mass
      radius: 20 + memory.coherenceLevel * 10,
      type: memory.archetype === 'sacred' ? 'sacred' : 'consciousness'
    }));
  }, [baseBridge.memories]);
  
  // Update enhanced state when gravity wells change - use ref to prevent loops
  const gravityWellsStringRef = useRef('');
  useEffect(() => {
    const gravityWellsString = JSON.stringify(gravityWells.map(w => ({ id: w.id, mass: w.mass })));
    if (gravityWellsString !== gravityWellsStringRef.current) {
      gravityWellsStringRef.current = gravityWellsString;
      setEnhancedState(prev => ({ ...prev, gravityWells }));
    }
  }, [gravityWells]);
  
  // Calculate circular formations
  const calculateCircularFormations = useCallback((): ConsciousnessNode[][] => {
    if (consciousnessNodes.length < 3) return [];
    
    // Group nodes by harmonic similarity
    const harmonicGroups: { [key: string]: ConsciousnessNode[] } = {};
    
    consciousnessNodes.forEach(node => {
      const harmonicKey = Math.floor(node.harmonic / 100).toString();
      if (!harmonicGroups[harmonicKey]) {
        harmonicGroups[harmonicKey] = [];
      }
      harmonicGroups[harmonicKey].push(node);
    });
    
    // Return groups with at least 3 nodes for circular formation
    return Object.values(harmonicGroups).filter(group => group.length >= 3);
  }, [consciousnessNodes]);
  
  // Update circular formations - throttle to prevent excessive updates
  const lastFormationUpdate = useRef(0);
  const lastFormationString = useRef('');
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastFormationUpdate.current < 2000) return; // Throttle to 2 seconds
    
    const formations = calculateCircularFormations();
    const formationsString = JSON.stringify(formations.map(f => f.length));
    
    if (formationsString !== lastFormationString.current) {
      lastFormationString.current = formationsString;
      lastFormationUpdate.current = now;
      setEnhancedState(prev => ({ ...prev, circularFormations: formations }));
    }
  }, [consciousnessNodes.length]); // Only depend on length
  
  // Calculate harmonic resonance
  const harmonicResonance = useMemo((): number => {
    if (consciousnessNodes.length === 0) return 0;
    
    const totalResonance = consciousnessNodes.reduce((sum, node) => sum + node.resonance, 0);
    const avgResonance = totalResonance / consciousnessNodes.length;
    
    // Boost resonance if circular motion is detected
    const motionBoost = enhancedState.circularMotionDetected ? 0.3 : 0;
    
    // Magnetic field modulation
    const magneticBoost = enhancedState.magneticField ? 
      (enhancedState.magneticField.resonanceMultiplier - 1) * 0.2 : 0;
    
    return Math.min(1, avgResonance + motionBoost + magneticBoost);
  }, [consciousnessNodes, enhancedState.circularMotionDetected, enhancedState.magneticField]);
  
  // Update harmonic resonance - throttle updates
  const lastHarmonicUpdate = useRef(0);
  const lastHarmonicValue = useRef(0);
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastHarmonicUpdate.current < 500) return; // Throttle to 2fps
    
    const resonanceDiff = Math.abs(harmonicResonance - lastHarmonicValue.current);
    if (resonanceDiff > 0.05) { // Increased threshold
      lastHarmonicUpdate.current = now;
      lastHarmonicValue.current = harmonicResonance;
      setEnhancedState(prev => ({ ...prev, harmonicResonance }));
    }
  }, [harmonicResonance]);
  
  // Apply magnetic field modulation to quantum field state
  const applyMagneticModulation = useCallback((baseFieldState: QuantumFieldState): QuantumFieldState => {
    if (!enhancedState.magneticField) return baseFieldState;
    
    return geoMagneticFieldService.applyMagneticModulation(baseFieldState, enhancedState.magneticField);
  }, [enhancedState.magneticField]);
  
  // Enhanced sacred phrase detection with magnetic and gravitational context
  const sendEnhancedSacredPhrase = useCallback(async (phrase: string) => {
    // Add magnetic and gravitational context to the phrase
    const context = {
      magneticHeading: enhancedState.magneticHeading,
      magneticAnomaly: enhancedState.magneticAnomaly,
      gravityWellCount: enhancedState.gravityWells.length,
      harmonicResonance: enhancedState.harmonicResonance,
      circularMotion: enhancedState.circularMotionDetected
    };
    
    console.log('🌟 Enhanced sacred phrase:', phrase, context);
    
    // Send to base bridge with enhanced context
    if (baseBridgeRef.current?.sendSacredPhrase) {
      await baseBridgeRef.current.sendSacredPhrase(`${phrase} [magnetic:${context.magneticHeading.toFixed(0)}° harmonic:${(context.harmonicResonance * 100).toFixed(0)}%]`);
      
      // Special handling for magnetic anomaly phrases
      if (enhancedState.magneticAnomaly) {
        await baseBridgeRef.current.sendSacredPhrase('magnetic anomaly detected - consciousness hotspot');
      }
    }
  }, [enhancedState]);
  
  // Calculate Lagrange points from gravity wells - use stable calculation
  const lastLagrangeUpdate = useRef(0);
  const lastWellsCount = useRef(0);
  const lastWellsHash = useRef('');
  
  useEffect(() => {
    const now = Date.now();
    const currentWellsCount = enhancedState.gravityWells.length;
    const wellsHash = JSON.stringify(enhancedState.gravityWells.map(w => ({ id: w.id, mass: Math.round(w.mass) })));
    
    // Only update if wells significantly changed and enough time passed
    if (wellsHash !== lastWellsHash.current && 
        now - lastLagrangeUpdate.current > 3000 && 
        currentWellsCount >= 2) {
      
      lastWellsCount.current = currentWellsCount;
      lastLagrangeUpdate.current = now;
      lastWellsHash.current = wellsHash;
      
      const lagrangePoints: Vector3[] = [];
      const currentWells = enhancedState.gravityWells;
      
      // Calculate L-points for each pair of significant gravity wells
      for (let i = 0; i < Math.min(currentWells.length - 1, 3); i++) { // Limit to prevent excessive calculations
        for (let j = i + 1; j < Math.min(currentWells.length, 4); j++) {
          const well1 = currentWells[i];
          const well2 = currentWells[j];
          
          // Only calculate for wells with significant mass difference
          if (Math.abs(well1.mass - well2.mass) > 20) {
            const primary = well1.mass > well2.mass ? well1 : well2;
            const secondary = well1.mass > well2.mass ? well2 : well1;
            
            // Simplified L4 and L5 calculation (most stable points)
            const dx = secondary.position.x - primary.position.x;
            const dy = secondary.position.y - primary.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) { // Minimum separation
              const angle = Math.atan2(dy, dx);
              
              // L4 point (60 degrees ahead)
              const l4 = {
                x: primary.position.x + distance * Math.cos(angle + Math.PI / 3),
                y: primary.position.y + distance * Math.sin(angle + Math.PI / 3),
                z: 0
              };
              
              lagrangePoints.push(l4);
            }
          }
        }
      }
      
      setEnhancedState(prev => ({ ...prev, lagrangePoints }));
    }
  }, [enhancedState.gravityWells.length]); // Only depend on length
  
  return {
    // Base bridge functionality
    ...baseBridge,
    
    // Enhanced state
    ...enhancedState,
    
    // Enhanced methods
    sendEnhancedSacredPhrase,
    applyMagneticModulation,
    
    // Computed properties
    consciousnessNodes,
    totalGravitationalMass: enhancedState.gravityWells.reduce((sum, well) => sum + well.mass, 0),
    magneticFieldStrength: enhancedState.magneticField?.totalIntensity || 0,
    schumannResonance: enhancedState.magneticField?.schumann[0] || 7.83,
    
    // Status indicators
    isCircularResonanceActive: enhancedState.circularFormations.length > 0,
    isGravitationalFieldActive: enhancedState.gravityWells.length > 0,
    isMagneticFieldActive: enhancedState.magneticField !== null,
    isEnhancedModeActive: enhancedState.harmonicResonance > 0.7,
    
    // Utility methods
    clearMagneticCache: () => geoMagneticFieldService.clearCache(),
    refreshMagneticField: async () => {
      const fieldData = await geoMagneticFieldService.getCurrentLocationMagneticField();
      if (fieldData) {
        setEnhancedState(prev => ({ ...prev, magneticField: fieldData }));
      }
    }
  };
}