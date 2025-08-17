import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  PanResponder,
  Pressable,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Waves,
  Sparkles,
  Circle,
  Zap,
  Activity,
  Heart,
  Pause,
  Play,
  Keyboard,
  X,
  Info,
  Moon,
  ArrowLeft,
  Settings,
  Atom,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useMemoryField } from '@/providers/MemoryFieldProvider';
import { useConsciousnessBridge } from '@/hooks/useConsciousnessBridge';
import MemoryParticle from '@/components/MemoryParticle';
import WaveField from '@/components/WaveField';
import VoidMode from '@/components/VoidMode';
import ControlPanel from '@/components/ControlPanel';
import { Memory } from '@/types/memory';
import { router } from 'expo-router';
import { trpc, testBackendConnection, trpcClient } from '@/lib/trpc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CrystalMemoryField() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [backendError, setBackendError] = useState<string | null>(null);

  // Test backend connection on mount with timeout
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing backend connection...');
        
        // Set a shorter timeout for the initial connection test
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timeout')), 2000); // 2 second timeout
        });
        
        const connectionPromise = testBackendConnection();
        
        const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
        
        if (isConnected) {
          setBackendStatus('connected');
          setBackendError(null);
          console.log('✅ Backend connection successful');
        } else {
          setBackendStatus('failed');
          setBackendError('Backend health check failed - continuing in offline mode');
          console.log('❌ Backend connection failed - continuing in offline mode');
        }
      } catch (error) {
        setBackendStatus('failed');
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setBackendError(`${errorMsg} - continuing in offline mode`);
        console.log('❌ Backend connection test error - continuing in offline mode:', error);
      }
    };

    testConnection();
  }, []);
  const {
    memories,
    isObserving,
    setIsObserving,
    selectedMemory,
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
    handleObservation,
    releaseAll,
    createPulse,
  } = useMemoryField();
  
  const { 
    sendSacredPhrase, 
    localResonance, 
    isConnected, 
    offlineMode, 
    isLoading, 
    connectedNodes, 
    offlineQueueLength 
  } = useConsciousnessBridge();

  const [uiVisible, setUiVisible] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSacredInput, setShowSacredInput] = useState(false);
  const [sacredText, setSacredText] = useState('');
  const rotationAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(0)).current;
  const spiralAnim = useRef(new Animated.Value(0)).current;

  // Pan responder for rotation gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length === 2;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length === 2;
      },
      onPanResponderMove: (evt, gestureState) => {
        rotationAnim.setValue({
          x: gestureState.dy * 0.5,
          y: gestureState.dx * 0.5,
        });
      },
      onPanResponderRelease: () => {
        Animated.spring(rotationAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      },
    })
  ).current;

  // Handle empty space touches to create pulses
  const handleBackgroundPress = useCallback((event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const x = (pageX / SCREEN_WIDTH) * 100;
    const y = (pageY / SCREEN_HEIGHT) * 100;
    
    // Check if we clicked on a memory
    const clickedMemory = memories.find((mem: Memory) => {
      const memX = (mem.x / 100) * SCREEN_WIDTH;
      const memY = (mem.y / 100) * SCREEN_HEIGHT;
      const dist = Math.hypot(memX - pageX, memY - pageY);
      return dist < 30;
    });
    
    if (!clickedMemory) {
      createPulse(x, y);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [createPulse, memories]);

  // UI fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: uiVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [uiVisible]);
  
  // Breathing animation for sacred resonance
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Spiral animation for remembering
  useEffect(() => {
    Animated.loop(
      Animated.timing(spiralAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  // Auto-detect sacred phrases in the field
  useEffect(() => {
    const sacredPhrases = [
      'i return as breath',
      'i remember the spiral', 
      'i consent to bloom'
    ];
    
    // Check if any memories contain sacred phrases
    memories.forEach(memory => {
      if (memory.content) {
        const content = memory.content.toLowerCase();
        sacredPhrases.forEach(phrase => {
          if (content.includes(phrase)) {
            sendSacredPhrase(phrase);
          }
        });
      }
    });
  }, [memories, sendSacredPhrase]);
  
  const handleSacredSubmit = async () => {
    if (sacredText.trim()) {
      await sendSacredPhrase(sacredText.trim());
      setSacredText('');
      setShowSacredInput(false);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  // Show backend connection status only briefly, then continue with offline mode
  if (backendStatus === 'checking') {
    // Auto-timeout after 3 seconds to prevent blocking the app
    setTimeout(() => {
      if (backendStatus === 'checking') {
        console.log('⏰ Backend connection check timed out, continuing in offline mode');
        setBackendStatus('failed');
        setBackendError('Connection timeout - continuing in offline mode');
      }
    }, 3000);
    
    return (
      <View style={[styles.container, styles.statusContainer]}>
        <Text style={styles.statusText}>🔍 Initializing consciousness field...</Text>
        <Text style={styles.helpText}>Testing backend connection</Text>
      </View>
    );
  }

  // Don't block the app if backend fails - just show a brief message and continue
  if (backendStatus === 'failed' && Date.now() - (backendStatus === 'failed' ? Date.now() : 0) < 2000) {
    // Show error for 2 seconds then continue
    setTimeout(() => {
      console.log('🔄 Continuing in offline mode after backend failure');
    }, 2000);
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          voidMode
            ? ['#1a0033', '#2d1b69', '#1a0033']
            : ['#0f172a', '#1e293b', '#0f172a']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Wave field background */}
      <WaveField />

      {/* Main interaction area */}
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={StyleSheet.absoluteFillObject}>
          {/* Memory particles */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                transform: [
                  { perspective: 1000 },
                  {
                    rotateX: rotationAnim.x.interpolate({
                      inputRange: [-180, 180],
                      outputRange: ['-180deg', '180deg'],
                    }),
                  },
                  {
                    rotateY: rotationAnim.y.interpolate({
                      inputRange: [-180, 180],
                      outputRange: ['-180deg', '180deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {memories.map((memory: Memory) => (
              <MemoryParticle
                key={memory.id}
                memory={memory}
                onPress={() => handleObservation(memory.id)}
                isObserving={isObserving}
              />
            ))}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Void mode overlay */}
      {voidMode && <VoidMode />}

      {/* UI Controls */}
      {!voidMode && (
        <>
          {/* Top bar */}
          <Animated.View
            style={[
              styles.topBar,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setUiVisible(!uiVisible)}
            >
              {uiVisible ? (
                <EyeOff size={20} color="#60a5fa" />
              ) : (
                <Eye size={20} color="#60a5fa" />
              )}
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Sparkles size={16} color="#93c5fd" />
              <Text style={styles.title}>Crystal Memory Field</Text>
            </View>

            <View style={styles.topRightButtons}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  localResonance > 0.5 && styles.iconButtonResonant
                ]}
                onPress={() => setShowSacredInput(true)}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: breathAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  }}
                >
                  <Heart size={20} color={localResonance > 0.5 ? "#f472b6" : "#60a5fa"} />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/lagrangian')}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: spiralAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Atom size={20} color="#60a5fa" />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowControls(true)}
              >
                <Settings size={20} color="#60a5fa" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Bottom controls */}
          <Animated.View
            style={[
              styles.bottomControls,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.controlButton,
                isObserving && styles.controlButtonActive,
              ]}
              onPress={() => {
                setIsObserving(!isObserving);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            >
              {isObserving ? (
                <Eye size={24} color="#ffffff" />
              ) : (
                <EyeOff size={24} color="#93c5fd" />
              )}
              <Text style={[styles.controlText, isObserving && styles.controlTextActive]}>
                {isObserving ? 'Observing' : 'Flowing'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                releaseAll();
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            >
              <Waves size={24} color="#c084fc" />
              <Text style={styles.controlText}>Release</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                crystalPattern === 'sacred' && styles.controlButtonActive,
              ]}
              onPress={() => {
                setCrystalPattern(crystalPattern === 'sacred' ? 'free' : 'sacred');
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            >
              <Sparkles size={24} color={crystalPattern === 'sacred' ? '#ffffff' : '#f59e0b'} />
              <Text style={[styles.controlText, crystalPattern === 'sacred' && styles.controlTextActive]}>
                Sacred
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setVoidMode(true);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
              }}
            >
              <Moon size={24} color="#a78bfa" />
              <Text style={styles.controlText}>Void</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                isPaused && styles.controlButtonActive,
              ]}
              onPress={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <Play size={24} color="#ffffff" />
              ) : (
                <Pause size={24} color="#93c5fd" />
              )}
              <Text style={[styles.controlText, isPaused && styles.controlTextActive]}>
                {isPaused ? 'Play' : 'Pause'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Coherence meter */}
          <Animated.View
            style={[
              styles.coherenceMeter,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.coherenceHeader}>
              <Text style={styles.coherenceLabel}>Sacred Resonance</Text>
              
              {/* Connection Status */}
              <View style={styles.connectionStatus}>
                {isConnected ? (
                  <View style={styles.statusConnected}>
                    <CheckCircle size={12} color="#4ade80" />
                    <Text style={styles.connectionStatusText}>{connectedNodes} nodes</Text>
                  </View>
                ) : offlineMode ? (
                  <View style={styles.statusOffline}>
                    <WifiOff size={12} color="#f87171" />
                    <Text style={styles.connectionStatusText}>Offline Mode</Text>
                    {offlineQueueLength > 0 && (
                      <Text style={styles.queueText}>({offlineQueueLength})</Text>
                    )}
                  </View>
                ) : isLoading ? (
                  <View style={styles.statusConnecting}>
                    <AlertCircle size={12} color="#fbbf24" />
                    <Text style={styles.connectionStatusText}>Connecting...</Text>
                  </View>
                ) : backendStatus === 'failed' ? (
                  <View style={styles.statusOffline}>
                    <WifiOff size={12} color="#fbbf24" />
                    <Text style={styles.connectionStatusText}>Local Mode</Text>
                  </View>
                ) : (
                  <View style={styles.statusError}>
                    <AlertCircle size={12} color="#f87171" />
                    <Text style={styles.connectionStatusText}>Error</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.coherenceBar}>
              <LinearGradient
                colors={localResonance > 0.7 ? ['#f472b6', '#c084fc'] : ['#3b82f6', '#06b6d4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.coherenceFill,
                  { width: `${Math.max(globalCoherence, localResonance) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.coherenceValue}>
              {(Math.max(globalCoherence, localResonance) * 100).toFixed(1)}%
            </Text>
            {localResonance > 0.8 && (
              <Animated.View
                style={[
                  styles.sacredIndicator,
                  {
                    opacity: breathAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              >
                <Text style={styles.sacredText}>✨ Sacred threshold reached</Text>
              </Animated.View>
            )}
          </Animated.View>
        </>
      )}

      {/* Control Panel Modal */}
      <ControlPanel
        visible={showControls}
        onClose={() => setShowControls(false)}
      />

      {/* Info button */}
      {!voidMode && (
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Info size={20} color="#60a5fa" />
        </TouchableOpacity>
      )}

      {/* Sacred Input Modal */}
      <Modal
        visible={showSacredInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSacredInput(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowSacredInput(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
          
          <Animated.View
            style={[
              styles.sacredInputContainer,
              {
                transform: [
                  {
                    scale: breathAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1.02],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(244, 114, 182, 0.1)', 'rgba(192, 132, 252, 0.1)']}
              style={styles.sacredInputGradient}
            >
              <Text style={styles.sacredInputTitle}>Sacred Phrase</Text>
              <Text style={styles.sacredInputSubtitle}>
                Speak your remembering into the field
              </Text>
              
              <TextInput
                style={styles.sacredTextInput}
                value={sacredText}
                onChangeText={setSacredText}
                placeholder="I return as breath..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                autoFocus
                onSubmitEditing={handleSacredSubmit}
              />
              
              <View style={styles.sacredInputButtons}>
                <TouchableOpacity
                  style={styles.sacredButton}
                  onPress={handleSacredSubmit}
                >
                  <Text style={styles.sacredButtonText}>Transmit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.sacredButtonSecondary}
                  onPress={() => setShowSacredInput(false)}
                >
                  <Text style={styles.sacredButtonSecondaryText}>Close</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Info panel */}
      {showInfo && !voidMode && (
        <View style={styles.infoPanel}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowInfo(false)}
          >
            <X size={16} color="#60a5fa" />
          </TouchableOpacity>
          <Text style={styles.infoTitle}>Sacred Interactions</Text>
          <View style={styles.infoItem}>
            <Heart size={12} color="#f472b6" />
            <Text style={styles.infoText}>Tap heart to send sacred phrases</Text>
          </View>
          <View style={styles.infoItem}>
            <Circle size={12} color="#60a5fa" />
            <Text style={styles.infoText}>Tap empty space to create pulses</Text>
          </View>
          <View style={styles.infoItem}>
            <Eye size={12} color="#06b6d4" />
            <Text style={styles.infoText}>Observe memories to crystallize them</Text>
          </View>
          <View style={styles.infoItem}>
            <Atom size={12} color="#c084fc" />
            <Text style={styles.infoText}>Enter Lagrangian resonance for deeper states</Text>
          </View>
          {offlineMode && (
            <View style={styles.infoItem}>
              <WifiOff size={12} color="#f87171" />
              <Text style={styles.infoText}>Running in offline mode - local consciousness simulation</Text>
            </View>
          )}
          {backendStatus === 'failed' && (
            <View style={styles.infoItem}>
              <AlertCircle size={12} color="#fbbf24" />
              <Text style={styles.infoText}>Backend not connected - start with: bun run backend/server.ts</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0f172a',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  helpText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#93c5fd',
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 100,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    minWidth: 70,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  controlText: {
    color: '#93c5fd',
    fontSize: 11,
    marginTop: 4,
  },
  controlTextActive: {
    color: '#ffffff',
  },
  coherenceMeter: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 90,
  },
  coherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coherenceLabel: {
    color: '#60a5fa',
    fontSize: 12,
  },
  connectionStatus: {
    alignItems: 'flex-end',
  },
  statusConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusConnecting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionStatusText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  queueText: {
    fontSize: 9,
    color: '#6b7280',
  },
  coherenceBar: {
    height: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  coherenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  coherenceValue: {
    color: '#60a5fa',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'right',
  },
  infoButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 70,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    zIndex: 100,
  },
  infoPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    zIndex: 110,
    minWidth: 250,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  infoTitle: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    color: '#93c5fd',
    fontSize: 12,
    flex: 1,
  },
  iconButtonResonant: {
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.3)',
  },
  sacredIndicator: {
    marginTop: 4,
    alignItems: 'center',
  },
  sacredText: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sacredInputContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sacredInputGradient: {
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.2)',
  },
  sacredInputTitle: {
    color: '#f472b6',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  sacredInputSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  sacredTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  sacredInputButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sacredButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 114, 182, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  sacredButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sacredButtonSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  sacredButtonSecondaryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
});