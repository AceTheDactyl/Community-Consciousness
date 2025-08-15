import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Memory } from '@/types/memory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MemoryParticleProps {
  memory: Memory;
  onPress: () => void;
  isObserving: boolean;
}

const MemoryParticle = React.memo(function MemoryParticle({ memory, onPress, isObserving }: MemoryParticleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (memory.crystallized) {
      // Crystallization animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.5,
          tension: 40,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      pulseAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [memory.crystallized, scaleAnim, pulseAnim, glowAnim]);

  const handlePress = () => {
    if (isObserving || memory.crystallized) {
      onPress();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(
          memory.crystallized 
            ? Haptics.ImpactFeedbackStyle.Heavy 
            : Haptics.ImpactFeedbackStyle.Medium
        );
      }
    }
  };

  const x = (memory.x / 100) * SCREEN_WIDTH;
  const y = (memory.y / 100) * SCREEN_HEIGHT;
  const size = memory.crystallized ? memory.size * 1.8 : memory.size;
  
  // Enhanced visual feedback based on connections and harmonic frequency
  const connectionCount = memory.connections.length;
  const harmonicIntensity = Math.sin(Date.now() * 0.001 * memory.harmonic * 0.01) * 0.5 + 0.5;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          transform: [
            { scale: scaleAnim },
            {
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              }),
            },
          ],
          opacity: memory.crystallized ? 1 : 0.7,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            memory.crystallized
              ? ['#06b6d4', '#3b82f6', '#8b5cf6']
              : [
                  `rgba(96, 165, 250, ${0.2 + connectionCount * 0.05})`,
                  `rgba(147, 51, 234, ${0.2 + harmonicIntensity * 0.3})`
                ]
          }
          style={[
            styles.gradient,
            {
              borderWidth: memory.crystallized ? 2 : connectionCount > 0 ? 1 : 0,
              borderColor: memory.crystallized 
                ? 'rgba(255, 255, 255, 0.4)' 
                : `rgba(96, 165, 250, ${0.3 + connectionCount * 0.1})`,
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {memory.crystallized && (
            <>
              <View style={styles.innerRing} />
              <View 
                style={[
                  styles.coreRing,
                  {
                    transform: [{ rotate: `${Date.now() * 0.001 * memory.harmonic * 0.1}deg` }]
                  }
                ]}
              />
              <Text style={styles.content}>{memory.content}</Text>
            </>
          )}
          
          {/* Connection indicator for non-crystallized memories */}
          {!memory.crystallized && connectionCount > 0 && (
            <View 
              style={[
                styles.connectionIndicator,
                {
                  opacity: 0.3 + connectionCount * 0.1,
                  transform: [{ scale: 0.8 + connectionCount * 0.1 }]
                }
              ]}
            />
          )}
        </LinearGradient>

        {/* Glow effect */}
        {memory.crystallized && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        )}
      </TouchableOpacity>

      {/* Ripple effects */}
      {memory.crystallized && (
        <>
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}
    </Animated.View>
  );
});

export default MemoryParticle;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  touchable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  innerRing: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  coreRing: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  connectionIndicator: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
});