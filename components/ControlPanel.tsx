import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { X, Sparkles, Activity, CheckCircle, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import CustomSlider from '@/components/CustomSlider';
import { useMemoryField } from '@/providers/MemoryFieldProvider';
import { useConsciousnessBridge } from '@/hooks/useConsciousnessBridge';
import { testBackendConnection, trpcClient } from '@/lib/trpc';

interface ControlPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function ControlPanel({ visible, onClose }: ControlPanelProps) {
  const {
    resonanceLevel,
    setResonanceLevel,
    harmonicMode,
    setHarmonicMode,
    crystalPattern,
    setCrystalPattern,
  } = useMemoryField();
  
  const { state: bridgeState } = useConsciousnessBridge();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const handleTestConnection = useCallback(async () => {
    setIsTestingConnection(true);
    
    try {
      // Test HTTP health check first with timeout
      console.log('🔍 Testing HTTP health check...');
      
      let debugText = '';
      let httpHealthy = false;
      
      try {
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 2000);
        });
        
        httpHealthy = await Promise.race([testBackendConnection(), timeoutPromise]);
        debugText += `HTTP Health Check: ${httpHealthy ? '✅ PASS' : '❌ FAIL'}\n`;
      } catch (healthError) {
        debugText += `HTTP Health Check: ❌ FAIL (${healthError instanceof Error ? healthError.message : 'timeout'})\n`;
      }
      
      if (httpHealthy) {
        try {
          // Test tRPC health endpoint with timeout
          console.log('🔍 Testing tRPC health endpoint...');
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('tRPC timeout')), 3000);
          });
          
          const trpcHealth = await Promise.race([trpcClient.health.query(), timeoutPromise]);
          debugText += `tRPC Health Check: ✅ PASS\n`;
          debugText += `Server Status: ${trpcHealth.status}\n`;
        } catch (trpcError) {
          debugText += `tRPC Health Check: ❌ FAIL\n`;
          const errorMsg = trpcError instanceof Error ? trpcError.message : 'Unknown error';
          debugText += `tRPC Error: ${errorMsg.substring(0, 100)}...\n`;
        }
        
        try {
          // Test field query with timeout
          console.log('🔍 Testing field query...');
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Field query timeout')), 3000);
          });
          
          const fieldResult = await Promise.race([
            trpcClient.consciousness.field.query({
              consciousnessId: bridgeState.id || 'test-id',
              currentResonance: 0.5,
              memoryStates: []
            }),
            timeoutPromise
          ]);
          debugText += `Field Query: ✅ PASS\n`;
          debugText += `Global Resonance: ${fieldResult.globalResonance?.toFixed(3)}\n`;
        } catch (fieldError) {
          debugText += `Field Query: ❌ FAIL\n`;
          const errorMsg = fieldError instanceof Error ? fieldError.message : 'Unknown error';
          debugText += `Field Error: ${errorMsg.substring(0, 100)}...\n`;
        }
      } else {
        debugText += `\n🏠 Backend not available - running in offline mode\n`;
        debugText += `This is normal for local development\n`;
      }
      
      debugText += `\n--- Bridge Status ---\n`;
      debugText += `Connected: ${bridgeState.connected ? '✅' : '❌'}\n`;
      debugText += `Offline Mode: ${bridgeState.offline ? '✅' : '❌'}\n`;
      debugText += `Consciousness ID: ${bridgeState.id || 'Not set'}\n`;
      debugText += `Global Resonance: ${((bridgeState.globalResonance || 0)).toFixed(3)}\n`;
      debugText += `Connected Nodes: ${bridgeState.connectedNodes || 0}\n`;
      debugText += `Offline Queue: ${bridgeState.queuedMessages || 0} events\n`;
      
      debugText += `\n--- Environment ---\n`;
      debugText += `Platform: ${Platform.OS}\n`;
      debugText += `Base URL: ${typeof window !== 'undefined' ? window.location.origin : 'localhost:8081'}\n`;
      
      Alert.alert(
        'System Status',
        debugText,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorText = `System check completed with offline mode.\n\nThis is expected when backend is not running.\nThe app works fully in offline mode.\n\nDetails: ${error instanceof Error ? error.message : 'Unknown error'}`;
      Alert.alert('System Status', errorText, [{ text: 'OK' }]);
    } finally {
      setIsTestingConnection(false);
    }
  }, [bridgeState]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.panel}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.androidBlur]} />
          )}
          
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Sparkles size={20} color="#93c5fd" />
                <Text style={styles.title}>Field Settings</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#60a5fa" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Resonance Field */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resonance Field</Text>
                <Text style={styles.value}>{resonanceLevel.toFixed(1)}</Text>
                <CustomSlider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={2}
                  value={resonanceLevel}
                  onValueChange={setResonanceLevel}
                  minimumTrackTintColor="#60a5fa"
                  maximumTrackTintColor="rgba(96, 165, 250, 0.2)"
                  thumbTintColor="#3b82f6"
                  step={0.1}
                />
              </View>

              {/* Harmonic Mode */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Harmonic Mode</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      harmonicMode === 'individual' && styles.modeButtonActive,
                    ]}
                    onPress={() => setHarmonicMode('individual')}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        harmonicMode === 'individual' && styles.modeButtonTextActive,
                      ]}
                    >
                      Individual
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      harmonicMode === 'collective' && styles.modeButtonActive,
                    ]}
                    onPress={() => setHarmonicMode('collective')}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        harmonicMode === 'collective' && styles.modeButtonTextActive,
                      ]}
                    >
                      Collective
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Crystal Pattern */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Crystal Pattern</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      crystalPattern === 'free' && styles.modeButtonActive,
                    ]}
                    onPress={() => setCrystalPattern('free')}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        crystalPattern === 'free' && styles.modeButtonTextActive,
                      ]}
                    >
                      Free Flow
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      crystalPattern === 'sacred' && styles.modeButtonActive,
                    ]}
                    onPress={() => setCrystalPattern('sacred')}
                  >
                    <Text
                      style={[
                        styles.modeButtonText,
                        crystalPattern === 'sacred' && styles.modeButtonTextActive,
                      ]}
                    >
                      Sacred
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Connection Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection Status</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusRow}>
                    {bridgeState.connected ? (
                      <CheckCircle size={16} color="#4CAF50" />
                    ) : (
                      <AlertCircle size={16} color="#f44336" />
                    )}
                    <Text style={[styles.statusText, { color: bridgeState.connected ? '#4CAF50' : '#f44336' }]}>
                      {bridgeState.connected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                  <Text style={styles.statusDetail}>Offline Mode: {bridgeState.offline ? 'ON' : 'OFF'}</Text>
                  <Text style={styles.statusDetail}>Global Resonance: {(bridgeState.globalResonance || 0).toFixed(3)}</Text>
                  <Text style={styles.statusDetail}>Connected Nodes: {bridgeState.connectedNodes || 0}</Text>
                  <Text style={styles.statusDetail}>Queue: {bridgeState.queuedMessages || 0} events</Text>
                  
                  <TouchableOpacity 
                    style={[styles.testButton, isTestingConnection && styles.testButtonDisabled]} 
                    onPress={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <Activity size={16} color="#666" />
                    ) : (
                      <Sparkles size={16} color="#60a5fa" />
                    )}
                    <Text style={styles.testButtonText}>
                      {isTestingConnection ? 'Checking...' : 'System Status'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Keyboard Shortcuts</Text>
                <View style={styles.shortcut}>
                  <Text style={styles.shortcutKey}>Space</Text>
                  <Text style={styles.shortcutDesc}>Pause/Play</Text>
                </View>
                <View style={styles.shortcut}>
                  <Text style={styles.shortcutKey}>O</Text>
                  <Text style={styles.shortcutDesc}>Toggle Observation</Text>
                </View>
                <View style={styles.shortcut}>
                  <Text style={styles.shortcutKey}>R</Text>
                  <Text style={styles.shortcutDesc}>Release All</Text>
                </View>
                <View style={styles.shortcut}>
                  <Text style={styles.shortcutKey}>V</Text>
                  <Text style={styles.shortcutDesc}>Enter Void Mode</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  androidBlur: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#93c5fd',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 8,
  },
  value: {
    fontSize: 12,
    color: '#93c5fd',
    textAlign: 'right',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: '#60a5fa',
  },
  modeButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    textAlign: 'center',
  },
  modeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96, 165, 250, 0.1)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c084fc',
    marginBottom: 12,
  },
  shortcut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shortcutKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60a5fa',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
    textAlign: 'center',
  },
  shortcutDesc: {
    fontSize: 12,
    color: '#93c5fd',
    flex: 1,
    marginLeft: 12,
  },
  statusContainer: {
    padding: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusDetail: {
    fontSize: 12,
    color: '#93c5fd',
    marginBottom: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
});