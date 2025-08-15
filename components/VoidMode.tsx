import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Moon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMemoryField } from '@/providers/MemoryFieldProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VoidMode() {
  const {
    setVoidMode,
    roomResonance,
    setRoomResonance,
    releaseAll,
    setMemories,
  } = useMemoryField();

  const [sacredInput, setSacredInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [thoughtEchoes, setThoughtEchoes] = useState<any[]>([]);
  const [voidEntryTime] = useState(Date.now());
  
  const breathAnim = useRef(new Animated.Value(0)).current;
  const voidPoolAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const sacredPhrases = [
    'i return as breath',
    'i remember the spiral',
    'i consent to bloom',
    'release all',
    'enter the void',
    'leave the void',
    'exit void',
    'return',
    'room 64'
  ];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Void pool animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(voidPoolAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(voidPoolAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSacredPhrase = () => {
    const phrase = sacredInput.toLowerCase();
    let isSacred = false;

    sacredPhrases.forEach(sacred => {
      if (phrase.includes(sacred)) {
        isSacred = true;
        setRoomResonance(Math.min(1, roomResonance + 0.3));
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (sacred === 'release all') {
          releaseAll();
        } else if (sacred === 'leave the void' || sacred === 'exit void' || sacred === 'return') {
          exitVoid();
        } else if (sacred === 'i return as breath' || sacred === 'i remember the spiral' || sacred === 'i consent to bloom') {
          // Crystallize random memories
          setMemories(prev => {
            const uncr = prev.filter(m => !m.crystallized);
            const toCrystallize = uncr.slice(0, Math.min(7, uncr.length));
            return prev.map(m => {
              if (toCrystallize.includes(m)) {
                return { ...m, crystallized: true, crystallizationTime: Date.now() };
              }
              return m;
            });
          });
        }
      }
    });

    // Create thought echo
    const echo = {
      id: Date.now(),
      text: sacredInput,
      age: 0,
      sacred: isSacred,
    };
    setThoughtEchoes(prev => [...prev, echo]);

    setSacredInput('');
    setShowInput(false);

    if (!isSacred) {
      setRoomResonance(Math.min(1, roomResonance + 0.05));
    }
  };

  const exitVoid = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setVoidMode(false);
    });
  };

  // Update thought echoes
  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtEchoes(prev => prev
        .map(echo => ({ ...echo, age: echo.age + 1 }))
        .filter(echo => echo.age < 100)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const isBreathingIn = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Void gradient overlay */}
      <LinearGradient
        colors={['rgba(147, 112, 219, 0.3)', 'rgba(138, 43, 226, 0.5)', 'rgba(147, 112, 219, 0.3)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Exit button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={exitVoid}
      >
        <ArrowLeft size={20} color="#c084fc" />
        <Text style={styles.exitText}>Return</Text>
      </TouchableOpacity>

      {/* Room 64 indicator */}
      <View style={styles.roomIndicator}>
        <Text style={styles.roomText}>ROOM 64 | VOID MODE</Text>
      </View>

      {/* Breathing indicator */}
      <Animated.View
        style={[
          styles.breathingIndicator,
          {
            opacity: breathAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 1, 0.6],
            }),
          },
        ]}
      >
        <Text style={styles.breathingText}>
          {isBreathingIn ? 'INHALING' : 'EXHALING'}
        </Text>
      </Animated.View>

      {/* Void pool */}
      <Animated.View
        style={[
          styles.voidPool,
          {
            transform: [
              {
                scale: voidPoolAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
            opacity: 0.3 + roomResonance * 0.4,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(147, 112, 219, 0.8)', 'rgba(138, 43, 226, 0.4)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Sacred input */}
      {showInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.sacredInput}
            value={sacredInput}
            onChangeText={setSacredInput}
            onSubmitEditing={handleSacredPhrase}
            onBlur={() => !sacredInput && setShowInput(false)}
            placeholder="speak into the void..."
            placeholderTextColor="rgba(196, 132, 252, 0.4)"
            autoFocus
            returnKeyType="send"
          />
        </KeyboardAvoidingView>
      )}

      {/* Thought echoes */}
      {thoughtEchoes.map(echo => (
        <Animated.Text
          key={echo.id}
          style={[
            styles.thoughtEcho,
            {
              opacity: 1 - echo.age / 100,
              transform: [
                { scale: 1 + echo.age * 0.02 },
              ],
              color: echo.sacred ? '#c8a2ff' : '#9370db',
            },
          ]}
        >
          {echo.text}
        </Animated.Text>
      ))}

      {/* Instructions */}
      <TouchableOpacity
        style={styles.instructions}
        onPress={() => setShowInput(true)}
      >
        <Text style={styles.instructionText}>TAP TO SPEAK</Text>
        <Text style={styles.instructionSubtext}>sacred phrases awaken the field</Text>
      </TouchableOpacity>

      {/* Resonance display */}
      <View style={styles.resonanceDisplay}>
        <Text style={styles.resonanceText}>
          Resonance: {roomResonance.toFixed(3)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  exitButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(196, 132, 252, 0.3)',
    zIndex: 100,
  },
  exitText: {
    color: '#c084fc',
    fontSize: 14,
    fontWeight: '600',
  },
  roomIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 100,
  },
  roomText: {
    color: 'rgba(196, 132, 252, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  breathingIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 100,
  },
  breathingText: {
    color: 'rgba(196, 132, 252, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  voidPool: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    alignSelf: 'center',
    top: SCREEN_HEIGHT / 2 - 150,
  },
  inputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  sacredInput: {
    width: '80%',
    maxWidth: 400,
    padding: 16,
    fontSize: 18,
    color: '#c084fc',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  thoughtEcho: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_HEIGHT / 2,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  instructionText: {
    color: 'rgba(196, 132, 252, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  instructionSubtext: {
    color: 'rgba(196, 132, 252, 0.4)',
    fontSize: 11,
    marginTop: 4,
  },
  resonanceDisplay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  resonanceText: {
    color: 'rgba(196, 132, 252, 0.5)',
    fontSize: 11,
  },
});