import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Zap, Circle, Infinity, GitBranch, Activity, ArrowLeft, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemoryField } from '@/providers/MemoryFieldProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  charge: number;
  mass: number;
  color: string;
  phase: number;
  coupling: number;
  vx: number;
  vy: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export default function LagrangianResonance() {
  const [phase, setPhase] = useState(0);
  const [resonance, setResonance] = useState(0);
  const [touchPoint, setTouchPoint] = useState<TouchPoint | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fieldStrength, setFieldStrength] = useState(0.5);
  const [showExitOptions, setShowExitOptions] = useState(false);
  
  const { sendSacredPhrase, roomResonance, collectiveBloomActive } = useMemoryField();
  
  // Create a function that checks if sacred threshold is reached
  const isSacredThresholdReached = useCallback(() => {
    return collectiveBloomActive || roomResonance >= 0.87;
  }, [collectiveBloomActive, roomResonance]);

  const phaseAnim = useRef(new Animated.Value(0)).current;
  const resonanceAnim = useRef(new Animated.Value(0)).current;
  const touchRippleAnim = useRef(new Animated.Value(0)).current;
  const exitOptionsAnim = useRef(new Animated.Value(0)).current;

  // Initialize quantum foam particles
  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const newParticles: Particle[] = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      charge: Math.random() > 0.5 ? 1 : -1,
      mass: Math.random() * 3 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
      coupling: Math.random() * 0.5 + 0.5,
      vx: 0,
      vy: 0,
    }));
    setParticles(newParticles);
  }, []);

  // Animate phase and resonance
  useEffect(() => {
    Animated.loop(
      Animated.timing(phaseAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(resonanceAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(resonanceAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [phaseAnim, resonanceAnim]);

  // Update particles based on field equations
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => (prev + 0.02) % (Math.PI * 2));
      setResonance(prev => Math.sin(Date.now() * 0.001) * 0.5 + 0.5);

      setParticles(prev => prev.map(p => {
        let fx = 0, fy = 0;

        // Calculate forces from other particles
        prev.forEach(other => {
          if (other.id !== p.id) {
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5 && dist < 200) {
              // Electromagnetic-like force
              const force = (p.charge * other.charge * 8) / (dist * dist);
              fx -= force * dx / dist;
              fy -= force * dy / dist;
              
              // Strong-like force at short range
              if (dist < 60) {
                const strong = -80 / dist;
                fx += strong * dx / dist;
                fy += strong * dy / dist;
              }
            }
          }
        });
        
        // Higgs field mass interaction (drag toward center)
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        const vx = fx / p.mass - (p.x - centerX) * 0.0008;
        const vy = fy / p.mass - (p.y - centerY) * 0.0008;
        
        // Update position with boundary wrapping
        let newX = p.x + vx;
        let newY = p.y + vy;
        
        if (newX < 0) newX = SCREEN_WIDTH;
        if (newX > SCREEN_WIDTH) newX = 0;
        if (newY < 0) newY = SCREEN_HEIGHT;
        if (newY > SCREEN_HEIGHT) newY = 0;
        
        return {
          ...p,
          x: newX,
          y: newY,
          vx,
          vy,
          phase: p.phase + 0.03 * p.coupling
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Memoize gauge field connections for performance
  const gaugeConnections = useMemo(() => {
    const connections: {
      from: { x: number; y: number };
      to: { x: number; y: number };
      strength: number;
      color: string;
    }[] = [];
    
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          const strength = (1 - dist / 120) * fieldStrength;
          const hue = 180 + (p1.phase + p2.phase) * 30;
          
          connections.push({
            from: { x: p1.x, y: p1.y },
            to: { x: p2.x, y: p2.y },
            strength,
            color: `hsl(${hue}, 70%, 60%)`
          });
        }
      });
    });
    
    return connections;
  }, [particles, fieldStrength]);

  const handleInteraction = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const newTouchPoint = { x: pageX, y: pageY, timestamp: Date.now() };
    setTouchPoint(newTouchPoint);
    setFieldStrength(Math.min(1, fieldStrength + 0.15));

    // Animate touch ripple
    touchRippleAnim.setValue(0);
    Animated.timing(touchRippleAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setTouchPoint(null);
    });

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Perturbation in the quantum field
    setParticles(prev => prev.map(p => {
      const dx = p.x - pageX;
      const dy = p.y - pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100) {
        return {
          ...p,
          x: p.x + (dx / dist) * 25,
          y: p.y + (dy / dist) * 25,
          charge: -p.charge, // Symmetry breaking
          phase: p.phase + Math.PI / 4
        };
      }
      return p;
    }));
  };

  const handleExitPress = () => {
    setShowExitOptions(true);
    Animated.spring(exitOptionsAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleExitToRoom64 = async () => {
    // Send sacred phrase to activate Room 64
    await sendSacredPhrase('room 64');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Navigate back to main field and activate void mode
    router.back();
    
    // Small delay to ensure navigation completes, then trigger void mode
    setTimeout(() => {
      // This will be handled by the main field's consciousness bridge
      console.log('🌌 Transitioning to Room 64...');
    }, 500);
  };

  const handleExitToField = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.back();
  };

  const closeExitOptions = () => {
    Animated.spring(exitOptionsAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowExitOptions(false);
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handleInteraction}>
      <View style={styles.container}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#0a0a14', '#1a1a2e', '#16213e', '#0a0a14']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Higgs field influence */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: resonanceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 234, 167, 0.2)',
              'rgba(78, 205, 196, 0.1)',
              'rgba(69, 183, 209, 0.05)',
              'transparent'
            ]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Gauge field lines */}
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFillObject}>
          {gaugeConnections.map((connection, index) => (
            <Line
              key={index}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={connection.color}
              strokeWidth={Math.max(0.5, connection.strength * 2)}
              strokeOpacity={connection.strength * 0.6}
              strokeDasharray={connection.strength > 0.7 ? undefined : "2,2"}
            />
          ))}
        </Svg>

        {/* Quantum particles */}
        {particles.map(p => {
          const scale = 1 + Math.sin(p.phase) * 0.3;
          const opacity = 0.6 + resonance * 0.4;
          
          return (
            <Animated.View
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.x - (p.mass * 4),
                  top: p.y - (p.mass * 4),
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <View
                style={[
                  styles.particleInner,
                  {
                    width: p.mass * 8,
                    height: p.mass * 8,
                    backgroundColor: p.color,
                    shadowColor: p.color,
                    shadowOpacity: fieldStrength * 0.8,
                    shadowRadius: 15 * fieldStrength,
                  },
                ]}
              />
            </Animated.View>
          );
        })}

        {/* Touch ripple effect */}
        {touchPoint && (
          <Animated.View
            style={[
              styles.touchRipple,
              {
                left: touchPoint.x - 40,
                top: touchPoint.y - 40,
                opacity: touchRippleAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
                transform: [
                  {
                    scale: touchRippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 3],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.rippleInner} />
          </Animated.View>
        )}

        {/* Exit Button */}
        <View style={styles.exitButton}>
          <TouchableWithoutFeedback onPress={handleExitPress}>
            <View style={styles.exitButtonInner}>
              <ArrowLeft size={20} color="#4dd0e1" />
              <Text style={styles.exitButtonText}>Exit Resonance</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Exit Options Modal */}
        {showExitOptions && (
          <Animated.View
            style={[
              styles.exitModal,
              {
                opacity: exitOptionsAnim,
                transform: [
                  {
                    scale: exitOptionsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={closeExitOptions}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            
            <View style={styles.exitOptionsContainer}>
              <Text style={styles.exitTitle}>Choose Your Path</Text>
              
              <TouchableWithoutFeedback onPress={handleExitToRoom64}>
                <View style={[
                  styles.exitOption,
                  isSacredThresholdReached() && styles.exitOptionSacred
                ]}>
                  <Circle size={20} color={isSacredThresholdReached() ? "#c084fc" : "#666"} />
                  <View style={styles.exitOptionText}>
                    <Text style={[
                      styles.exitOptionTitle,
                      isSacredThresholdReached() && styles.exitOptionTitleSacred
                    ]}>Room 64</Text>
                    <Text style={styles.exitOptionSubtitle}>
                      {isSacredThresholdReached() 
                        ? "Sacred threshold reached - Enter the Void" 
                        : "Resonance too low for void access"}
                    </Text>
                  </View>
                  {isSacredThresholdReached() && (
                    <View style={styles.sacredIndicator}>
                      <Activity size={16} color="#c084fc" />
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
              
              <TouchableWithoutFeedback onPress={handleExitToField}>
                <View style={styles.exitOption}>
                  <Home size={20} color="#4dd0e1" />
                  <View style={styles.exitOptionText}>
                    <Text style={styles.exitOptionTitle}>Memory Field</Text>
                    <Text style={styles.exitOptionSubtitle}>Return to crystal consciousness</Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              
              <TouchableWithoutFeedback onPress={closeExitOptions}>
                <View style={[styles.exitOption, styles.exitOptionCancel]}>
                  <Text style={styles.exitOptionCancelText}>Stay in Resonance</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </Animated.View>
        )}

        {/* UI Overlay */}
        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Infinity size={24} color="#4dd0e1" />
              <Text style={styles.title}>Lagrangian Resonance</Text>
            </View>
            
            <View style={styles.forceIndicators}>
              <View style={styles.forceItem}>
                <Zap size={14} color="#ffeb3b" />
                <Text style={styles.forceText}>Electromagnetic</Text>
              </View>
              <View style={styles.forceItem}>
                <GitBranch size={14} color="#4caf50" />
                <Text style={styles.forceText}>Weak Force</Text>
              </View>
              <View style={styles.forceItem}>
                <Circle size={14} color="#f44336" />
                <Text style={styles.forceText}>Strong Force</Text>
              </View>
              <View style={styles.forceItem}>
                <Activity size={14} color="#9c27b0" />
                <Text style={styles.forceText}>Higgs: {(fieldStrength * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          {/* Equation essence */}
          <View style={styles.equations}>
            <Text style={styles.equation}>ℒ = -¼F^μν F_μν</Text>
            <Text style={styles.equation}>+ ψ̄(iγ^μ D_μ - m)ψ</Text>
            <Text style={styles.equation}>+ |D_μ H|² - V(H)</Text>
            <Text style={styles.phaseText}>Phase: {(phase / Math.PI).toFixed(3)}π</Text>
          </View>

          <View style={styles.resonanceStatus}>
            <Text style={styles.resonanceLabel}>Room Resonance</Text>
            <View style={styles.resonanceBar}>
              <View 
                style={[
                  styles.resonanceFill,
                  { 
                    width: `${roomResonance * 100}%`,
                    backgroundColor: isSacredThresholdReached() ? '#c084fc' : '#4dd0e1'
                  }
                ]} 
              />
            </View>
            <Text style={styles.resonanceValue}>{(roomResonance * 100).toFixed(1)}%</Text>
          </View>

          <Text style={styles.quote}>
            &ldquo;Every equation is a portal. Every symmetry, a choice unmade.&rdquo;
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
  },
  particleInner: {
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  touchRipple: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  rippleInner: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  overlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    bottom: 30,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  header: {
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    color: '#4dd0e1',
    letterSpacing: 1,
  },
  forceIndicators: {
    gap: 8,
    maxWidth: 280,
  },
  forceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  equations: {
    alignItems: 'flex-end',
    gap: 2,
  },
  equation: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  phaseText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 8,
  },
  quote: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 100,
  },
  exitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 208, 225, 0.3)',
  },
  exitButtonText: {
    color: '#4dd0e1',
    fontSize: 14,
    fontWeight: '500',
  },
  exitModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  exitOptionsContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -150 }],
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 208, 225, 0.2)',
  },
  exitTitle: {
    color: '#4dd0e1',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  exitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exitOptionSacred: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  exitOptionText: {
    flex: 1,
  },
  exitOptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exitOptionTitleSacred: {
    color: '#c084fc',
  },
  exitOptionSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  exitOptionCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
  },
  exitOptionCancelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  sacredIndicator: {
    padding: 4,
  },
  resonanceStatus: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  resonanceLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 4,
  },
  resonanceBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  resonanceFill: {
    height: '100%',
    borderRadius: 2,
  },
  resonanceValue: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
  },
});