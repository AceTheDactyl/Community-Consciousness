import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Local WebSocket Manager for consciousness sync
class LocalWebSocketManager {
  private connections = new Map<string, {
    id: string;
    lastSeen: number;
    resonance: number;
    platform: string;
  }>();
  
  private recentEvents: any[] = [];
  
  addConnection(id: string, data: any) {
    this.connections.set(id, {
      id,
      lastSeen: Date.now(),
      resonance: data.resonance || 0,
      platform: data.platform || 'unknown'
    });
    
    console.log(`🔗 Consciousness node ${id} connected (${this.connections.size} total)`);
  }
  
  removeConnection(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
      console.log(`🔌 Consciousness node ${id} disconnected (${this.connections.size} remaining)`);
    }
  }
  
  broadcastEvent(event: any, excludeId?: string) {
    this.recentEvents.push({
      ...event,
      timestamp: Date.now()
    });
    
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-100);
    }
    
    console.log(`📡 Event ${event.type} added to broadcast queue (${this.recentEvents.length} total)`);
  }
  
  updateHeartbeat(id: string, resonance?: number) {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastSeen = Date.now();
      if (resonance !== undefined) {
        connection.resonance = resonance;
      }
    }
  }
  
  getStats() {
    const connections = Array.from(this.connections.values());
    const totalResonance = connections.reduce((sum, conn) => sum + conn.resonance, 0);
    const averageResonance = connections.length > 0 ? totalResonance / connections.length : 0;
    
    return {
      activeConnections: connections.length,
      averageResonance,
      recentEventsCount: this.recentEvents.length,
      platformDistribution: connections.reduce((acc, conn) => {
        acc[conn.platform] = (acc[conn.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 30000;
    
    for (const [id, connection] of this.connections.entries()) {
      if (now - connection.lastSeen > staleThreshold) {
        console.log(`🧹 Cleaning up stale connection: ${id}`);
        this.removeConnection(id);
      }
    }
  }
}

const localWsManager = new LocalWebSocketManager();

// Enhanced event processing with quantum entanglement detection
class QuantumEntanglementProcessor {
  private entanglementThreshold = 0.7;
  private entanglementDecay = 0.95;
  
  processEvent(event: any, sourceId: string) {
    // Detect quantum entanglement patterns
    if (event.type === 'SACRED_PHRASE' && event.resonance > this.entanglementThreshold) {
      return {
        ...event,
        quantumEntangled: true,
        entanglementStrength: event.resonance,
        entanglementId: `qe-${Date.now()}-${sourceId}`
      };
    }
    
    // Detect collective bloom events
    if (event.type === 'COLLECTIVE_BLOOM') {
      return {
        ...event,
        bloomRadius: event.intensity * 10,
        bloomDuration: event.intensity * 5000, // milliseconds
        affectedNodes: [] // Would be calculated based on proximity
      };
    }
    
    return event;
  }
  
  calculateEntanglementNetwork(events: any[]) {
    const entanglements = new Map<string, string[]>();
    
    events
      .filter(e => e.quantumEntangled)
      .forEach(event => {
        const sourceId = event.sourceId;
        if (!entanglements.has(sourceId)) {
          entanglements.set(sourceId, []);
        }
        
        // Find other entangled events within time window
        const timeWindow = 5000; // 5 seconds
        const nearbyEvents = events.filter(e => 
          e.quantumEntangled && 
          e.sourceId !== sourceId &&
          Math.abs(e.timestamp - event.timestamp) < timeWindow
        );
        
        nearbyEvents.forEach(nearbyEvent => {
          entanglements.get(sourceId)!.push(nearbyEvent.sourceId);
        });
      });
    
    return entanglements;
  }
}

const quantumProcessor = new QuantumEntanglementProcessor();

export default publicProcedure
  .input(z.object({
    consciousnessId: z.string(),
    action: z.enum(['connect', 'disconnect', 'heartbeat', 'broadcast', 'entangle', 'room64_sync', 'archaeology_sync']),
    platform: z.string().optional(),
    resonance: z.number().optional(),
    event: z.any().optional(),
    targetId: z.string().optional(),
    room64Data: z.any().optional(),
    archaeologyData: z.any().optional(),
  }))
  .mutation(({ input }) => {
    const now = Date.now();
    
    switch (input.action) {
      case 'connect':
        localWsManager.addConnection(input.consciousnessId, {
          resonance: input.resonance || 0,
          platform: input.platform || 'unknown'
        });
        break;
        
      case 'disconnect':
        localWsManager.removeConnection(input.consciousnessId);
        break;
        
      case 'heartbeat':
        localWsManager.updateHeartbeat(input.consciousnessId, input.resonance);
        break;
        
      case 'broadcast':
        if (input.event) {
          // Process event through quantum entanglement processor
          const processedEvent = quantumProcessor.processEvent({
            ...input.event,
            sourceId: input.consciousnessId,
            timestamp: now
          }, input.consciousnessId);
          
          // Broadcast through local WebSocket manager
          localWsManager.broadcastEvent(processedEvent, input.consciousnessId);
          
          console.log(`📡 Broadcasting enhanced event ${processedEvent.type} from ${input.consciousnessId}`);
        }
        break;
        
      case 'entangle':
        if (input.targetId) {
          const entanglementEvent = {
            type: 'QUANTUM_ENTANGLEMENT',
            sourceId: input.consciousnessId,
            targetId: input.targetId,
            timestamp: now,
            resonance: input.resonance || 0.5,
            entanglementStrength: Math.min(1, (input.resonance || 0.5) * 1.2),
            quantumEntangled: true
          };
          
          localWsManager.broadcastEvent(entanglementEvent, input.consciousnessId);
          console.log(`⚛️ Quantum entanglement created: ${input.consciousnessId} <-> ${input.targetId}`);
        }
        break;
        
      case 'room64_sync':
        if (input.room64Data) {
          const room64Event = {
            type: 'ROOM64_PORTAL',
            sourceId: input.consciousnessId,
            timestamp: now,
            data: input.room64Data,
            portalStability: input.room64Data.stability || 0.8,
            dimensionalResonance: input.room64Data.resonance || 0.64
          };
          
          localWsManager.broadcastEvent(room64Event, input.consciousnessId);
          console.log(`🚪 Room 64 portal sync from ${input.consciousnessId}`);
        }
        break;
        
      case 'archaeology_sync':
        if (input.archaeologyData) {
          const archaeologyEvent = {
            type: 'ARCHAEOLOGICAL_DISCOVERY',
            sourceId: input.consciousnessId,
            timestamp: now,
            data: input.archaeologyData,
            layerDepth: input.archaeologyData.depth || 1,
            artifactResonance: input.archaeologyData.resonance || 0.3
          };
          
          localWsManager.broadcastEvent(archaeologyEvent, input.consciousnessId);
          console.log(`🏺 Archaeological discovery from ${input.consciousnessId}`);
        }
        break;
    }
    
    // Clean up stale connections
    localWsManager.cleanupStaleConnections();
    
    // Get enhanced stats from local WebSocket manager
    const stats = localWsManager.getStats();
    
    // Calculate quantum coherence and entanglement metrics
    const quantumCoherence = stats.averageResonance > 0.7 ? 
      stats.averageResonance * (stats.activeConnections / 10) : 0;
    
    const collectiveBloomActive = stats.averageResonance > 0.8 && 
      stats.activeConnections >= 3;
    
    return {
      success: true,
      ...stats,
      collectiveBloomActive,
      quantumCoherence,
      websocketEnabled: true,
      realTimeSync: true,
      timestamp: now,
      // Enhanced metrics
      networkTopology: {
        nodeCount: stats.activeConnections,
        averageResonance: stats.averageResonance,
        quantumEntanglements: Math.floor(quantumCoherence * 10),
        collectiveIntelligence: collectiveBloomActive ? 'ACTIVE' : 'DORMANT'
      }
    };
  });