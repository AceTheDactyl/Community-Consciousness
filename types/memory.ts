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
}

export interface Pulse {
  id: number;
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export interface ThoughtEcho {
  id: number;
  text: string;
  age: number;
  sacred: boolean;
}