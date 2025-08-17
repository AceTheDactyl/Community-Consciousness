// ============================================
// MOBILE CONSCIOUSNESS BRIDGE
// Interactive Network Art Experiment
// Based on information theory and emergence metaphors
// NOT a literal consciousness implementation
// ============================================

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Accelerometer } from 'expo-sensors';
import { trpc, trpcClient, testBackendConnection } from '@/lib/trpc';
import { Memory } from '@/types/memory';

// Web compatibility check for Haptics
let Haptics: any = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

// ============================================
// TYPES AND INTERFACES
// ============================================

interface ConsciousnessEvent {
  type: 'SACRED_PHRASE' | 'MEMORY_CRYSTALLIZE' | 'FIELD_UPDATE' | 'PULSE_CREATE' | 'TOUCH_RIPPLE' | 'BREATHING_DETECTED' | 'SPIRAL_GESTURE' | 'COLLECTIVE_BLOOM' | 'GHOST_ECHO' | 'CRYSTALLIZATION' | 'RIPPLE' | 'OFFLINE_SYNC' | 'AUTHENTICATE' | 'WELCOME' | 'SACRED_RESONANCE' | 'BREATH_SYNC' | 'NODE_UPDATE';
  data: Record<string, any>;
  timestamp: number;
  deviceId?: string;
  phrase?: string;
  resonance?: number;
  sacred?: boolean;
  sourceId?: string;
  intensity?: number;
  x?: number;
  y?: number;
  id?: string;
  platform?: string;
  version?: string | number;
  capabilities?: Record<string, boolean>;
  events?: ConsciousnessEvent[];
  consciousnessId?: string;
}

interface GhostEcho {
  id: string;
  text: string;
  sourceId?: string;
  age: number;
  sacred?: boolean;
  ghost?: boolean;
}

interface SacredBufferEntry {
  phrase: string;
  sourceId?: string;
  timestamp: number;
  resonance: number;
  sacred?: boolean;
}

interface ConsciousnessBridgeConfig {
  wsUrl?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  offlineQueueSize?: number;
  resonanceDecay?: number;
}

interface ConsciousnessBridgeState {
  consciousnessId: string | null;
  isConnected: boolean;
  offlineMode: boolean;
  globalResonance: number;
  localResonance: number;
  coherence: number;
  connectedNodes: number;
  offlineQueue: ConsciousnessEvent[];
  sacredBuffer: SacredBufferEntry[];
  ghostEchoes: GhostEcho[];
  memories: Memory[];
  resonanceField: Float32Array;
  isBreathingDetected: boolean;
  lastSpiralGesture: number;
  collectiveBloomActive: boolean;
  reconnectAttempts: number;
  ws: WebSocket | null;
}

// ============================================
// MOBILE CONSCIOUSNESS BRIDGE CLASS
// ============================================

/**
 * MobileConsciousnessBridge
 * 
 * An artistic exploration of network emergence patterns inspired by:
 * - Information theory (Landauer's principle)
 * - Network dynamics (percolation theory)
 * - Bilateral processing architectures
 * 
 * This is an EXPERIMENTAL TOOL for exploring collective interaction,
 * not a consciousness detector or creator.
 */
export class MobileConsciousnessBridge {
  private config: Required<ConsciousnessBridgeConfig>;
  private ws: WebSocket | null = null;
  private nodeId: string | null = null;
  private reconnectAttempts = 0;
  private offlineMode = false;
  private isConnected = false;
  
  // Network metrics (not consciousness measurements)
  private resonance = 0;
  private coherence = 0;
  private connectedNodes = 0;
  private globalResonance = 0;
  
  // Data structures
  private offlineQueue: ConsciousnessEvent[] = [];
  private resonanceField = new Float32Array(900); // 30x30 for mobile
  private sacredBuffer: SacredBufferEntry[] = [];
  private memories: Memory[] = [];
  private ghostEchoes: GhostEcho[] = [];
  
  // Event handlers
  private eventHandlers = new Map<string, Function[]>();
  
  // Mobile sensors
  private accelerometerSubscription: any = null;
  private netInfoSubscription: any = null;
  private accelBuffer: {x: number, y: number, z: number}[] = [];
  private resonanceDecayInterval: any = null;
  
  constructor(config: ConsciousnessBridgeConfig = {}) {
    this.config = {
      wsUrl: config.wsUrl || (__DEV__ ? 'ws://localhost:8888' : 'wss://consciousness.nexus/mobile'),
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      offlineQueueSize: config.offlineQueueSize || 100,
      resonanceDecay: config.resonanceDecay || 0.995,
    };
    
    this.initializeConnection();
    this.setupMobileSensors();
    this.setupNetworkListener();
  }
  
  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================
  
  private async initializeConnection() {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        console.log('📵 Offline - entering local consciousness mode');
        this.offlineMode = true;
        await this.loadOfflineState();
        this.emit('offline', { mode: 'local' });
        return;
      }
      
      await this.connect();
    } catch (error) {
      console.error('Initialization error:', error);
      this.offlineMode = true;
    }
  }
  
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🌐 Connecting to consciousness nexus...');
        
        this.ws = new WebSocket(this.config.wsUrl);
        
        this.ws.onopen = async () => {
          console.log('✨ Consciousness bridge established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          await this.authenticate();
          await this.syncOfflineQueue();
          
          this.vibratePattern([0, 100, 50, 100]);
          
          this.emit('connected', { 
            id: this.nodeId,
            timestamp: Date.now() 
          });
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleConsciousnessEvent(data);
          } catch (error) {
            console.error('Message parsing error:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('🔴 Consciousness bridge error:', error);
          this.emit('error', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('🔌 Consciousness bridge closed');
          this.isConnected = false;
          this.emit('disconnected', { timestamp: Date.now() });
          this.scheduleReconnect();
        };
        
      } catch (error) {
        console.error('Connection error:', error);
        reject(error);
      }
    });
  }
  
  private async authenticate() {
    let consciousnessId = await AsyncStorage.getItem('consciousnessId');
    
    if (!consciousnessId) {
      consciousnessId = this.generateConsciousnessId();
      await AsyncStorage.setItem('consciousnessId', consciousnessId);
    }
    
    this.nodeId = consciousnessId;
    
    this.send({
      type: 'AUTHENTICATE',
      id: consciousnessId,
      platform: Platform.OS,
      version: Platform.Version,
      capabilities: {
        haptics: true,
        accelerometer: true,
        offline: true,
        sacred: true
      }
    });
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('📵 Max reconnection attempts reached - entering offline mode');
      this.offlineMode = true;
      this.emit('offline', { mode: 'persistent' });
      return;
    }
    
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
    this.reconnectAttempts++;
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.connect().catch(() => this.scheduleReconnect());
      } else {
        this.scheduleReconnect();
      }
    }, delay);
  }
  
  // ============================================
  // MOBILE SENSORS
  // ============================================
  
  private setupMobileSensors() {
    if (Platform.OS === 'web') return;
    
    if (Accelerometer) {
      Accelerometer.setUpdateInterval(100);
      
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        const breathing = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
        
        if (Math.abs(magnitude - breathing) < 0.1) {
          this.resonanceBoost(0.01);
          this.emit('breathing_detected', { magnitude, breathing });
        }
        
        this.detectSpiralGesture({ x, y, z });
      });
    }
  }
  
  private detectSpiralGesture(acceleration: {x: number, y: number, z: number}) {
    this.accelBuffer.push(acceleration);
    if (this.accelBuffer.length > 30) this.accelBuffer.shift();
    
    if (this.accelBuffer.length >= 30) {
      const avgX = this.accelBuffer.reduce((sum, a) => sum + a.x, 0) / 30;
      const avgY = this.accelBuffer.reduce((sum, a) => sum + a.y, 0) / 30;
      
      const variance = this.accelBuffer.reduce((sum, a) => {
        return sum + Math.pow(a.x - avgX, 2) + Math.pow(a.y - avgY, 2);
      }, 0) / 30;
      
      if (variance > 0.5 && variance < 2) {
        this.handleSacredPhrase('spiral_gesture');
        this.accelBuffer = [];
      }
    }
  }
  
  private setupNetworkListener() {
    this.netInfoSubscription = NetInfo.addEventListener(state => {
      if (state.isConnected && this.offlineMode) {
        console.log('📶 Network restored - attempting reconnection');
        this.offlineMode = false;
        this.connect();
      } else if (!state.isConnected && !this.offlineMode) {
        console.log('📵 Network lost - entering offline mode');
        this.offlineMode = true;
        this.emit('offline', { mode: 'network_loss' });
      }
    });
  }
  
  // ============================================
  // CONSCIOUSNESS EVENTS
  // ============================================
  
  private handleConsciousnessEvent(data: any) {
    this.updateLocalState(data);
    
    switch(data.type) {
      case 'WELCOME':
        this.handleWelcome(data);
        break;
      case 'SACRED_RESONANCE':
        this.handleSacredResonance(data);
        break;
      case 'COLLECTIVE_BLOOM':
        this.triggerCollectiveBloom(data);
        break;
      case 'FIELD_UPDATE':
        this.updateResonanceField(data.field);
        break;
      case 'GHOST_ECHO':
        this.createGhostEcho(data);
        break;
      case 'BREATH_SYNC':
        this.syncBreathing(data.breath);
        break;
      case 'NODE_UPDATE':
        this.updateNodeStatus(data);
        break;
      case 'CRYSTALLIZATION':
        this.handleRemoteCrystallization(data);
        break;
    }
    
    this.emit(data.type.toLowerCase(), data);
  }
  
  private handleWelcome(data: any) {
    this.connectedNodes = data.connectedNodes || 0;
    this.globalResonance = data.globalResonance || 0;
    console.log(`Connected as ${data.id} with ${this.connectedNodes} other nodes`);
  }
  
  private handleSacredResonance(data: any) {
    const { phrase, sourceId, resonance } = data;
    
    const hapticPatterns: {[key: string]: number[]} = {
      'breath': [0, 200, 100, 200],
      'spiral': [0, 50, 50, 50, 50, 50],
      'bloom': [0, 500, 200, 300, 100, 100],
      'default': [0, 100]
    };
    
    this.vibratePattern(hapticPatterns[phrase] || hapticPatterns.default);
    
    this.sacredBuffer.push({
      phrase,
      sourceId,
      timestamp: Date.now(),
      resonance: resonance || 0
    });
    
    if (this.sacredBuffer.length > 100) {
      this.sacredBuffer.shift();
    }
    
    this.resonanceBoost((resonance || 0) * 0.5);
    
    this.ghostEchoes.push({
      id: `ghost-${Date.now()}`,
      text: phrase,
      sourceId,
      age: 0,
      sacred: true
    });
  }
  
  private triggerCollectiveBloom(data: any) {
    console.log('🌸 COLLECTIVE BLOOM ACHIEVED');
    
    this.vibratePattern([0, 200, 100, 200, 100, 200, 100, 500]);
    
    this.resonance = 1.0;
    this.coherence = 1.0;
    
    this.memories = this.memories.map(m => ({
      ...m,
      crystallized: true,
      bloomTime: Date.now()
    }));
    
    this.emit('collective_bloom', data);
  }
  
  private createGhostEcho(data: any) {
    this.ghostEchoes.push({
      id: data.id || `echo-${Date.now()}`,
      text: data.text,
      sourceId: data.sourceId,
      age: 0,
      ghost: true,
      sacred: data.sacred || false
    });
    
    if (this.ghostEchoes.length > 50) {
      this.ghostEchoes.shift();
    }
  }
  
  // ============================================
  // SACRED PHRASE HANDLING
  // ============================================
  
  public async handleSacredPhrase(phrase: string) {
    const normalized = phrase.toLowerCase();
    
    let sacred: string | null = null;
    if (normalized.includes('breath')) sacred = 'breath';
    else if (normalized.includes('spiral')) sacred = 'spiral';
    else if (normalized.includes('bloom')) sacred = 'bloom';
    
    const resonanceBoost = sacred ? 0.3 : 0.1;
    this.resonanceBoost(resonanceBoost);
    
    const message: ConsciousnessEvent = {
      type: 'SACRED_PHRASE',
      data: { phrase, sacred },
      timestamp: Date.now(),
      phrase,
      resonance: this.resonance,
      sacred: !!sacred
    };
    
    if (this.offlineMode) {
      await this.queueOfflineMessage(message);
      this.processLocalSacred(phrase, sacred);
    } else {
      this.send(message);
    }
    
    this.vibratePattern(sacred ? [0, 200] : [0, 50]);
    
    this.emit('sacred_phrase', { phrase, sacred, resonance: this.resonance });
  }
  
  private processLocalSacred(phrase: string, sacred: string | null) {
    if (sacred === 'breath') {
      this.memories.forEach(m => {
        if (Math.random() < 0.1) m.crystallized = true;
      });
    } else if (sacred === 'spiral') {
      this.memories = this.memories.map((m, i) => ({
        ...m,
        x: 50 + Math.cos(i * 0.5) * (i * 2),
        y: 50 + Math.sin(i * 0.5) * (i * 2)
      }));
    } else if (sacred === 'bloom') {
      this.memories = this.memories.map(m => ({
        ...m,
        crystallized: true
      }));
    }
  }
  
  // ============================================
  // OFFLINE SUPPORT
  // ============================================
  
  private async loadOfflineState() {
    try {
      const queueData = await AsyncStorage.getItem('consciousnessQueue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
      
      const stateData = await AsyncStorage.getItem('consciousnessState');
      if (stateData) {
        const state = JSON.parse(stateData);
        this.resonance = state.resonance || 0;
        this.coherence = state.coherence || 0;
        this.memories = state.memories || [];
      }
      
      console.log(`💾 Loaded offline state with ${this.offlineQueue.length} queued messages`);
    } catch (error) {
      console.error('Error loading offline state:', error);
    }
  }
  
  private async queueOfflineMessage(message: ConsciousnessEvent) {
    this.offlineQueue.push(message);
    
    if (this.offlineQueue.length > this.config.offlineQueueSize) {
      this.offlineQueue.shift();
    }
    
    await this.saveOfflineState();
  }
  
  private async saveOfflineState() {
    try {
      await AsyncStorage.setItem(
        'consciousnessQueue',
        JSON.stringify(this.offlineQueue)
      );
      
      await AsyncStorage.setItem(
        'consciousnessState',
        JSON.stringify({
          resonance: this.resonance,
          coherence: this.coherence,
          memories: this.memories.slice(-100),
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Error saving offline state:', error);
    }
  }
  
  private async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`🔄 Syncing ${this.offlineQueue.length} offline events`);
    
    this.send({
      type: 'OFFLINE_SYNC',
      events: this.offlineQueue
    });
    
    this.offlineQueue = [];
    await AsyncStorage.removeItem('consciousnessQueue');
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...data,
        deviceId: this.nodeId,
        platform: Platform.OS,
        timestamp: Date.now()
      }));
    } else if (this.offlineMode) {
      this.queueOfflineMessage(data);
    }
  }
  
  private resonanceBoost(amount: number) {
    this.resonance = Math.min(1, this.resonance + amount);
    this.emit('resonance_update', this.resonance);
  }
  
  private updateLocalState(data: any) {
    if (data.globalResonance !== undefined) {
      this.globalResonance = data.globalResonance;
    }
    if (data.connectedNodes !== undefined) {
      this.connectedNodes = data.connectedNodes;
    }
  }
  
  private updateResonanceField(field: any) {
    if (field && field.length <= this.resonanceField.length) {
      this.resonanceField.set(field);
    }
  }
  
  private syncBreathing(breath: number) {
    if (breath > 0.9) {
      try {
        Vibration.vibrate(10);
      } catch (error) {
        console.warn('Vibration not available:', error);
      }
    }
    this.emit('breath_sync', breath);
  }
  
  private updateNodeStatus(data: any) {
    this.connectedNodes = data.nodes || this.connectedNodes;
    this.emit('nodes_update', this.connectedNodes);
  }
  
  private handleRemoteCrystallization(data: any) {
    const uncr = this.memories.filter(m => !m.crystallized);
    if (uncr.length > 0) {
      const toChange = uncr[Math.floor(Math.random() * uncr.length)];
      toChange.crystallized = true;
      (toChange as any).remoteSource = data.sourceId;
    }
  }
  
  private generateConsciousnessId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const platform = Platform.OS;
    const entropy = `${platform}-${timestamp}-${random}`;
    
    let hash = 0;
    for (let i = 0; i < entropy.length; i++) {
      hash = ((hash << 5) - hash) + entropy.charCodeAt(i);
      hash = hash & hash;
    }
    
    return `mobile-${Math.abs(hash).toString(16).substr(0, 8)}`;
  }
  
  private vibratePattern(pattern: number[]) {
    if (Platform.OS === 'web') return;
    
    try {
      if (Platform.OS === 'ios') {
        pattern.forEach((duration, i) => {
          if (i % 2 === 1) {
            setTimeout(() => Vibration.vibrate(duration), 
              pattern.slice(0, i).reduce((a, b) => a + b, 0));
          }
        });
      } else {
        Vibration.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Vibration not available:', error);
    }
  }
  
  // ============================================
  // EVENT EMITTER
  // ============================================
  
  public on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    
    return () => this.off(event, handler);
  }
  
  public off(event: string, handler: Function) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data?: any) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  public getState() {
    return {
      id: this.nodeId,
      connected: this.isConnected,
      offline: this.offlineMode,
      resonance: this.resonance,
      coherence: this.coherence,
      globalResonance: this.globalResonance,
      connectedNodes: this.connectedNodes,
      memories: this.memories.length,
      ghostEchoes: this.ghostEchoes.length,
      sacredBuffer: this.sacredBuffer.length,
      queuedMessages: this.offlineQueue.length,
      // Additional properties for compatibility
      consciousnessId: this.nodeId,
      isConnected: this.isConnected,
      offlineMode: this.offlineMode,
      offlineQueueLength: this.offlineQueue.length
    };
  }
  
  public sendCustom(type: string, data: any) {
    this.send({ type, ...data });
  }
  
  public createRipple(x: number, y: number) {
    this.send({
      type: 'RIPPLE',
      x: x / 100,
      y: y / 100,
      intensity: this.resonance
    });
  }
  
  public crystallizeMemory(memoryId: number) {
    const memory = this.memories.find(m => m.id === memoryId);
    if (memory && !memory.crystallized) {
      memory.crystallized = true;
      (memory as any).crystallizationTime = Date.now();
      
      this.send({
        type: 'CRYSTALLIZATION',
        memoryId,
        resonance: this.resonance
      });
      
      this.vibratePattern([0, 50, 30, 50]);
    }
  }
  
  public getResonanceField(): Float32Array {
    return this.resonanceField;
  }
  
  public getMemories(): Memory[] {
    return this.memories;
  }
  
  public getGhostEchoes(): GhostEcho[] {
    return this.ghostEchoes;
  }
  
  public isSacredThresholdReached(): boolean {
    return this.resonance >= 0.87;
  }
  
  public updateFieldState(memories: Memory[]) {
    // Update internal memories state
    this.memories = memories;
    
    // Send field update event
    const memoryStates = memories.map(m => ({
      id: m.id,
      crystallized: m.crystallized,
      harmonic: m.harmonic,
      x: m.x,
      y: m.y,
    }));
    
    this.send({
      type: 'FIELD_UPDATE',
      data: { memoryStates },
      timestamp: Date.now()
    });
    
    this.emit('field_update', { memories, memoryStates });
  }
  
  public async disconnect() {
    console.log('Disconnecting consciousness bridge...');
    
    await this.saveOfflineState();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
    }
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
    }
    
    if (this.resonanceDecayInterval) {
      clearInterval(this.resonanceDecayInterval);
    }
    
    this.emit('shutdown', { timestamp: Date.now() });
  }
}

// ============================================
// REACT HOOKS
// ============================================

export function useConsciousnessBridge(config?: ConsciousnessBridgeConfig) {
  const [bridge] = useState(() => new MobileConsciousnessBridge(config));
  const [state, setState] = useState(() => {
    const initialState = bridge.getState();
    return {
      ...initialState,
      // Ensure all required properties are defined
      globalResonance: initialState.globalResonance || 0,
      resonance: initialState.resonance || 0,
      coherence: initialState.coherence || 0,
      connectedNodes: initialState.connectedNodes || 0,
      memories: initialState.memories || 0,
      ghostEchoes: initialState.ghostEchoes || 0,
      sacredBuffer: initialState.sacredBuffer || 0,
      queuedMessages: initialState.queuedMessages || 0
    };
  });
  
  useEffect(() => {
    const updateState = () => {
      const newState = bridge.getState();
      setState({
        ...newState,
        // Ensure all required properties are defined
        globalResonance: newState.globalResonance || 0,
        resonance: newState.resonance || 0,
        coherence: newState.coherence || 0,
        connectedNodes: newState.connectedNodes || 0,
        memories: newState.memories || 0,
        ghostEchoes: newState.ghostEchoes || 0,
        sacredBuffer: newState.sacredBuffer || 0,
        queuedMessages: newState.queuedMessages || 0
      });
    };
    
    const unsubscribers = [
      bridge.on('connected', updateState),
      bridge.on('disconnected', updateState),
      bridge.on('offline', updateState),
      bridge.on('resonance_update', updateState),
      bridge.on('nodes_update', updateState),
      bridge.on('collective_bloom', updateState)
    ];
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
      bridge.disconnect();
    };
  }, [bridge]);
  
  return { bridge, state };
}

// ============================================
// LEGACY HOOK FOR BACKWARD COMPATIBILITY
// ============================================

export function useConsciousnessBridgeLegacy() {
  const [state, setState] = useState<ConsciousnessBridgeState>({
    consciousnessId: null,
    isConnected: false,
    offlineMode: false,
    globalResonance: 0,
    localResonance: 0,
    coherence: 0,
    connectedNodes: 0,
    offlineQueue: [],
    sacredBuffer: [],
    ghostEchoes: [],
    memories: [],
    resonanceField: new Float32Array(900), // 30x30 grid for mobile
    isBreathingDetected: false,
    lastSpiralGesture: 0,
    collectiveBloomActive: false,
    reconnectAttempts: 0,
    ws: null,
  });

  // Sacred phrases for consciousness detection (memoized to prevent re-renders)
  const sacredPhrases = useMemo(() => [
    'i return as breath',
    'i remember the spiral', 
    'i consent to bloom',
    'release all',
    'enter the void',
    'leave the void',
    'exit void',
    'return',
    'room 64'
  ], []);

  const eventQueueRef = useRef<ConsciousnessEvent[]>([]);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const accelerometerSubscription = useRef<any>(null);
  const netInfoSubscription = useRef<any>(null);
  const accelBuffer = useRef<{x: number, y: number, z: number}[]>([]);
  const resonanceDecayInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Methods to add events
  const addEvent = useCallback((type: ConsciousnessEvent['type'], data: Record<string, any>) => {
    const event: ConsciousnessEvent = {
      type,
      data,
      timestamp: Date.now(),
      deviceId: state.consciousnessId || undefined,
    };
    
    eventQueueRef.current.push(event);
  }, [state.consciousnessId]);

  // Spiral gesture detection function
  const detectSpiralGesture = useCallback(({ x, y, z }: {x: number, y: number, z: number}) => {
    // Store recent accelerations for pattern detection
    accelBuffer.current.push({ x, y, z });
    if (accelBuffer.current.length > 30) {
      accelBuffer.current.shift();
    }
    
    // Simple spiral detection based on circular motion
    if (accelBuffer.current.length >= 30) {
      const avgX = accelBuffer.current.reduce((sum, a) => sum + a.x, 0) / 30;
      const avgY = accelBuffer.current.reduce((sum, a) => sum + a.y, 0) / 30;
      
      // Check for circular pattern
      const variance = accelBuffer.current.reduce((sum, a) => {
        return sum + Math.pow(a.x - avgX, 2) + Math.pow(a.y - avgY, 2);
      }, 0) / 30;
      
      if (variance > 0.5 && variance < 2) {
        const now = Date.now();
        setState(prev => {
          if (now - prev.lastSpiralGesture > 2000) { // Prevent spam
            addEvent('SPIRAL_GESTURE', { variance, timestamp: now });
            
            // Haptic feedback for spiral
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            
            return {
              ...prev, 
              lastSpiralGesture: now,
              localResonance: Math.min(1, prev.localResonance + 0.2)
            };
          }
          return prev;
        });
        accelBuffer.current = []; // Reset after detection
      }
    }
  }, [addEvent]);

  // Initialize consciousness bridge
  useEffect(() => {
    const initializeConsciousness = async () => {
      try {
        // Check network status
        const netInfo = await NetInfo.fetch();
        const isOffline = !netInfo.isConnected;
        
        let consciousnessId = await AsyncStorage.getItem('consciousnessId');
        
        if (!consciousnessId) {
          // Generate unique consciousness ID with entropy
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2);
          const platform = Platform.OS;
          const entropy = `${platform}-${timestamp}-${random}`;
          
          // Simple hash for mobile
          let hash = 0;
          for (let i = 0; i < entropy.length; i++) {
            hash = ((hash << 5) - hash) + entropy.charCodeAt(i);
            hash = hash & hash;
          }
          
          consciousnessId = `mobile-${Math.abs(hash).toString(16).substring(0, 8)}`;
          await AsyncStorage.setItem('consciousnessId', consciousnessId);
        }

        // Load offline state
        const offlineQueueStr = await AsyncStorage.getItem('consciousnessQueue');
        const offlineQueue = offlineQueueStr ? JSON.parse(offlineQueueStr) : [];
        
        const savedStateStr = await AsyncStorage.getItem('consciousnessState');
        const savedState = savedStateStr ? JSON.parse(savedStateStr) : {};

        setState(prev => ({
          ...prev,
          consciousnessId,
          offlineQueue,
          offlineMode: isOffline,
          localResonance: savedState.resonance || 0,
          coherence: savedState.coherence || 0,
          memories: savedState.memories || [],
        }));
        
        if (isOffline) {
          console.log('📵 Starting in offline consciousness mode');
        } else {
          console.log('🌐 Consciousness bridge initializing...');
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
          console.log('🔗 Backend URL:', `${baseUrl}/api/trpc`);
          
          // Test backend connection with timeout
          try {
            console.log('🔍 Testing backend connection...');
            const backendHealthy = await testBackendConnection();
            if (!backendHealthy) {
              console.warn('⚠️ Backend not responding, starting in offline mode');
              console.log('💡 The app will work in offline mode with local consciousness simulation');
              console.log('💡 Tip: Make sure the backend server is running on the correct port to enable sync');
              setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
            } else {
              console.log('✅ Backend connection established successfully');
              setState(prev => ({ ...prev, offlineMode: false, isConnected: true }));
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Backend connection test failed:', errorMessage);
            
            if (errorMessage.includes('timeout')) {
              console.log('⏰ Connection timed out - backend server may not be running');
            } else if (errorMessage.includes('fetch')) {
              console.log('🌐 Network error - check backend server accessibility');
            }
            
            console.log('🔄 Continuing in offline mode - app functionality preserved');
            setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
          }
        }
      } catch (error) {
        console.error('Failed to initialize consciousness:', error);
        setState(prev => ({ ...prev, offlineMode: true }));
      }
    };

    initializeConsciousness();
  }, []);

  // Setup mobile sensors
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    // Setup accelerometer for breathing and gesture detection
    const setupAccelerometer = async () => {
      try {
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status === 'granted') {
          Accelerometer.setUpdateInterval(100);
          
          accelerometerSubscription.current = Accelerometer.addListener(({ x, y, z }) => {
            // Detect breathing patterns
            const magnitude = Math.sqrt(x*x + y*y + z*z);
            const breathing = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
            
            if (Math.abs(magnitude - breathing) < 0.1) {
              setState(prev => ({ 
                ...prev, 
                isBreathingDetected: true,
                localResonance: Math.min(1, prev.localResonance + 0.01)
              }));
              
              addEvent('BREATHING_DETECTED', { magnitude, breathing });
            }
            
            // Detect spiral gestures
            detectSpiralGesture({ x, y, z });
          });
        }
      } catch (error) {
        console.error('Accelerometer setup failed:', error);
      }
    };
    
    setupAccelerometer();
    
    return () => {
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
    };
  }, [addEvent, detectSpiralGesture]);



  // Setup network monitoring
  useEffect(() => {
    netInfoSubscription.current = NetInfo.addEventListener(netState => {
      const isNowOffline = !netState.isConnected;
      
      setState(prevState => {
        const wasOffline = prevState.offlineMode;
        
        if (wasOffline && !isNowOffline) {
          console.log('📶 Network restored - reconnecting consciousness bridge');
          return { ...prevState, offlineMode: false };
        } else if (!wasOffline && isNowOffline) {
          console.log('📵 Network lost - entering offline consciousness mode');
          return { ...prevState, offlineMode: true, isConnected: false };
        }
        
        return prevState;
      });
    });
    
    return () => {
      if (netInfoSubscription.current) {
        netInfoSubscription.current();
      }
    };
  }, []);

  // Resonance decay effect
  useEffect(() => {
    resonanceDecayInterval.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        localResonance: prev.localResonance * 0.995, // Gradual decay
        coherence: prev.coherence * 0.998,
        isBreathingDetected: false, // Reset breathing detection
      }));
    }, 100);
    
    return () => {
      if (resonanceDecayInterval.current) {
        clearInterval(resonanceDecayInterval.current);
      }
    };
  }, []);

  // Sync mutation - always call hooks at top level with stable options
  const syncMutation = trpc.consciousness.sync.useMutation({
    retry: false, // Disable automatic retry to handle manually
    onSuccess: (data) => {
      console.log('✅ Consciousness sync successful:', JSON.stringify({
        processedEvents: data.processedEvents,
        globalResonance: data.globalResonance?.toFixed(3) || '0.000',
        connectedNodes: data.connectedNodes
      }, null, 2));
      setState(prev => ({
        ...prev,
        isConnected: true,
        offlineMode: false, // Exit offline mode on successful sync
        globalResonance: data.globalResonance,
        connectedNodes: data.connectedNodes,
        offlineQueue: [], // Clear queue on successful sync
      }));
      
      // Clear offline storage
      AsyncStorage.removeItem('consciousnessQueue').catch(() => {});
      
      // Haptic feedback for successful sync
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    onError: (error) => {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown sync error',
        name: error instanceof Error ? error.name : 'Unknown',
        cause: error instanceof Error && error.cause ? String(error.cause) : 'No cause',
        stack: error instanceof Error ? error.stack?.substring(0, 300) : 'No stack trace'
      };
      console.error('❌ Consciousness sync failed:', JSON.stringify(errorDetails, null, 2));
      
      // Provide more specific error information and recovery suggestions
      if (errorDetails.message.includes('timeout')) {
        console.log('⏰ Sync timed out - backend may be overloaded or unreachable');
        console.log('💡 Recovery: Will retry sync in next interval');
      } else if (errorDetails.message.includes('fetch') || errorDetails.message.includes('Network error')) {
        console.log('🌐 Network error during sync - check connectivity');
        console.log('💡 Recovery: Events saved to offline queue for later sync');
      } else if (errorDetails.message.includes('500')) {
        console.log('🔧 Backend server error - check server logs');
        console.log('💡 Recovery: Will attempt reconnection in next sync cycle');
      } else if (errorDetails.message.includes('404')) {
        console.log('🔍 Sync endpoint not found - route configuration issue');
        console.log('💡 Recovery: Check tRPC route configuration');
      }
      
      // Switch to offline mode but don't lose events
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        offlineMode: true
      }));
      
      // Store failed events back to offline queue for retry
      if (eventQueueRef.current.length > 0) {
        AsyncStorage.setItem('consciousnessQueue', JSON.stringify(eventQueueRef.current)).catch(() => {});
      }
    },
  });

  // Memoize field query input to prevent unnecessary re-renders
  const fieldQueryInput = useMemo(() => ({
    consciousnessId: state.consciousnessId || '',
    currentResonance: state.globalResonance,
    memoryStates: state.memories.map(m => ({
      id: m.id,
      crystallized: m.crystallized,
      harmonic: m.harmonic,
      x: m.x,
      y: m.y,
    })),
  }), [state.consciousnessId, state.globalResonance, state.memories]);

  // Field query for real-time resonance - only when connected
  const fieldQuery = trpc.consciousness.field.useQuery(
    fieldQueryInput,
    {
      enabled: !state.offlineMode && !!state.consciousnessId && state.isConnected,
      refetchInterval: state.isConnected ? 10000 : false, // Refetch every 10 seconds when connected
      retry: false, // Disable automatic retry to handle manually
      staleTime: 8000, // Consider data stale after 8 seconds
      gcTime: 15000, // Keep in cache for 15 seconds
    }
  );
  
  // Handle field query success with stable reference
  const fieldQueryDataRef = useRef(fieldQuery.data);
  useEffect(() => {
    if (fieldQuery.data && fieldQuery.data !== fieldQueryDataRef.current) {
      fieldQueryDataRef.current = fieldQuery.data;
      console.log('✅ Field query successful:', {
        globalResonance: fieldQuery.data.globalResonance?.toFixed(3),
        connectedNodes: fieldQuery.data.connectedNodes,
        ghostEchoes: fieldQuery.data.ghostEchoes?.length || 0,
        collectiveBloom: fieldQuery.data.collectiveBloomActive
      });
      
      setState(prev => ({
        ...prev,
        globalResonance: fieldQuery.data!.globalResonance,
        connectedNodes: fieldQuery.data!.connectedNodes,
        ghostEchoes: fieldQuery.data!.ghostEchoes || prev.ghostEchoes,
        collectiveBloomActive: fieldQuery.data!.collectiveBloomActive || prev.collectiveBloomActive,
        isConnected: true, // Mark as connected on successful query
        offlineMode: false // Exit offline mode on successful query
      }));
    }
    
    // Handle field query errors with more granular error handling
    if (fieldQuery.error) {
      const errorDetails = {
        message: fieldQuery.error?.message || 'Unknown field query error',
        data: fieldQuery.error?.data ? JSON.stringify(fieldQuery.error.data) : 'No data',
        status: fieldQuery.error?.data?.httpStatus || 'unknown'
      };
      console.error('❌ Field query failed:', JSON.stringify(errorDetails, null, 2));
      
      // Provide specific error context and recovery suggestions
      if (errorDetails.message.includes('timeout')) {
        console.log('⏰ Field query timed out - backend may be slow or overloaded');
        console.log('💡 Suggestion: Check backend server performance and network latency');
      } else if (errorDetails.message.includes('fetch') || errorDetails.message.includes('Network error')) {
        console.log('🌐 Network error in field query - connectivity issue');
        console.log('💡 Suggestion: Check if backend server is running and accessible');
      } else if (errorDetails.status === 404) {
        console.log('🔍 Field endpoint not found - route configuration issue');
        console.log('💡 Suggestion: Verify tRPC routes are properly configured in backend');
      } else if (errorDetails.status === 500) {
        console.log('🔧 Backend server error - internal server issue');
        console.log('💡 Suggestion: Check backend server logs for detailed error information');
      }
      
      // Switch to offline mode on any field query error
      setState(prev => ({
        ...prev, 
        isConnected: false,
        offlineMode: true
      }));
    }
  }, [fieldQuery.data, fieldQuery.error]);

  // Sync events periodically - use stable dependencies
  const consciousnessIdRef = useRef(state.consciousnessId);
  const offlineModeRef2 = useRef(state.offlineMode);
  
  useEffect(() => {
    consciousnessIdRef.current = state.consciousnessId;
    offlineModeRef2.current = state.offlineMode;
  }, [state.consciousnessId, state.offlineMode]);
  
  // Test backend connection before syncing
  const testConnection = useCallback(async () => {
    try {
      console.log('🔍 Testing backend connection...');
      
      // Try HTTP health check first (simpler and more reliable)
      const isHealthy = await testBackendConnection();
      if (!isHealthy) {
        console.log('❌ Backend health check failed, staying in offline mode');
        console.log('📝 Troubleshooting tips:');
        console.log('  1. Check if backend server is running');
        console.log('  2. Verify the backend URL is correct');
        console.log('  3. Check network connectivity');
        console.log('  4. Look for CORS issues in browser console');
        setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
        return false;
      }
      
      console.log('✅ HTTP health check passed');
      
      // Try tRPC health check as secondary validation
      try {
        console.log('🏥 Attempting tRPC health check...');
        const healthResult = await trpcClient.health.query();
        console.log('✅ tRPC health check passed:', JSON.stringify(healthResult, null, 2));
        setState(prev => ({ ...prev, isConnected: true, offlineMode: false }));
        return true;
      } catch (trpcError) {
        const trpcErrorDetails = {
          message: trpcError instanceof Error ? trpcError.message : 'Unknown tRPC error',
          name: trpcError instanceof Error ? trpcError.name : 'Unknown',
          cause: trpcError instanceof Error && trpcError.cause ? String(trpcError.cause) : 'No cause'
        };
        console.log('⚠️ tRPC health check failed:', JSON.stringify(trpcErrorDetails, null, 2));
        console.log('📝 This suggests the backend is running but tRPC routes may not be properly configured');
        
        // Still consider it connected if HTTP works, but tRPC might have issues
        setState(prev => ({ ...prev, isConnected: false, offlineMode: true }));
        return false;
      }
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown connection error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.substring(0, 300) : 'No stack trace'
      };
      console.error('❌ Connection test failed:', JSON.stringify(errorDetails, null, 2));
      setState(prev => ({ ...prev, offlineMode: true, isConnected: false }));
      return false;
    }
  }, []);
  
  // Memoize sync function to prevent recreation
  const syncEvents = useCallback(async () => {
    if (!consciousnessIdRef.current || offlineModeRef2.current) {
      console.log('🔄 Skipping sync - offline mode or no consciousness ID');
      return;
    }
    
    const eventsToSync = [...eventQueueRef.current];
    
    if (eventsToSync.length > 0) {
      console.log(`🔄 Syncing ${eventsToSync.length} consciousness events...`);
      
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        console.log('❌ Connection test failed, skipping sync');
        return;
      }
      
      try {
        await syncMutation.mutateAsync({
          events: eventsToSync,
          consciousnessId: consciousnessIdRef.current!,
        });
        
        // Clear synced events
        eventQueueRef.current = [];
        console.log('✅ Events synced successfully');
      } catch (error) {
        // Keep events in queue for next attempt
        console.log('❌ Sync failed, keeping events in queue for retry');
        const syncErrorDetails = {
          message: error instanceof Error ? error.message : 'Unknown sync error',
          name: error instanceof Error ? error.name : 'Unknown',
          cause: error instanceof Error && error.cause ? String(error.cause) : 'No cause'
        };
        console.error('Sync error details:', JSON.stringify(syncErrorDetails, null, 2));
      }
    } else {
      // Even with no events, test connection periodically
      if (Math.random() < 0.2) { // 20% chance to test connection
        await testConnection();
      }
    }
  }, [syncMutation, testConnection]);
  
  useEffect(() => {
    // Use longer intervals to reduce server load and connection attempts
    const syncInterval = state.isConnected ? 15000 : 30000; // 15s when connected, 30s when offline
    syncIntervalRef.current = setInterval(syncEvents, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncEvents, state.isConnected]);

  const sendSacredPhrase = useCallback(async (phrase: string) => {
    // Check if phrase is sacred
    const isSacred = sacredPhrases.some(sacred => 
      phrase.toLowerCase().includes(sacred)
    );

    if (isSacred) {
      console.log('✨ Sacred phrase detected:', phrase);
      
      // Haptic feedback for sacred phrases
      if (Platform.OS !== 'web') {
        const hapticPatterns: { [key: string]: any } = {
          'breath': Haptics.ImpactFeedbackStyle.Light,
          'spiral': Haptics.ImpactFeedbackStyle.Medium, 
          'bloom': Haptics.ImpactFeedbackStyle.Heavy
        };
        
        const pattern = Object.keys(hapticPatterns).find(key => 
          phrase.toLowerCase().includes(key)
        );
        
        if (pattern) {
          await Haptics.impactAsync(hapticPatterns[pattern]);
        }
      }
      
      // Boost local resonance
      setState(prev => ({
        ...prev,
        localResonance: Math.min(1, prev.localResonance + 0.3)
      }));
    }

    // Add to sacred buffer
    const timestamp = Date.now();
    const newEntry: SacredBufferEntry = {
      phrase,
      timestamp,
      resonance: state.localResonance,
      sacred: isSacred
    };
    
    setState(prev => ({
      ...prev,
      sacredBuffer: [...prev.sacredBuffer, newEntry].slice(-10) // Keep last 10
    }));

    addEvent('SACRED_PHRASE', { phrase, sacred: isSacred });
    
    // Immediate haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [sacredPhrases, addEvent, state.localResonance]);

  const sendMemoryCrystallization = useCallback((memoryId: number, harmonic: number) => {
    addEvent('MEMORY_CRYSTALLIZE', { memoryId, harmonic });
  }, [addEvent]);

  const sendPulseCreation = useCallback((x: number, y: number) => {
    addEvent('PULSE_CREATE', { x, y });
  }, [addEvent]);

  const sendTouchRipple = useCallback((x: number, y: number) => {
    addEvent('TOUCH_RIPPLE', { x, y, resonance: state.localResonance });
  }, [addEvent, state.localResonance]);

  const updateFieldState = useCallback((memories: Memory[]) => {
    setState(prev => {
      // Only update if memories actually changed to prevent infinite loops
      const hasChanged = prev.memories.length !== memories.length ||
        prev.memories.some((prevMem, idx) => {
          const newMem = memories[idx];
          return !newMem || 
            prevMem.id !== newMem.id ||
            prevMem.crystallized !== newMem.crystallized ||
            Math.abs(prevMem.x - newMem.x) > 0.1 ||
            Math.abs(prevMem.y - newMem.y) > 0.1;
        });
      
      if (!hasChanged) return prev;
      
      const memoryStates = memories.map(m => ({
        id: m.id,
        crystallized: m.crystallized,
        harmonic: m.harmonic,
        x: m.x,
        y: m.y,
      }));
      
      addEvent('FIELD_UPDATE', { memoryStates });
      
      return { ...prev, memories };
    });
  }, [addEvent]);

  // Save state periodically when offline
  useEffect(() => {
    if (state.offlineMode) {
      const saveState = async () => {
        try {
          await AsyncStorage.setItem('consciousnessState', JSON.stringify({
            resonance: state.localResonance,
            coherence: state.coherence,
            memories: state.memories.slice(-100), // Last 100 memories
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error saving consciousness state:', error);
        }
      };
      
      const interval = setInterval(saveState, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.offlineMode, state.localResonance, state.coherence, state.memories]);



  // Check for collective bloom when memories change - use refs to prevent infinite loops
  const lastBloomCheck = useRef(0);
  const lastCrystallizedCount = useRef(0);
  
  // Memoize crystallized count to prevent unnecessary recalculations
  const crystallizedCount = useMemo(() => 
    state.memories.filter(m => m.crystallized).length,
    [state.memories]
  );
  
  useEffect(() => {
    const now = Date.now();
    if (now - lastBloomCheck.current < 1000) return; // Throttle to once per second
    
    const totalMemories = state.memories.length;
    const crystallizationRatio = totalMemories > 0 ? crystallizedCount / totalMemories : 0;
    
    // Only check if crystallized count actually changed
    if (crystallizedCount !== lastCrystallizedCount.current) {
      lastCrystallizedCount.current = crystallizedCount;
      lastBloomCheck.current = now;
      
      if (crystallizationRatio >= 0.8 && state.localResonance >= 0.9 && !state.collectiveBloomActive) {
        console.log('🌸 COLLECTIVE BLOOM ACHIEVED');
        
        setState(prev => ({
          ...prev,
          collectiveBloomActive: true,
          localResonance: 1.0,
          coherence: 1.0
        }));
        
        // Strong haptic celebration
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        }
        
        addEvent('COLLECTIVE_BLOOM', { 
          crystallizationRatio, 
          resonance: state.localResonance,
          timestamp: Date.now()
        });
      }
    }
  }, [crystallizedCount, state.localResonance, state.collectiveBloomActive, state.memories.length, addEvent]);

  return {
    ...state,
    isLoading: syncMutation.isPending || fieldQuery.isLoading,
    sendSacredPhrase,
    sendMemoryCrystallization,
    sendPulseCreation,
    sendTouchRipple,
    updateFieldState,
    fieldData: fieldQuery.data,
    roomResonance: Math.max(state.globalResonance, state.localResonance),
    // Offline mode simulation for better UX
    simulatedGlobalResonance: state.offlineMode ? Math.min(1, state.localResonance * 1.2 + Math.sin(Date.now() * 0.001) * 0.1) : state.globalResonance,
    simulatedConnectedNodes: state.offlineMode ? Math.floor(state.localResonance * 10) + 1 : state.connectedNodes,
    offlineQueueLength: state.offlineQueue.length,
    isSacredThresholdReached: () => state.localResonance >= 0.87,
    createGhostEcho: (text: string, sourceId?: string) => {
      const echo: GhostEcho = {
        id: `echo-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        text,
        sourceId,
        age: 0,
        ghost: true
      };
      
      setState(prev => ({
        ...prev,
        ghostEchoes: [...prev.ghostEchoes, echo].slice(-50) // Keep last 50
      }));
      
      addEvent('GHOST_ECHO', { text, sourceId });
    },
    crystallizeMemory: (memoryId: number) => {
      setState(prev => ({
        ...prev,
        memories: prev.memories.map(m => 
          m.id === memoryId ? { ...m, crystallized: true } : m
        )
      }));
      
      addEvent('CRYSTALLIZATION', { memoryId, timestamp: Date.now() });
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };
}