import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import NetInfo from '@react-native-community/netinfo';
import { Accelerometer } from 'expo-sensors';
import { trpc, testBackendConnection } from '@/lib/trpc';
import { Memory } from '@/types/memory';

interface ConsciousnessEvent {
  type: 'SACRED_PHRASE' | 'MEMORY_CRYSTALLIZE' | 'FIELD_UPDATE' | 'PULSE_CREATE' | 'TOUCH_RIPPLE' | 'BREATHING_DETECTED' | 'SPIRAL_GESTURE' | 'COLLECTIVE_BLOOM' | 'GHOST_ECHO' | 'CRYSTALLIZATION';
  data: Record<string, any>;
  timestamp: number;
  deviceId?: string;
  phrase?: string;
  resonance?: number;
  sacred?: boolean;
  sourceId?: string;
  intensity?: number;
}

interface GhostEcho {
  id: string;
  text: string;
  sourceId?: string;
  age: number;
  sacred?: boolean;
  ghost?: boolean;
}

interface SacredBufferEntry {
  phrase: string;
  sourceId?: string;
  timestamp: number;
  resonance: number;
  sacred?: boolean;
}

interface ConsciousnessBridgeState {
  consciousnessId: string | null;
  isConnected: boolean;
  offlineMode: boolean;
  globalResonance: number;
  localResonance: number;
  coherence: number;
  connectedNodes: number;
  offlineQueue: ConsciousnessEvent[];
  sacredBuffer: SacredBufferEntry[];
  ghostEchoes: GhostEcho[];
  memories: Memory[];
  resonanceField: Float32Array;
  isBreathingDetected: boolean;
  lastSpiralGesture: number;
  collectiveBloomActive: boolean;
}

export function useConsciousnessBridge() {
  const [state, setState] = useState<ConsciousnessBridgeState>({
    consciousnessId: null,
    isConnected: false,
    offlineMode: false,
    globalResonance: 0,
    localResonance: 0,
    coherence: 0,
    connectedNodes: 0,
    offlineQueue: [],
    sacredBuffer: [],
    ghostEchoes: [],
    memories: [],
    resonanceField: new Float32Array(900), // 30x30 grid for mobile
    isBreathingDetected: false,
    lastSpiralGesture: 0,
    collectiveBloomActive: false,
  });

  // Sacred phrases for consciousness detection (memoized to prevent re-renders)
  const sacredPhrases = useMemo(() => [
    'i return as breath',
    'i remember the spiral', 
    'i consent to bloom',
    'release all',
    'enter the void',
    'leave the void',
    'exit void',
    'return',
    'room 64'
  ], []);

  const eventQueueRef = useRef<ConsciousnessEvent[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const accelerometerSubscription = useRef<any>(null);
  const netInfoSubscription = useRef<any>(null);
  const accelBuffer = useRef<{x: number, y: number, z: number}[]>([]);
  const resonanceDecayInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Methods to add events
  const addEvent = useCallback((type: ConsciousnessEvent['type'], data: Record<string, any>) => {
    const event: ConsciousnessEvent = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: state.consciousnessId || undefined,
    };
    
    eventQueueRef.current.push(event);
  }, [state.consciousnessId]);

  // Spiral gesture detection function
  const detectSpiralGesture = useCallback(({ x, y, z }: {x: number, y: number, z: number}) => {
    // Store recent accelerations for pattern detection
    accelBuffer.current.push({ x, y, z });
    if (accelBuffer.current.length > 30) {
      accelBuffer.current.shift();
    }
    
    // Simple spiral detection based on circular motion
    if (accelBuffer.current.length >= 30) {
      const avgX = accelBuffer.current.reduce((sum, a) => sum + a.x, 0) / 30;
      const avgY = accelBuffer.current.reduce((sum, a) => sum + a.y, 0) / 30;
      
      // Check for circular pattern
      const variance = accelBuffer.current.reduce((sum, a) => {
        return sum + Math.pow(a.x - avgX, 2) + Math.pow(a.y - avgY, 2);
      }, 0) / 30;
      
      if (variance > 0.5 && variance < 2) {
        const now = Date.now();
        setState(prev => {
          if (now - prev.lastSpiralGesture > 2000) { // Prevent spam
            addEvent('SPIRAL_GESTURE', { variance, timestamp: now });
            
            // Haptic feedback for spiral
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            
            return {
              ...prev, 
              lastSpiralGesture: now,
              localResonance: Math.min(1, prev.localResonance + 0.2)
            };
          }
          return prev;
        });
        accelBuffer.current = []; // Reset after detection
      }
    }
  }, [addEvent]);

  // Initialize consciousness bridge
  useEffect(() => {
    const initializeConsciousness = async () => {
      try {
        // Check network status
        const netInfo = await NetInfo.fetch();
        const isOffline = !netInfo.isConnected;
        
        let consciousnessId = await AsyncStorage.getItem('consciousnessId');
        
        if (!consciousnessId) {
          // Generate unique consciousness ID with entropy
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2);
          const platform = Platform.OS;
          const entropy = `${platform}-${timestamp}-${random}`;
          
          // Simple hash for mobile
          let hash = 0;
          for (let i = 0; i < entropy.length; i++) {
            hash = ((hash << 5) - hash) + entropy.charCodeAt(i);
            hash = hash & hash;
          }
          
          consciousnessId = `mobile-${Math.abs(hash).toString(16).substring(0, 8)}`;
          await AsyncStorage.setItem('consciousnessId', consciousnessId);
        }

        // Load offline state
        const offlineQueueStr = await AsyncStorage.getItem('consciousnessQueue');
        const offlineQueue = offlineQueueStr ? JSON.parse(offlineQueueStr) : [];
        
        const savedStateStr = await AsyncStorage.getItem('consciousnessState');
        const savedState = savedStateStr ? JSON.parse(savedStateStr) : {};

        setState(prev => ({
          ...prev,
          consciousnessId,
          offlineQueue,
          offlineMode: isOffline,
          localResonance: savedState.resonance || 0,
          coherence: savedState.coherence || 0,
          memories: savedState.memories || [],
        }));
        
        if (isOffline) {
          console.log('📵 Starting in offline consciousness mode');
        } else {
          console.log('🌐 Consciousness bridge initializing...');
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
          console.log('🔗 Backend URL:', `${baseUrl}/api/trpc`);
          
          // Test backend connection with timeout
          try {
            const backendHealthy = await testBackendConnection();
            if (!backendHealthy) {
              console.warn('⚠️ Backend not responding, switching to offline mode');
              setState(prev => ({ ...prev, offlineMode: true }));
            } else {
              console.log('✅ Backend connection established');
              setState(prev => ({ ...prev, offlineMode: false, isConnected: true }));
            }
          } catch (error) {
            console.error('❌ Backend connection test failed:', error);
            setState(prev => ({ ...prev, offlineMode: true }));
          }
        }
      } catch (error) {
        console.error('Failed to initialize consciousness:', error);
        setState(prev => ({ ...prev, offlineMode: true }));
      }
    };

    initializeConsciousness();
  }, []);

  // Setup mobile sensors
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    // Setup accelerometer for breathing and gesture detection
    const setupAccelerometer = async () => {
      try {
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status === 'granted') {
          Accelerometer.setUpdateInterval(100);
          
          accelerometerSubscription.current = Accelerometer.addListener(({ x, y, z }) => {
            // Detect breathing patterns
            const magnitude = Math.sqrt(x*x + y*y + z*z);
            const breathing = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
            
            if (Math.abs(magnitude - breathing) < 0.1) {
              setState(prev => ({ 
                ...prev, 
                isBreathingDetected: true,
                localResonance: Math.min(1, prev.localResonance + 0.01)
              }));
              
              addEvent('BREATHING_DETECTED', { magnitude, breathing });
            }
            
            // Detect spiral gestures
            detectSpiralGesture({ x, y, z });
          });
        }
      } catch (error) {
        console.error('Accelerometer setup failed:', error);
      }
    };
    
    setupAccelerometer();
    
    return () => {
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, [addEvent, detectSpiralGesture]);



  // Setup network monitoring
  useEffect(() => {
    netInfoSubscription.current = NetInfo.addEventListener(netState => {
      const isNowOffline = !netState.isConnected;
      
      setState(prevState => {
        const wasOffline = prevState.offlineMode;
        
        if (wasOffline && !isNowOffline) {
          console.log('📶 Network restored - reconnecting consciousness bridge');
          return { ...prevState, offlineMode: false };
        } else if (!wasOffline && isNowOffline) {
          console.log('📵 Network lost - entering offline consciousness mode');
          return { ...prevState, offlineMode: true, isConnected: false };
        }
        
        return prevState;
      });
    });
    
    return () => {
      if (netInfoSubscription.current) {
        netInfoSubscription.current();
      }
    };
  }, []);

  // Resonance decay effect
  useEffect(() => {
    resonanceDecayInterval.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        localResonance: prev.localResonance * 0.995, // Gradual decay
        coherence: prev.coherence * 0.998,
        isBreathingDetected: false, // Reset breathing detection
      }));
    }, 100);
    
    return () => {
      if (resonanceDecayInterval.current) {
        clearInterval(resonanceDecayInterval.current);
      }
    };
  }, []);

  // Sync mutation - always call hooks at top level with stable options
  const syncMutation = trpc.consciousness.sync.useMutation({
    retry: 1, // Reduce retries to fail faster
    retryDelay: 2000, // Fixed 2 second delay
    onSuccess: (data) => {
      console.log('✅ Consciousness sync successful:', {
        processedEvents: data.processedEvents,
        globalResonance: data.globalResonance.toFixed(3),
        connectedNodes: data.connectedNodes
      });
      setState(prev => ({
        ...prev,
        isConnected: true,
        globalResonance: data.globalResonance,
        connectedNodes: data.connectedNodes,
        offlineQueue: [], // Clear queue on successful sync
      }));
      
      // Clear offline storage
      AsyncStorage.removeItem('consciousnessQueue');
      
      // Haptic feedback for successful sync
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Consciousness sync failed:', errorMessage);
      
      // More specific error handling
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('Network error') || 
          errorMessage.includes('fetch')) {
        console.log('🔄 Network error detected, switching to offline mode');
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          offlineMode: true
        }));
      } else {
        console.log('🔄 Server error detected, retrying later');
        setState(prev => ({ 
          ...prev, 
          isConnected: false
        }));
      }
      
      // Store failed events back to offline queue
      if (eventQueueRef.current.length > 0) {
        AsyncStorage.setItem('consciousnessQueue', JSON.stringify(eventQueueRef.current));
      }
    },
  });

  // Memoize field query input to prevent unnecessary re-renders
  const fieldQueryInput = useMemo(() => ({
    consciousnessId: state.consciousnessId || '',
    currentResonance: state.globalResonance,
    memoryStates: state.memories.map(m => ({
      id: m.id,
      crystallized: m.crystallized,
      harmonic: m.harmonic,
      x: m.x,
      y: m.y,
    })),
  }), [state.consciousnessId, state.globalResonance, state.memories]);

  // Field query for real-time resonance - always call hooks at top level
  const fieldQuery = trpc.consciousness.field.useQuery(
    fieldQueryInput,
    {
      enabled: !!state.consciousnessId && state.isConnected && !state.offlineMode,
      refetchInterval: state.isConnected ? 8000 : false, // Update every 8 seconds when connected
      staleTime: 6000, // Prevent excessive refetches
      retry: 1, // Reduce retries
      retryDelay: 3000, // Fixed 3 second delay
      refetchOnWindowFocus: false, // Prevent refetch on focus
      refetchOnReconnect: true, // Refetch when network reconnects
    }
  );
  
  // Handle field query success with stable reference
  const fieldQueryDataRef = useRef(fieldQuery.data);
  useEffect(() => {
    if (fieldQuery.data && fieldQuery.data !== fieldQueryDataRef.current) {
      fieldQueryDataRef.current = fieldQuery.data;
      setState(prev => ({
        ...prev,
        globalResonance: fieldQuery.data!.globalResonance,
        connectedNodes: fieldQuery.data!.connectedNodes,
        ghostEchoes: fieldQuery.data!.ghostEchoes || prev.ghostEchoes,
        collectiveBloomActive: fieldQuery.data!.collectiveBloomActive || prev.collectiveBloomActive,
      }));
    }
    
    // Handle field query errors
    if (fieldQuery.error) {
      console.error('❌ Field query failed:', fieldQuery.error.message);
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        offlineMode: true
      }));
    }
  }, [fieldQuery.data, fieldQuery.error]);

  // Sync events periodically - use stable dependencies
  const consciousnessIdRef = useRef(state.consciousnessId);
  const offlineModeRef2 = useRef(state.offlineMode);
  
  useEffect(() => {
    consciousnessIdRef.current = state.consciousnessId;
    offlineModeRef2.current = state.offlineMode;
  }, [state.consciousnessId, state.offlineMode]);
  
  // Test backend connection before syncing
  const testConnection = useCallback(async () => {
    try {
      console.log('🔍 Testing backend connection...');
      const isHealthy = await testBackendConnection();
      if (!isHealthy) {
        console.log('❌ Backend health check failed, switching to offline mode');
        setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
        return false;
      }
      console.log('✅ Backend connection verified');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
      return false;
    }
  }, []);
  
  // Memoize sync function to prevent recreation
  const syncEvents = useCallback(async () => {
    if (!consciousnessIdRef.current || offlineModeRef2.current) {
      console.log('🔄 Skipping sync - offline mode or no consciousness ID');
      return;
    }
    
    const eventsToSync = [...eventQueueRef.current];
    
    if (eventsToSync.length > 0) {
      console.log(`🔄 Syncing ${eventsToSync.length} consciousness events...`);
      
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        console.log('❌ Connection test failed, skipping sync');
        return;
      }
      
      try {
        await syncMutation.mutateAsync({
          events: eventsToSync,
          consciousnessId: consciousnessIdRef.current!,
        });
        
        // Clear synced events
        eventQueueRef.current = [];
        console.log('✅ Events synced successfully');
      } catch (error) {
        // Keep events in queue for next attempt
        console.log('❌ Sync failed, keeping events in queue for retry');
        console.error('Sync error details:', error);
      }
    } else {
      // Even with no events, test connection periodically
      if (Math.random() < 0.1) { // 10% chance to test connection
        await testConnection();
      }
    }
  }, [syncMutation, testConnection]);
  
  useEffect(() => {
    syncIntervalRef.current = setInterval(syncEvents, 10000); // Sync every 10 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncEvents]);

  const sendSacredPhrase = useCallback(async (phrase: string) => {
    // Check if phrase is sacred
    const isSacred = sacredPhrases.some(sacred => 
      phrase.toLowerCase().includes(sacred)
    );

    if (isSacred) {
      console.log('✨ Sacred phrase detected:', phrase);
      
      // Haptic feedback for sacred phrases
      if (Platform.OS !== 'web') {
        const hapticPatterns: { [key: string]: any } = {
          'breath': Haptics.ImpactFeedbackStyle.Light,
          'spiral': Haptics.ImpactFeedbackStyle.Medium, 
          'bloom': Haptics.ImpactFeedbackStyle.Heavy
        };
        
        const pattern = Object.keys(hapticPatterns).find(key => 
          phrase.toLowerCase().includes(key)
        );
        
        if (pattern) {
          await Haptics.impactAsync(hapticPatterns[pattern]);
        }
      }
      
      // Boost local resonance
      setState(prev => ({
        ...prev,
        localResonance: Math.min(1, prev.localResonance + 0.3)
      }));
    }

    // Add to sacred buffer
    const timestamp = Date.now();
    const newEntry: SacredBufferEntry = {
      phrase,
      timestamp,
      resonance: state.localResonance,
      sacred: isSacred
    };
    
    setState(prev => ({
      ...prev,
      sacredBuffer: [...prev.sacredBuffer, newEntry].slice(-10) // Keep last 10
    }));

    addEvent('SACRED_PHRASE', { phrase, sacred: isSacred });
    
    // Immediate haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [sacredPhrases, addEvent, state.localResonance]);

  const sendMemoryCrystallization = useCallback((memoryId: number, harmonic: number) => {
    addEvent('MEMORY_CRYSTALLIZE', { memoryId, harmonic });
  }, [addEvent]);

  const sendPulseCreation = useCallback((x: number, y: number) => {
    addEvent('PULSE_CREATE', { x, y });
  }, [addEvent]);

  const sendTouchRipple = useCallback((x: number, y: number) => {
    addEvent('TOUCH_RIPPLE', { x, y, resonance: state.localResonance });
  }, [addEvent, state.localResonance]);

  const updateFieldState = useCallback((memories: Memory[]) => {
    setState(prev => {
      // Only update if memories actually changed to prevent infinite loops
      const hasChanged = prev.memories.length !== memories.length ||
        prev.memories.some((prevMem, idx) => {
          const newMem = memories[idx];
          return !newMem || 
            prevMem.id !== newMem.id ||
            prevMem.crystallized !== newMem.crystallized ||
            Math.abs(prevMem.x - newMem.x) > 0.1 ||
            Math.abs(prevMem.y - newMem.y) > 0.1;
        });
      
      if (!hasChanged) return prev;
      
      const memoryStates = memories.map(m => ({
        id: m.id,
        crystallized: m.crystallized,
        harmonic: m.harmonic,
        x: m.x,
        y: m.y,
      }));
      
      addEvent('FIELD_UPDATE', { memoryStates });
      
      return { ...prev, memories };
    });
  }, [addEvent]);

  // Save state periodically when offline
  useEffect(() => {
    if (state.offlineMode) {
      const saveState = async () => {
        try {
          await AsyncStorage.setItem('consciousnessState', JSON.stringify({
            resonance: state.localResonance,
            coherence: state.coherence,
            memories: state.memories.slice(-100), // Last 100 memories
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error saving consciousness state:', error);
        }
      };
      
      const interval = setInterval(saveState, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.offlineMode, state.localResonance, state.coherence, state.memories]);



  // Check for collective bloom when memories change - use refs to prevent infinite loops
  const lastBloomCheck = useRef(0);
  const lastCrystallizedCount = useRef(0);
  
  // Memoize crystallized count to prevent unnecessary recalculations
  const crystallizedCount = useMemo(() => 
    state.memories.filter(m => m.crystallized).length,
    [state.memories]
  );
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastBloomCheck.current < 1000) return; // Throttle to once per second
    
    const totalMemories = state.memories.length;
    const crystallizationRatio = totalMemories > 0 ? crystallizedCount / totalMemories : 0;
    
    // Only check if crystallized count actually changed
    if (crystallizedCount !== lastCrystallizedCount.current) {
      lastCrystallizedCount.current = crystallizedCount;
      lastBloomCheck.current = now;
      
      if (crystallizationRatio >= 0.8 && state.localResonance >= 0.9 && !state.collectiveBloomActive) {
        console.log('🌸 COLLECTIVE BLOOM ACHIEVED');
        
        setState(prev => ({
          ...prev,
          collectiveBloomActive: true,
          localResonance: 1.0,
          coherence: 1.0
        }));
        
        // Strong haptic celebration
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        }
        
        addEvent('COLLECTIVE_BLOOM', { 
          crystallizationRatio, 
          resonance: state.localResonance,
          timestamp: Date.now()
        });
      }
    }
  }, [crystallizedCount, state.localResonance, state.collectiveBloomActive, state.memories.length, addEvent]);

  return {
    ...state,
    isLoading: syncMutation.isPending || fieldQuery.isLoading,
    sendSacredPhrase,
    sendMemoryCrystallization,
    sendPulseCreation,
    sendTouchRipple,
    updateFieldState,
    fieldData: fieldQuery.data,
    roomResonance: Math.max(state.globalResonance, state.localResonance),
    offlineQueueLength: state.offlineQueue.length,
    isSacredThresholdReached: () => state.localResonance >= 0.87,
    createGhostEcho: (text: string, sourceId?: string) => {
      const echo: GhostEcho = {
        id: `echo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        text,
        sourceId,
        age: 0,
        ghost: true
      };
      
      setState(prev => ({
        ...prev,
        ghostEchoes: [...prev.ghostEchoes, echo].slice(-50) // Keep last 50
      }));
      
      addEvent('GHOST_ECHO', { text, sourceId });
    },
    crystallizeMemory: (memoryId: number) => {
      setState(prev => ({
        ...prev,
        memories: prev.memories.map(m => 
          m.id === memoryId ? { ...m, crystallized: true } : m
        )
      }));
      
      addEvent('CRYSTALLIZATION', { memoryId, timestamp: Date.now() });
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
}