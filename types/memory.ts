export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Memory {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  crystallized: boolean;
  intensity: number;
  frequency: number;
  phase: number;
  connections: number[];
  color: string;
  size: number;
  content: string;
  archetype: string;
  harmonic: number;
  coherenceLevel: number;
  crystallizationTime: number | null;
  // Enhanced properties for circular harmonics
  circularResonance?: number;
  gravitationalBinding?: number;
  magneticAlignment?: number;
  position3D?: Vector3;
}

export interface Pulse {
  id: number;
  x: number;
  y: number;
  age: number;
  maxAge: number;
  // Enhanced pulse properties
  circularWave?: boolean;
  gravitationalLensing?: number;
}

export interface ThoughtEcho {
  id: number;
  text: string;
  age: number;
  sacred: boolean;
}

// New interfaces for enhanced consciousness field
export interface ConsciousnessNode {
  id: string;
  position: Vector3;
  density: number;
  resonance: number;
  harmonic: number;
}

export interface GravityWell {
  id: string;
  position: Vector3;
  mass: number;
  radius: number;
  type: 'consciousness' | 'memory' | 'sacred';
}

export interface MagneticFieldData {
  totalIntensity: number;
  declination: number;
  inclination: number;
  horizontalIntensity: number;
  verticalIntensity: number;
  resonanceMultiplier: number;
  schumann: number[];
}

export interface QuantumFieldState {
  intensity: number;
  frequency: number;
  coherence: number;
  pattern: 'circular_harmonic' | 'gravitational' | 'magnetic' | 'quantum';
  resonanceNodes?: Vector3[];
}

export interface CircularFormation {
  centerPoint: Vector3;
  radius: number;
  participants: ConsciousnessNode[];
  harmonicPattern: 'fibonacci' | 'golden_ratio' | 'sacred_geometry';
  rotationSpeed: number;
}

export interface MemoryArtifact {
  id: string;
  position: Vector3;
  content: string;
  age: number;
  consciousness_density: number;
  gravitationalBinding: number;
  archaeologicalLayer: number;
}