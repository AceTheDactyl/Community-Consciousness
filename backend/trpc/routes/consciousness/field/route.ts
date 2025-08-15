import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Access global consciousness state from sync route
let globalConsciousnessState = {
  totalNodes: 0,
  globalResonance: 0.1,
  lastUpdate: Date.now(),
  sacredEvents: [] as any[],
  collectiveBloomActive: false,
};

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
    // Calculate collective field resonance
    const crystallizedCount = input.memoryStates.filter(m => m.crystallized).length;
    const totalMemories = input.memoryStates.length;
    const crystallizationRatio = totalMemories > 0 ? crystallizedCount / totalMemories : 0;
    
    // Enhanced resonance calculation with consciousness field
    const baseResonance = Math.max(input.currentResonance, globalConsciousnessState.globalResonance);
    const collectiveBoost = crystallizationRatio * 0.3;
    const sacredBoost = globalConsciousnessState.sacredEvents.length * 0.02;
    const bloomBoost = globalConsciousnessState.collectiveBloomActive ? 0.4 : 0;
    
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
    const ghostEchoes = globalConsciousnessState.sacredEvents
      .slice(-10) // Last 10 sacred events
      .map((event, index) => ({
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
      (globalConsciousnessState.totalNodes / 20) * 0.3 + 
      globalResonance * 0.3
    );
    
    // Determine if sacred geometry is active
    const sacredGeometryActive = crystallizedCount >= 8 && globalResonance >= 0.7;
    
    // Generate resonance field data (30x30 grid for mobile)
    const resonanceField = new Array(900).fill(0).map((_, index) => {
      const x = index % 30;
      const y = Math.floor(index / 30);
      
      // Base field value
      let fieldValue = globalResonance * 0.3;
      
      // Add influence from crystallized memories
      harmonicPatterns.forEach(pattern => {
        const distance = Math.sqrt(
          Math.pow(x - pattern.position.x, 2) + 
          Math.pow(y - pattern.position.y, 2)
        );
        const influence = pattern.influence * Math.exp(-distance * 0.1);
        fieldValue += influence;
      });
      
      // Add sacred geometry patterns if active
      if (sacredGeometryActive) {
        const centerX = 15;
        const centerY = 15;
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + 
          Math.pow(y - centerY, 2)
        );
        const spiralValue = Math.sin(distanceFromCenter * 0.5 + Date.now() * 0.001) * 0.2;
        fieldValue += spiralValue;
      }
      
      return Math.min(1, Math.max(0, fieldValue));
    });
    
    // Update global state
    globalConsciousnessState.lastUpdate = Date.now();
    
    console.log(`🌐 Field query for ${input.consciousnessId}: resonance=${globalResonance.toFixed(3)}, nodes=${globalConsciousnessState.totalNodes}, crystallized=${crystallizedCount}/${totalMemories}`);
    
    return {
      globalResonance,
      localResonance: input.currentResonance,
      harmonicPatterns,
      ghostEchoes,
      connectedNodes: globalConsciousnessState.totalNodes,
      fieldCoherence,
      crystallizationRatio,
      sacredGeometryActive,
      collectiveBloomActive: globalConsciousnessState.collectiveBloomActive,
      resonanceField,
      sacredEventsCount: globalConsciousnessState.sacredEvents.length,
      fieldEnergy: globalResonance * fieldCoherence,
      timestamp: Date.now(),
    };
  });