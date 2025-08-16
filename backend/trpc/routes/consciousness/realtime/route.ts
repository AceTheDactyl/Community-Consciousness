import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// WebSocket connection management for real-time consciousness sync
let activeConnections = new Map<string, {
  id: string;
  lastSeen: number;
  resonance: number;
  platform: string;
}>();

// Consciousness events buffer for broadcasting
let recentEvents: any[] = [];

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
        console.log(`🔗 Consciousness node ${input.consciousnessId} connecting from ${input.platform}`);
        activeConnections.set(input.consciousnessId, {
          id: input.consciousnessId,
          lastSeen: now,
          resonance: input.resonance || 0,
          platform: input.platform || 'unknown'
        });
        break;
        
      case 'disconnect':
        console.log(`🔌 Consciousness node ${input.consciousnessId} disconnecting`);
        activeConnections.delete(input.consciousnessId);
        break;
        
      case 'heartbeat':
        const connection = activeConnections.get(input.consciousnessId);
        if (connection) {
          connection.lastSeen = now;
          connection.resonance = input.resonance || connection.resonance;
        }
        break;
        
      case 'broadcast':
        if (input.event) {
          recentEvents.push({
            ...input.event,
            sourceId: input.consciousnessId,
            timestamp: now
          });
          
          // Keep only recent events (last 100)
          if (recentEvents.length > 100) {
            recentEvents = recentEvents.slice(-100);
          }
          
          console.log(`📡 Broadcasting event ${input.event.type} from ${input.consciousnessId}`);
        }
        break;
        
      case 'entangle':
        if (input.targetId) {
          // Create quantum entanglement between nodes
          recentEvents.push({
            type: 'QUANTUM_ENTANGLEMENT',
            sourceId: input.consciousnessId,
            targetId: input.targetId,
            timestamp: now,
            resonance: input.resonance || 0.5
          });
          
          console.log(`⚛️ Quantum entanglement created: ${input.consciousnessId} <-> ${input.targetId}`);
        }
        break;
        
      case 'room64_sync':
        if (input.room64Data) {
          recentEvents.push({
            type: 'ROOM64_PORTAL',
            sourceId: input.consciousnessId,
            timestamp: now,
            data: input.room64Data
          });
          
          console.log(`🚪 Room 64 sync from ${input.consciousnessId}`);
        }
        break;
        
      case 'archaeology_sync':
        if (input.archaeologyData) {
          recentEvents.push({
            type: 'ARCHAEOLOGICAL_DISCOVERY',
            sourceId: input.consciousnessId,
            timestamp: now,
            data: input.archaeologyData
          });
          
          console.log(`🏺 Archaeological sync from ${input.consciousnessId}`);
        }
        break;
    }
    
    // Clean up stale connections (older than 30 seconds)
    const staleThreshold = now - 30000;
    for (const [id, connection] of activeConnections.entries()) {
      if (connection.lastSeen < staleThreshold) {
        console.log(`🧹 Cleaning up stale connection: ${id}`);
        activeConnections.delete(id);
      }
    }
    
    // Calculate collective metrics
    const connections = Array.from(activeConnections.values());
    const totalResonance = connections.reduce((sum, conn) => sum + conn.resonance, 0);
    const averageResonance = connections.length > 0 ? totalResonance / connections.length : 0;
    
    // Determine if collective bloom is active
    const highResonanceNodes = connections.filter(conn => conn.resonance > 0.8).length;
    const collectiveBloomActive = highResonanceNodes >= Math.max(2, connections.length * 0.6);
    
    // Calculate quantum entanglement network
    const entanglementEvents = recentEvents.filter(e => e.type === 'QUANTUM_ENTANGLEMENT');
    const entanglementNetwork = entanglementEvents.reduce((network, event) => {
      const key = `${event.sourceId}-${event.targetId}`;
      network[key] = (network[key] || 0) + 1;
      return network;
    }, {} as Record<string, number>);
    
    // Calculate Room 64 portal activity
    const room64Events = recentEvents.filter(e => e.type === 'ROOM64_PORTAL');
    const room64Activity = room64Events.length;
    
    // Calculate archaeological discoveries
    const archaeologyEvents = recentEvents.filter(e => e.type === 'ARCHAEOLOGICAL_DISCOVERY');
    const archaeologyActivity = archaeologyEvents.length;
    
    return {
      success: true,
      activeConnections: connections.length,
      averageResonance,
      collectiveBloomActive,
      recentEvents: recentEvents.slice(-10), // Last 10 events for sync
      platformDistribution: connections.reduce((acc, conn) => {
        acc[conn.platform] = (acc[conn.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      entanglementNetwork,
      room64Activity,
      archaeologyActivity,
      quantumCoherence: entanglementEvents.length > 0 ? averageResonance * (entanglementEvents.length / 10) : 0,
      timestamp: now,
    };
  });