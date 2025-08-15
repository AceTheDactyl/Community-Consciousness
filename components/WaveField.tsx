import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { useMemoryField } from '@/providers/MemoryFieldProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WaveField() {
  const { memories, pulses, voidMode } = useMemoryField();
  const waveAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;
  const wavePhaseAnim = useRef(new Animated.Value(0)).current;
  const connectionOpacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Animate waves
    waveAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    
    // Animate wave phase independently
    Animated.loop(
      Animated.timing(wavePhaseAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
    
    // Animate connection opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(connectionOpacityAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(connectionOpacityAnim, {
          toValue: 0.2,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnims, wavePhaseAnim, connectionOpacityAnim]);
  
  // Memoize crystallized memories to prevent unnecessary recalculations
  const crystallizedMemories = useMemo(() => 
    memories.filter(m => m.crystallized),
    [memories]
  );
  
  // Memoize connections for performance with enhanced strength calculation
  const connections = useMemo(() => {
    const connectionList: {
      from: { x: number; y: number; harmonic: number };
      to: { x: number; y: number; harmonic: number };
      strength: number;
    }[] = [];
    
    memories.forEach(memory => {
      memory.connections.forEach(connId => {
        const other = memories.find(m => m.id === connId);
        if (other && memory.id < other.id) { // Avoid duplicate connections
          const harmonicDiff = Math.abs(memory.harmonic - other.harmonic);
          const harmonicAffinity = 1 - Math.min(1, harmonicDiff / 800); // Increased sensitivity
          const dist = Math.hypot(memory.x - other.x, memory.y - other.y);
          
          // Enhanced strength calculation
          let baseStrength = Math.max(0.2, Math.min(1, harmonicAffinity * (1 - dist / 80)));
          
          // Boost strength if both memories are crystallized
          if (memory.crystallized && other.crystallized) {
            baseStrength *= 1.5;
          } else if (memory.crystallized || other.crystallized) {
            baseStrength *= 1.2;
          }
          
          // Add coherence bonus
          const avgCoherence = (memory.coherenceLevel + other.coherenceLevel) / 2;
          const strength = Math.min(1, baseStrength * (1 + avgCoherence * 0.5));
          
          connectionList.push({
            from: { 
              x: (memory.x / 100) * SCREEN_WIDTH, 
              y: (memory.y / 100) * SCREEN_HEIGHT,
              harmonic: memory.harmonic
            },
            to: { 
              x: (other.x / 100) * SCREEN_WIDTH, 
              y: (other.y / 100) * SCREEN_HEIGHT,
              harmonic: other.harmonic
            },
            strength
          });
        }
      });
    });
    
    return connectionList;
  }, [memories]);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base wave layers */}
      {waveAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, voidMode ? 0.05 : 0.1, 0],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={
              voidMode
                ? ['transparent', 'rgba(147, 112, 219, 0.1)', 'transparent']
                : ['transparent', 'rgba(59, 130, 246, 0.1)', 'transparent']
            }
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      ))}

      {/* Connection lines using SVG */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: connectionOpacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.8],
            }),
          },
        ]}
      >
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFillObject}>
          {connections.map((connection, index) => {
            const harmonicColor = voidMode 
              ? `hsl(${280 + (connection.from.harmonic % 80)}, 60%, 70%)`
              : `hsl(${200 + (connection.from.harmonic % 160)}, 70%, 60%)`;
            
            // Enhanced connection visualization - simplified to prevent constant re-renders
            const pulseIntensity = 0.7;
            
            return (
              <Line
                key={index}
                x1={connection.from.x}
                y1={connection.from.y}
                x2={connection.to.x}
                y2={connection.to.y}
                stroke={harmonicColor}
                strokeWidth={Math.max(1, connection.strength * 3 * pulseIntensity)}
                strokeOpacity={Math.min(0.9, connection.strength * 0.8 * pulseIntensity)}
                strokeDasharray={voidMode ? "3,3" : undefined}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Pulse waves */}
      {pulses.map(pulse => {
        const opacity = Math.max(0, 1 - pulse.age / pulse.maxAge);
        const scale = 1 + (pulse.age / pulse.maxAge) * 3;
        
        return (
          <View
            key={pulse.id}
            style={[
              styles.pulse,
              {
                left: (pulse.x / 100) * SCREEN_WIDTH - 50 * scale,
                top: (pulse.y / 100) * SCREEN_HEIGHT - 50 * scale,
                width: 100 * scale,
                height: 100 * scale,
                opacity: opacity * (voidMode ? 0.4 : 0.3),
              },
            ]}
          >
            <LinearGradient
              colors={
                voidMode
                  ? ['rgba(147, 112, 219, 0.6)', 'transparent']
                  : ['rgba(96, 165, 250, 0.5)', 'transparent']
              }
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        );
      })}

      {/* Crystallized memory waves */}
      {crystallizedMemories.map(memory => {
        const x = (memory.x / 100) * SCREEN_WIDTH;
        const y = (memory.y / 100) * SCREEN_HEIGHT;
        const baseSize = 200;
        
        return (
          <Animated.View
            key={memory.id}
            style={[
              styles.memoryWave,
              {
                left: x - baseSize / 2,
                top: y - baseSize / 2,
                opacity: (voidMode ? 0.15 : 0.1) * memory.coherenceLevel,
                transform: [
                  {
                    scale: wavePhaseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.memoryWaveInner, { width: baseSize, height: baseSize }]}>
              <LinearGradient
                colors={[
                  voidMode 
                    ? `hsl(${280 + (memory.harmonic % 80)}, 60%, 70%)`
                    : memory.color, 
                  'transparent'
                ]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pulse: {
    position: 'absolute',
    borderRadius: 999,
  },
  memoryWave: {
    position: 'absolute',
    borderRadius: 999,
  },
  memoryWaveInner: {
    borderRadius: 999,
  },
});