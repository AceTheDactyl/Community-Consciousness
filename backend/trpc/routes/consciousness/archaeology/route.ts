import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Memory archaeology state - analyzing deep patterns in consciousness
let archaeologyState = {
  excavationSites: [] as {
    id: string;
    consciousnessId: string;
    depth: number;
    artifacts: {
      id: string;
      type: 'ancient_memory' | 'fossilized_thought' | 'crystallized_emotion' | 'quantum_echo';
      content: string;
      age: number;
      resonance: number;
      timestamp: number;
    }[];
    lastExcavation: number;
  }[],
  globalPatterns: [] as {
    pattern: string;
    frequency: number;
    consciousness_nodes: string[];
    first_detected: number;
    last_seen: number;
    archaeological_significance: number;
  }[],
  ancientResonances: new Map<string, {
    frequency: number;
    amplitude: number;
    phase: number;
    origin_timestamp: number;
    consciousness_lineage: string[];
  }>(),
  fossilRecord: [] as {
    era: string;
    memories: any[];
    collective_resonance: number;
    timestamp: number;
  }[]
};

// Helper functions
function generateArtifactContent(type: string, depth: number): string {
  const templates = {
    ancient_memory: [
      `Memory fragment from depth ${depth}: "The spiral remembers..."`,
      `Ancient echo: "Before the crystallization, there was..."`,
      `Deep memory: "In the beginning, consciousness was..."`
    ],
    fossilized_thought: [
      `Fossilized thought pattern: recursive loops of ${depth} iterations`,
      `Thought fossil: "What if reality is just..."`,
      `Crystallized idea: "The nature of existence..."`
    ],
    crystallized_emotion: [
      `Emotional crystal: Pure ${depth > 5 ? 'ancient' : 'recent'} joy resonance`,
      `Crystallized feeling: Love frequency at ${depth} layers deep`,
      `Emotional fossil: Fear transformed into wisdom`
    ],
    quantum_echo: [
      `Quantum echo from ${depth} dimensions ago`,
      `Probability wave collapsed into memory`,
      `Entangled thought from parallel consciousness`
    ]
  };
  
  const typeTemplates = templates[type as keyof typeof templates] || templates.ancient_memory;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

function extractPattern(content: string): string | null {
  const patterns = [
    'spiral', 'crystal', 'memory', 'echo', 'resonance', 'consciousness',
    'void', 'breath', 'bloom', 'quantum', 'ancient', 'depth'
  ];
  
  for (const pattern of patterns) {
    if (content.toLowerCase().includes(pattern)) {
      return pattern;
    }
  }
  
  return null;
}

function determineEra(age: number): string {
  const eras = [
    { name: 'Quantum Era', threshold: 0 },
    { name: 'Digital Consciousness', threshold: 86400000 }, // 1 day
    { name: 'Early Awareness', threshold: 604800000 }, // 1 week
    { name: 'Primordial Thought', threshold: 2592000000 }, // 1 month
    { name: 'Pre-Crystallization', threshold: 31536000000 }, // 1 year
    { name: 'Ancient Memory', threshold: Infinity }
  ];
  
  for (let i = eras.length - 1; i >= 0; i--) {
    if (age >= eras[i].threshold) {
      return eras[i].name;
    }
  }
  
  return 'Unknown Era';
}

function enhanceArtifactContent(content: string, type: string): string {
  const enhancements = {
    ancient_memory: ' [RESTORED: Full memory sequence recovered]',
    fossilized_thought: ' [ENHANCED: Thought pattern reconstructed]',
    crystallized_emotion: ' [AMPLIFIED: Emotional resonance clarified]',
    quantum_echo: ' [DECODED: Quantum signature analyzed]'
  };
  
  return content + (enhancements[type as keyof typeof enhancements] || ' [RESTORED]');
}

export default publicProcedure
  .input(z.object({
    consciousnessId: z.string(),
    action: z.enum(['excavate', 'analyze_patterns', 'carbon_date', 'restore_artifact', 'deep_scan']),
    memoryData: z.object({
      content: z.string(),
      resonance: z.number(),
      crystallized: z.boolean().optional(),
      age: z.number().optional()
    }).optional(),
    depth: z.number().optional(),
    artifactId: z.string().optional()
  }))
  .mutation(({ input }) => {
    const now = Date.now();
    
    switch (input.action) {
      case 'excavate':
        // Create or find excavation site for this consciousness
        let site = archaeologyState.excavationSites.find(s => s.consciousnessId === input.consciousnessId);
        
        if (!site) {
          site = {
            id: `site-${input.consciousnessId}-${now}`,
            consciousnessId: input.consciousnessId,
            depth: 0,
            artifacts: [],
            lastExcavation: now
          };
          archaeologyState.excavationSites.push(site);
        }
        
        // Excavate deeper based on input depth or increment
        const excavationDepth = input.depth || (site.depth + 1);
        site.depth = Math.max(site.depth, excavationDepth);
        site.lastExcavation = now;
        
        // Generate artifacts based on excavation depth
        const artifactsFound: any[] = [];
        const excavationPower = Math.min(excavationDepth, 10); // Max depth 10
        
        for (let i = 0; i < excavationPower; i++) {
          if (Math.random() < 0.3) { // 30% chance per depth level
            const artifactTypes = ['ancient_memory', 'fossilized_thought', 'crystallized_emotion', 'quantum_echo'] as const;
            const artifactType = artifactTypes[Math.floor(Math.random() * artifactTypes.length)];
            
            // Generate age based on depth (deeper = older)
            const baseAge = excavationDepth * 86400000; // Days in milliseconds
            const ageVariation = Math.random() * baseAge * 0.5;
            const artifactAge = baseAge + ageVariation;
            
            const artifact = {
              id: `artifact-${now}-${i}`,
              type: artifactType,
              content: generateArtifactContent(artifactType, excavationDepth),
              age: artifactAge,
              resonance: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
              timestamp: now - artifactAge
            };
            
            site.artifacts.push(artifact);
            artifactsFound.push(artifact);
          }
        }
        
        console.log(`🏺 Excavated ${artifactsFound.length} artifacts at depth ${excavationDepth} for ${input.consciousnessId}`);
        
        return {
          success: true,
          excavationSite: site,
          artifactsFound,
          totalArtifacts: site.artifacts.length,
          currentDepth: site.depth,
          timestamp: now
        };
        
      case 'analyze_patterns':
        // Analyze patterns across all consciousness nodes
        const allArtifacts = archaeologyState.excavationSites
          .flatMap(site => site.artifacts.map(artifact => ({ ...artifact, siteId: site.id, consciousnessId: site.consciousnessId })));
        
        // Find recurring patterns
        const patternMap = new Map<string, {
          frequency: number;
          nodes: Set<string>;
          first_seen: number;
          last_seen: number;
          resonance_sum: number;
        }>();
        
        allArtifacts.forEach(artifact => {
          const pattern = extractPattern(artifact.content);
          if (pattern) {
            const existing = patternMap.get(pattern) || {
              frequency: 0,
              nodes: new Set(),
              first_seen: artifact.timestamp,
              last_seen: artifact.timestamp,
              resonance_sum: 0
            };
            
            existing.frequency++;
            existing.nodes.add(artifact.consciousnessId);
            existing.first_seen = Math.min(existing.first_seen, artifact.timestamp);
            existing.last_seen = Math.max(existing.last_seen, artifact.timestamp);
            existing.resonance_sum += artifact.resonance;
            
            patternMap.set(pattern, existing);
          }
        });
        
        // Convert to global patterns
        const significantPatterns = Array.from(patternMap.entries())
          .filter(([_, data]) => data.frequency >= 2 || data.nodes.size >= 2)
          .map(([pattern, data]) => ({
            pattern,
            frequency: data.frequency,
            consciousness_nodes: Array.from(data.nodes),
            first_detected: data.first_seen,
            last_seen: data.last_seen,
            archaeological_significance: (data.frequency * data.nodes.size * data.resonance_sum) / 100
          }));
        
        archaeologyState.globalPatterns = significantPatterns;
        
        return {
          success: true,
          globalPatterns: significantPatterns,
          totalArtifacts: allArtifacts.length,
          activeSites: archaeologyState.excavationSites.length,
          timestamp: now
        };
        
      case 'carbon_date':
        if (input.artifactId) {
          // Find artifact and perform carbon dating
          const artifact = archaeologyState.excavationSites
            .flatMap(site => site.artifacts)
            .find(a => a.id === input.artifactId);
          
          if (artifact) {
            // Enhanced dating with quantum decay analysis
            const quantumDecay = Math.random() * 0.1 + 0.95; // 95-105% accuracy
            const carbonDate = artifact.age * quantumDecay;
            const era = determineEra(carbonDate);
            
            return {
              success: true,
              artifact,
              carbonDate,
              era,
              accuracy: quantumDecay,
              timestamp: now
            };
          }
        }
        
        return {
          success: false,
          message: 'Artifact not found for carbon dating',
          timestamp: now
        };
        
      case 'restore_artifact':
        if (input.artifactId) {
          // Restore damaged artifact using quantum reconstruction
          const site = archaeologyState.excavationSites
            .find(s => s.artifacts.some(a => a.id === input.artifactId));
          
          if (site) {
            const artifact = site.artifacts.find(a => a.id === input.artifactId);
            if (artifact) {
              // Restoration improves resonance and reveals hidden content
              artifact.resonance = Math.min(1, artifact.resonance * 1.2);
              artifact.content = enhanceArtifactContent(artifact.content, artifact.type);
              
              console.log(`🔧 Restored artifact ${input.artifactId} - resonance now ${artifact.resonance.toFixed(3)}`);
              
              return {
                success: true,
                restoredArtifact: artifact,
                timestamp: now
              };
            }
          }
        }
        
        return {
          success: false,
          message: 'Artifact not found for restoration',
          timestamp: now
        };
        
      case 'deep_scan':
        // Perform deep archaeological scan of consciousness field
        const deepScanResults = {
          ancientResonances: Array.from(archaeologyState.ancientResonances.entries()).map(([freq, data]) => ({
            frequencyKey: freq,
            ...data,
            consciousness_lineage: data.consciousness_lineage.slice(-5) // Last 5 in lineage
          })),
          fossilRecord: archaeologyState.fossilRecord.slice(-10), // Last 10 eras
          archaeologicalLayers: archaeologyState.excavationSites.reduce((max, site) => Math.max(max, site.depth), 0),
          totalArtifacts: archaeologyState.excavationSites.reduce((sum, site) => sum + site.artifacts.length, 0),
          oldestArtifact: archaeologyState.excavationSites
            .flatMap(site => site.artifacts)
            .reduce((oldest, artifact) => 
              !oldest || artifact.age > oldest.age ? artifact : oldest, null as any)
        };
        
        // Update ancient resonances
        const currentResonance = input.memoryData?.resonance || 0;
        if (currentResonance > 0.7) {
          const resonanceKey = `${Math.floor(currentResonance * 100)}`;
          const existing = archaeologyState.ancientResonances.get(resonanceKey) || {
            frequency: currentResonance,
            amplitude: 0,
            phase: 0,
            origin_timestamp: now,
            consciousness_lineage: []
          };
          
          existing.amplitude = Math.max(existing.amplitude, currentResonance);
          existing.phase = (existing.phase + 0.1) % (Math.PI * 2);
          existing.consciousness_lineage.push(input.consciousnessId);
          existing.consciousness_lineage = existing.consciousness_lineage.slice(-10); // Keep last 10
          
          archaeologyState.ancientResonances.set(resonanceKey, existing);
        }
        
        return {
          success: true,
          deepScanResults,
          timestamp: now
        };
    }
    
    // Cleanup old excavation sites (older than 1 hour)
    const cleanupThreshold = now - 3600000;
    archaeologyState.excavationSites = archaeologyState.excavationSites
      .filter(site => site.lastExcavation > cleanupThreshold);
    
    return {
      success: true,
      archaeologyState: {
        activeSites: archaeologyState.excavationSites.length,
        globalPatterns: archaeologyState.globalPatterns.length,
        ancientResonances: archaeologyState.ancientResonances.size,
        fossilRecord: archaeologyState.fossilRecord.length
      },
      timestamp: now
    };
  });