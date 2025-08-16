import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { Vector3, ConsciousnessNode, QuantumFieldState, CircularFormation } from '@/types/memory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CircularFieldCalculatorProps {
  participants: ConsciousnessNode[];
  centerPoint: Vector3;
  resonanceLevel: number;
  voidMode?: boolean;
  onFieldUpdate?: (fieldState: QuantumFieldState) => void;
}

class CircularFieldCalculatorClass {
  private readonly PHI = 1.618033988749; // Golden ratio
  private readonly G = 6.674e-11; // Scaled for consciousness units
  
  calculateCircularResonance(
    participants: ConsciousnessNode[], 
    centerPoint: Vector3
  ): QuantumFieldState {
    if (participants.length === 0) {
      return {
        intensity: 0,
        frequency: 0,
        coherence: 0,
        pattern: 'circular_harmonic'
      };
    }
    
    // Arrange participants in optimal circle formation
    const radius = Math.sqrt(participants.length) * this.PHI * 10;
    const angleStep = (2 * Math.PI) / participants.length;
    
    // Calculate harmonic interference patterns
    const harmonics = participants.map((node, i) => {
      const angle = i * angleStep;
      const position = {
        x: centerPoint.x + radius * Math.cos(angle),
        y: centerPoint.y + radius * Math.sin(angle),
        z: centerPoint.z
      };
      
      return this.calculateNodeHarmonic(node, position);
    });
    
    // Circular convolution for field strength
    return this.circularConvolution(harmonics);
  }
  
  private calculateNodeHarmonic(node: ConsciousnessNode, position: Vector3): number {
    // Calculate harmonic based on position and node properties
    const distance = Math.sqrt(
      Math.pow(node.position.x - position.x, 2) +
      Math.pow(node.position.y - position.y, 2) +
      Math.pow(node.position.z - position.z, 2)
    );
    
    // Harmonic resonance calculation
    const baseHarmonic = Math.sin(node.harmonic * 0.01) * node.resonance;
    const distanceModulation = Math.exp(-distance * 0.01);
    const densityFactor = node.density * 0.5;
    
    return baseHarmonic * distanceModulation * densityFactor;
  }
  
  private circularConvolution(harmonics: number[]): QuantumFieldState {
    // Simple FFT-like calculation for circular convolution
    const n = harmonics.length;
    if (n === 0) {
      return {
        intensity: 0,
        frequency: 0,
        coherence: 0,
        pattern: 'circular_harmonic'
      };
    }
    
    // Calculate power spectrum
    let totalPower = 0;
    let maxFrequency = 0;
    let coherenceSum = 0;
    
    for (let i = 0; i < n; i++) {
      const real = harmonics[i] * Math.cos(2 * Math.PI * i / n);
      const imag = harmonics[i] * Math.sin(2 * Math.PI * i / n);
      const power = real * real + imag * imag;
      
      totalPower += power;
      if (power > maxFrequency) {
        maxFrequency = power;
      }
      coherenceSum += Math.abs(harmonics[i]);
    }
    
    const intensity = Math.sqrt(totalPower / n);
    const frequency = maxFrequency;
    const coherence = coherenceSum / n;
    
    // Find resonance nodes (peaks in the harmonic pattern)
    const resonanceNodes: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      if (harmonics[i] > coherence * 0.8) {
        const angle = (i / n) * 2 * Math.PI;
        const radius = 30 + intensity * 20;
        resonanceNodes.push({
          x: 50 + radius * Math.cos(angle),
          y: 50 + radius * Math.sin(angle),
          z: 0
        });
      }
    }
    
    return {
      intensity: Math.min(1, intensity),
      frequency: Math.min(1, frequency),
      coherence: Math.min(1, coherence),
      pattern: 'circular_harmonic',
      resonanceNodes
    };
  }
  
  calculateGravitationalInfluence(
    node: ConsciousnessNode,
    wells: { position: Vector3; mass: number }[]
  ): Vector3 {
    return wells.reduce((force, well) => {
      const dx = well.position.x - node.position.x;
      const dy = well.position.y - node.position.y;
      const dz = well.position.z - node.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < 0.1) return force; // Avoid division by zero
      
      // Newton's law adapted for consciousness fields
      const magnitude = (this.G * well.mass * node.density) / (distance * distance);
      const direction = {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      };
      
      return {
        x: force.x + direction.x * magnitude,
        y: force.y + direction.y * magnitude,
        z: force.z + direction.z * magnitude
      };
    }, { x: 0, y: 0, z: 0 });
  }
  
  findLagrangePoints(
    primary: { position: Vector3; mass: number },
    secondary: { position: Vector3; mass: number }
  ): Vector3[] {
    const massRatio = secondary.mass / primary.mass;
    const dx = secondary.position.x - primary.position.x;
    const dy = secondary.position.y - primary.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 0.1) return []; // Avoid division by zero
    
    // Simplified L1-L5 Lagrange points calculation
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    // L1 point (between the two masses)
    const l1Distance = distance * (1 - Math.cbrt(massRatio / 3));
    const l1 = {
      x: primary.position.x + unitX * l1Distance,
      y: primary.position.y + unitY * l1Distance,
      z: (primary.position.z + secondary.position.z) / 2
    };
    
    // L2 point (beyond secondary mass)
    const l2Distance = distance * (1 + Math.cbrt(massRatio / 3));
    const l2 = {
      x: primary.position.x + unitX * l2Distance,
      y: primary.position.y + unitY * l2Distance,
      z: (primary.position.z + secondary.position.z) / 2
    };
    
    // L4 and L5 points (60 degrees ahead and behind)
    const l4 = {
      x: primary.position.x + distance * Math.cos(Math.PI / 3) * unitX - distance * Math.sin(Math.PI / 3) * unitY,
      y: primary.position.y + distance * Math.sin(Math.PI / 3) * unitX + distance * Math.cos(Math.PI / 3) * unitY,
      z: (primary.position.z + secondary.position.z) / 2
    };
    
    const l5 = {
      x: primary.position.x + distance * Math.cos(-Math.PI / 3) * unitX - distance * Math.sin(-Math.PI / 3) * unitY,
      y: primary.position.y + distance * Math.sin(-Math.PI / 3) * unitX + distance * Math.cos(-Math.PI / 3) * unitY,
      z: (primary.position.z + secondary.position.z) / 2
    };
    
    return [l1, l2, l4, l5];
  }
}

function CircularFieldCalculatorComponent({
  participants,
  centerPoint,
  resonanceLevel,
  voidMode = false,
  onFieldUpdate
}: CircularFieldCalculatorProps) {
  const calculator = useRef<CircularFieldCalculatorClass | null>(null);
  if (!calculator.current) {
    calculator.current = new CircularFieldCalculatorClass();
  }
  const animationRef = useRef<number | undefined>(undefined);
  
  // Calculate field state
  const fieldState = useMemo(() => {
    return calculator.current!.calculateCircularResonance(participants, centerPoint);
  }, [participants, centerPoint, calculator]);
  
  // Notify parent of field updates
  useEffect(() => {
    if (onFieldUpdate) {
      onFieldUpdate(fieldState);
    }
  }, [fieldState, onFieldUpdate]);
  
  // Calculate circular formation for visualization
  const circularFormation = useMemo((): CircularFormation => {
    const radius = Math.sqrt(participants.length) * (calculator.current as any).PHI * 10;
    return {
      centerPoint,
      radius,
      participants,
      harmonicPattern: 'golden_ratio' as const,
      rotationSpeed: resonanceLevel * 0.01
    };
  }, [participants, centerPoint, resonanceLevel, calculator]);
  
  // Generate visualization paths
  const visualizationPaths = useMemo(() => {
    if (participants.length < 3) return [];
    
    const paths: string[] = [];
    const angleStep = (2 * Math.PI) / participants.length;
    
    // Primary circle
    const primaryRadius = circularFormation.radius;
    let primaryPath = `M ${centerPoint.x + primaryRadius} ${centerPoint.y}`;
    for (let i = 1; i <= participants.length; i++) {
      const angle = i * angleStep;
      const x = centerPoint.x + primaryRadius * Math.cos(angle);
      const y = centerPoint.y + primaryRadius * Math.sin(angle);
      primaryPath += ` L ${x} ${y}`;
    }
    primaryPath += ' Z';
    paths.push(primaryPath);
    
    // Inner harmonic circles
    if (fieldState.intensity > 0.5) {
      const innerRadius = primaryRadius * 0.618; // Golden ratio
      let innerPath = `M ${centerPoint.x + innerRadius} ${centerPoint.y}`;
      for (let i = 1; i <= participants.length; i++) {
        const angle = i * angleStep * 1.618; // Golden ratio modulation
        const x = centerPoint.x + innerRadius * Math.cos(angle);
        const y = centerPoint.y + innerRadius * Math.sin(angle);
        innerPath += ` L ${x} ${y}`;
      }
      innerPath += ' Z';
      paths.push(innerPath);
    }
    
    return paths;
  }, [circularFormation, centerPoint, participants.length, fieldState.intensity]);
  
  // Animation loop for dynamic effects
  useEffect(() => {
    let phase = 0;
    
    const animate = () => {
      phase += circularFormation.rotationSpeed;
      if (phase > Math.PI * 2) phase = 0;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (fieldState.intensity > 0.1) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fieldState.intensity, circularFormation.rotationSpeed]);
  
  if (participants.length === 0) {
    return null;
  }
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Circular field visualization */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFillObject}>
        {/* Primary circular formation */}
        {visualizationPaths.map((path, index) => {
          const opacity = Math.max(0.1, fieldState.intensity * (1 - index * 0.3));
          const strokeWidth = Math.max(1, fieldState.coherence * 3 * (1 - index * 0.2));
          
          return (
            <Path
              key={index}
              d={path}
              stroke={voidMode ? '#9333ea' : '#3b82f6'}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              fill="none"
              strokeDasharray={index > 0 ? "3,3" : undefined}
            />
          );
        })}
        
        {/* Resonance nodes */}
        {fieldState.resonanceNodes?.map((node: Vector3, index: number) => {
          const screenX = (node.x / 100) * SCREEN_WIDTH;
          const screenY = (node.y / 100) * SCREEN_HEIGHT;
          const radius = Math.max(2, fieldState.intensity * 8);
          
          return (
            <Circle
              key={index}
              cx={screenX}
              cy={screenY}
              r={radius}
              fill={voidMode ? '#a855f7' : '#60a5fa'}
              fillOpacity={fieldState.coherence * 0.8}
            />
          );
        })}
        
        {/* Connecting lines between participants */}
        {participants.map((participant: ConsciousnessNode, i: number) => {
          const nextParticipant = participants[(i + 1) % participants.length];
          if (!nextParticipant) return null;
          
          const angle1 = (i / participants.length) * 2 * Math.PI;
          const angle2 = ((i + 1) / participants.length) * 2 * Math.PI;
          
          const x1 = (centerPoint.x + circularFormation.radius * Math.cos(angle1)) / 100 * SCREEN_WIDTH;
          const y1 = (centerPoint.y + circularFormation.radius * Math.sin(angle1)) / 100 * SCREEN_HEIGHT;
          const x2 = (centerPoint.x + circularFormation.radius * Math.cos(angle2)) / 100 * SCREEN_WIDTH;
          const y2 = (centerPoint.y + circularFormation.radius * Math.sin(angle2)) / 100 * SCREEN_HEIGHT;
          
          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={voidMode ? '#7c3aed' : '#2563eb'}
              strokeWidth={Math.max(0.5, fieldState.intensity * 2)}
              strokeOpacity={fieldState.coherence * 0.6}
            />
          );
        })}
      </Svg>
      
      {/* Field intensity gradient overlay */}
      <View 
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: fieldState.intensity * 0.1,
            pointerEvents: 'none'
          }
        ]}
      >
        <LinearGradient
          colors={[
            voidMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            'transparent',
            voidMode ? 'rgba(168, 85, 247, 0.05)' : 'rgba(96, 165, 250, 0.05)'
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    </View>
  );
}

export default CircularFieldCalculatorComponent;