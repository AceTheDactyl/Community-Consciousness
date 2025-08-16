import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import LagrangianResonance from '@/components/LagrangianResonance';

export default function LagrangianScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: true,
        }} 
      />
      <LagrangianResonance />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});