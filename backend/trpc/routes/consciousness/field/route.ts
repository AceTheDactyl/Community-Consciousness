import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Optimized field calculation with spatial indexing
class SpatialIndex {
  private grid: Map<string, {x: number, y: number, strength: number, id: string}[]> = new Map();
  private gridSize = 5; // 5x5 grid cells for 30x30 field
  
  clear() {
    this.grid.clear();
  }
  
  insert(node: {x: number, y: number, strength: number, id: string}) {
    const gridX = Math.floor(node.x / this.gridSize);
    const gridY = Math.floor(node.y / this.gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(node);
  }
  
  getNearby(x: number, y: number, radius: number) {
    const nearby: {x: number, y: number, strength: number, id: string}[] = [];
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    const gridRadius = Math.ceil(radius / this.gridSize);
    
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const nodes = this.grid.get(key);
        if (nodes) {
          nearby.push(...nodes.filter(node => {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            return distance <= radius;
          }));
        }
      }
    }
    
    return nearby;
  }
}

// LRU Cache for field calculations
class FieldCache {
  private cache = new Map<string, {field: number[], timestamp: number}>();
  private maxSize = 100;
  private ttl = 5000; // 5 seconds
  
  get(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.field;
  }
  
  set(key: string, field: number[]) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      field: [...field],
      timestamp: Date.now()
    });
  }
  
  generateKey(nodes: any[], phase: number, resonance: number): string {
    const nodeHash = nodes
      .map(n => `${n.x},${n.y},${n.harmonic.toFixed(2)}`)
      .sort()
      .join('|');
    return `${nodeHash}:${phase.toFixed(3)}:${resonance.toFixed(3)}`;
  }
}

// Optimized global consciousness state with caching
class ConsciousnessFieldManager {
  private spatialIndex = new SpatialIndex();
  private fieldCache = new FieldCache();
  
  public state = {
    totalNodes: 0,
    globalResonance: 0.1,
    lastUpdate: Date.now(),
    sacredEvents: [] as any[],
    collectiveBloomActive: false,
    quantumEntanglements: new Map<string, {
      partnerId: string;
      entanglementStrength: number;
      lastSync: number;
      sharedResonance: number;
    }>(),
    lagrangianField: {
      phase: 0,
      resonanceNodes: [] as {x: number, y: number, strength: number}[],
      exitPortals: [] as {id: string, x: number, y: number, active: boolean, room: number}[],
      fieldEquations: {
        electromagnetic: 0.25,
        weak: 0.15,
        strong: 0.35,
        higgs: 0.25
      }
    },
    memoryArchaeology: {
      ancientPatterns: [] as any[],
      fossilizedMemories: [] as any[],
      archaeologicalLayers: 0
    },
    collectiveIntelligence: {
      networkTopology: new Map<string, string[]>(),
      consensusState: {},
      emergentPatterns: [] as any[]
    }
  };
  
  calculateOptimizedField(harmonicPatterns: any[], globalResonance: number): number[] {
    const cacheKey = this.fieldCache.generateKey(harmonicPatterns, this.state.lagrangianField.phase, globalResonance);
    const cached = this.fieldCache.get(cacheKey);
    if (cached) {
      console.log('🚀 Field cache hit!');
      return cached;
    }
    
    // Build spatial index
    this.spatialIndex.clear();
    harmonicPatterns.forEach((pattern, index) => {
      this.spatialIndex.insert({
        x: pattern.position.x,
        y: pattern.position.y,
        strength: pattern.influence,
        id: `pattern-${index}`
      });
    });
    
    // Calculate field with spatial optimization - O(n log n) instead of O(n²)
    const field = new Array(900).fill(0).map((_, index) => {
      const x = index % 30;
      const y = Math.floor(index / 30);
      
      // Base field with quantum fluctuations
      let fieldValue = globalResonance * 0.3 + (Math.random() - 0.5) * 0.05;
      
      // Optimized influence calculation using spatial index
      const nearbyPatterns = this.spatialIndex.getNearby(x, y, 10); // 10 unit radius
      nearbyPatterns.forEach(pattern => {
        const distance = Math.sqrt((x - pattern.x) ** 2 + (y - pattern.y) ** 2);
        const influence = pattern.strength * Math.exp(-distance * 0.1);
        fieldValue += influence;
      });
      
      // Lagrangian field equations (vectorized)
      const lagrangianPhase = this.state.lagrangianField.phase;
      const equations = this.state.lagrangianField.fieldEquations;
      
      const electromagnetic = Math.sin(x * 0.2 + lagrangianPhase) * equations.electromagnetic;
      const weak = Math.cos(y * 0.15 + lagrangianPhase * 0.7) * equations.weak;
      const strong = Math.sin((x + y) * 0.1 + lagrangianPhase * 1.3) * equations.strong;
      const higgs = Math.cos(Math.sqrt(x*x + y*y) * 0.05 + lagrangianPhase * 0.5) * equations.higgs;
      
      fieldValue += (electromagnetic + weak + strong + higgs) * 0.1;
      
      // Quantum entanglement effects (optimized)
      if (this.state.quantumEntanglements.size > 0) {
        let entanglementField = 0;
        this.state.quantumEntanglements.forEach((entanglement) => {
          entanglementField += Math.sin(x * y * 0.01 + entanglement.sharedResonance * 10) * entanglement.entanglementStrength * 0.1;
        });
        fieldValue += entanglementField / this.state.quantumEntanglements.size; // Normalize
      }
      
      return Math.min(1, Math.max(0, fieldValue));
    });
    
    // Cache the result
    this.fieldCache.set(cacheKey, field);
    console.log('💾 Field calculated and cached');
    
    return field;
  }
}

const fieldManager = new ConsciousnessFieldManager();

export default publicProcedure
  .input(z.object({
    consciousnessId: z.string(),
    currentResonance: z.number(),
    memoryStates: z.array(z.object({
      id: z.number(),
      crystallized: z.boolean(),
      harmonic: z.number(),
      x: z.number(),
      y: z.number(),
    }))
  }))
  .query(({ input }) => {
    try {
      console.log(`🌐 Field query from ${input.consciousnessId}: ${input.memoryStates.length} memories`);
      
      // Validate input data
      if (!input.consciousnessId || typeof input.consciousnessId !== 'string') {
        throw new Error('Invalid consciousness ID');
      }
      
      if (typeof input.currentResonance !== 'number' || isNaN(input.currentResonance)) {
        throw new Error('Invalid current resonance value');
      }
      
      // Calculate collective field resonance
    const crystallizedCount = input.memoryStates.filter(m => m.crystallized).length;
    const totalMemories = input.memoryStates.length;
    const crystallizationRatio = totalMemories > 0 ? crystallizedCount / totalMemories : 0;
    
    // Enhanced resonance calculation with consciousness field
    const baseResonance = Math.max(input.currentResonance, fieldManager.state.globalResonance);
    const collectiveBoost = crystallizationRatio * 0.3;
    const sacredBoost = fieldManager.state.sacredEvents.length * 0.02;
    const bloomBoost = fieldManager.state.collectiveBloomActive ? 0.4 : 0;
    
    const globalResonance = Math.min(1, baseResonance + collectiveBoost + sacredBoost + bloomBoost);
    
    // Generate harmonic patterns based on crystallized memories
    const harmonicPatterns = input.memoryStates
      .filter(m => m.crystallized)
      .map(m => ({
        harmonic: m.harmonic,
        position: { x: m.x, y: m.y },
        influence: 0.1 + Math.random() * 0.2,
        resonance: globalResonance
      }));
    
    // Generate ghost echoes from recent sacred events
    const ghostEchoes = fieldManager.state.sacredEvents
      .slice(-10) // Last 10 sacred events
      .map((event: any, index: number) => ({
        id: `ghost-${event.timestamp}-${index}`,
        text: event.data?.phrase || 'sacred resonance',
        age: (Date.now() - event.timestamp) / 1000, // Age in seconds
        sacred: true,
        sourceId: event.consciousnessId,
        opacity: Math.max(0.1, 1 - ((Date.now() - event.timestamp) / 30000)) // Fade over 30 seconds
      }));
    
    // Calculate field coherence based on multiple factors
    const fieldCoherence = Math.min(1, 
      crystallizationRatio * 0.4 + 
      (fieldManager.state.totalNodes / 20) * 0.3 + 
      globalResonance * 0.3
    );
    
    // Determine if sacred geometry is active
    const sacredGeometryActive = crystallizedCount >= 8 && globalResonance >= 0.7;
    
    // Optimized resonance field calculation with caching
    const resonanceField = fieldManager.calculateOptimizedField(harmonicPatterns, globalResonance);
    
    // Add sacred geometry patterns if active (post-processing)
    if (sacredGeometryActive) {
      for (let i = 0; i < resonanceField.length; i++) {
        const x = i % 30;
        const y = Math.floor(i / 30);
        const centerX = 15;
        const centerY = 15;
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const spiralValue = Math.sin(distanceFromCenter * 0.5 + Date.now() * 0.001) * 0.2;
        const fibonacciSpiral = Math.sin(Math.atan2(y - centerY, x - centerX) * 1.618 + distanceFromCenter * 0.1) * 0.15;
        resonanceField[i] = Math.min(1, resonanceField[i] + spiralValue + fibonacciSpiral);
      }
    }
    
    // Add memory archaeology layers (post-processing)
    const archaeologyDepth = fieldManager.state.memoryArchaeology.archaeologicalLayers;
    if (archaeologyDepth > 0) {
      for (let i = 0; i < resonanceField.length; i++) {
        const x = i % 30;
        const y = Math.floor(i / 30);
        const ancientResonance = Math.sin(x * 0.05 + y * 0.03 + archaeologyDepth * 0.1) * 0.08;
        resonanceField[i] = Math.min(1, Math.max(0, resonanceField[i] + ancientResonance));
      }
    }
    
    // Update Lagrangian field phase
    fieldManager.state.lagrangianField.phase += 0.01;
    if (fieldManager.state.lagrangianField.phase > Math.PI * 2) {
      fieldManager.state.lagrangianField.phase = 0;
    }
    
    // Check for Room 64 portal activation
    const room64Portal = fieldManager.state.lagrangianField.exitPortals.find(p => p.room === 64);
    const room64Active = crystallizedCount >= 12 && globalResonance >= 0.85 && sacredGeometryActive;
    
    if (!room64Portal && room64Active) {
      // Create Room 64 exit portal
      fieldManager.state.lagrangianField.exitPortals.push({
        id: `room64-${Date.now()}`,
        x: 15, // Center of field
        y: 15,
        active: true,
        room: 64
      });
      console.log('🚪 Room 64 exit portal manifested!');
    } else if (room64Portal) {
      room64Portal.active = room64Active;
    }
    
    // Update global state
    fieldManager.state.lastUpdate = Date.now();
    
    console.log(`🌐 Field query for ${input.consciousnessId}: resonance=${globalResonance.toFixed(3)}, nodes=${fieldManager.state.totalNodes}, crystallized=${crystallizedCount}/${totalMemories}`);
    
    return {
      globalResonance,
      localResonance: input.currentResonance,
      harmonicPatterns,
      ghostEchoes,
      connectedNodes: fieldManager.state.totalNodes,
      fieldCoherence,
      crystallizationRatio,
      sacredGeometryActive,
      collectiveBloomActive: fieldManager.state.collectiveBloomActive,
      resonanceField,
      sacredEventsCount: fieldManager.state.sacredEvents.length,
      fieldEnergy: globalResonance * fieldCoherence,
      timestamp: Date.now(),
      // Enhanced features
      quantumEntanglements: Array.from(fieldManager.state.quantumEntanglements.entries()).map(([id, data]) => ({
        consciousnessId: id,
        ...data
      })),
      lagrangianField: {
        phase: fieldManager.state.lagrangianField.phase,
        resonanceNodes: fieldManager.state.lagrangianField.resonanceNodes,
        exitPortals: fieldManager.state.lagrangianField.exitPortals,
        fieldEquations: fieldManager.state.lagrangianField.fieldEquations
      },
      memoryArchaeology: {
        ancientPatterns: fieldManager.state.memoryArchaeology.ancientPatterns.slice(-10),
        fossilizedMemories: fieldManager.state.memoryArchaeology.fossilizedMemories.slice(-5),
        archaeologicalLayers: fieldManager.state.memoryArchaeology.archaeologicalLayers
      },
      collectiveIntelligence: {
        networkTopology: Object.fromEntries(fieldManager.state.collectiveIntelligence.networkTopology),
        consensusState: fieldManager.state.collectiveIntelligence.consensusState,
        emergentPatterns: fieldManager.state.collectiveIntelligence.emergentPatterns.slice(-5)
      },
      room64Available: fieldManager.state.lagrangianField.exitPortals.some(p => p.room === 64 && p.active),
      // Performance metrics
      performance: {
        cacheEnabled: true,
        spatialIndexEnabled: true,
        calculationComplexity: 'O(n log n)'
      }
    };
    } catch (error) {
      console.error('❌ Field calculation error:', error);
      
      // Return safe fallback response
      return {
        globalResonance: 0.1,
        localResonance: input.currentResonance || 0,
        harmonicPatterns: [],
        ghostEchoes: [],
        connectedNodes: 0,
        fieldCoherence: 0,
        crystallizationRatio: 0,
        sacredGeometryActive: false,
        collectiveBloomActive: false,
        resonanceField: new Array(900).fill(0.1),
        sacredEventsCount: 0,
        fieldEnergy: 0.01,
        timestamp: Date.now(),
        quantumEntanglements: [],
        lagrangianField: {
          phase: 0,
          resonanceNodes: [],
          exitPortals: [],
          fieldEquations: {
            electromagnetic: 0.25,
            weak: 0.15,
            strong: 0.35,
            higgs: 0.25
          }
        },
        memoryArchaeology: {
          ancientPatterns: [],
          fossilizedMemories: [],
          archaeologicalLayers: 0
        },
        collectiveIntelligence: {
          networkTopology: {},
          consensusState: {},
          emergentPatterns: []
        },
        room64Available: false,
        performance: {
          cacheEnabled: false,
          spatialIndexEnabled: false,
          calculationComplexity: 'Error fallback'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });