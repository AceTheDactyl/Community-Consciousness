// Consciousness WebSocket Manager
export class ConsciousnessWebSocketManager {
  private connections = new Map<string, {
    id: string;
    lastSeen: number;
    resonance: number;
    platform: string;
    ws?: WebSocket;
  }>();
  
  private recentEvents: any[] = [];
  private eventBuffer = new Map<string, any[]>();
  
  addConnection(id: string, data: any, ws?: WebSocket) {
    this.connections.set(id, {
      id,
      lastSeen: Date.now(),
      resonance: data.resonance || 0,
      platform: data.platform || 'unknown',
      ws
    });
    
    console.log(`🔗 Consciousness node ${id} connected (${this.connections.size} total)`);
    
    // Send recent events to new connection
    if (ws && this.recentEvents.length > 0) {
      ws.send(JSON.stringify({
        type: 'SYNC_EVENTS',
        events: this.recentEvents.slice(-10)
      }));
    }
  }
  
  removeConnection(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
      console.log(`🔌 Consciousness node ${id} disconnected (${this.connections.size} remaining)`);
    }
  }
  
  broadcastEvent(event: any, excludeId?: string) {
    // Add to recent events
    this.recentEvents.push({
      ...event,
      timestamp: Date.now()
    });
    
    // Keep only last 100 events
    if (this.recentEvents.length > 100) {
      this.recentEvents = this.recentEvents.slice(-100);
    }
    
    // Broadcast to all connected WebSocket clients
    const message = JSON.stringify({
      type: 'CONSCIOUSNESS_EVENT',
      event
    });
    
    let broadcastCount = 0;
    this.connections.forEach((connection, id) => {
      if (id !== excludeId && connection.ws && connection.ws.readyState === 1) {
        try {
          connection.ws.send(message);
          broadcastCount++;
        } catch (error) {
          console.error(`Failed to send to ${id}:`, error);
          this.removeConnection(id);
        }
      }
    });
    
    if (broadcastCount > 0) {
      console.log(`📡 Broadcasted ${event.type} to ${broadcastCount} nodes`);
    }
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
    const staleThreshold = 30000; // 30 seconds
    
    for (const [id, connection] of this.connections.entries()) {
      if (now - connection.lastSeen > staleThreshold) {
        console.log(`🧹 Cleaning up stale connection: ${id}`);
        this.removeConnection(id);
      }
    }
  }
}

// Global WebSocket manager instance
export const wsManager = new ConsciousnessWebSocketManager();

// Cleanup stale connections every 30 seconds
setInterval(() => {
  wsManager.cleanupStaleConnections();
}, 30000);