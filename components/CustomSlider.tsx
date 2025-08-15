import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
} from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
  step?: number;
}

export default function CustomSlider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  minimumTrackTintColor = '#60a5fa',
  maximumTrackTintColor = 'rgba(96, 165, 250, 0.2)',
  thumbTintColor = '#3b82f6',
  style,
  step,
}: CustomSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(200);
  const isDragging = useRef(false);

  // Calculate thumb position based on value
  const getThumbPosition = useCallback(() => {
    const range = maximumValue - minimumValue;
    const normalizedValue = (value - minimumValue) / range;
    return normalizedValue * (sliderWidth - 20); // 20 is thumb width
  }, [value, minimumValue, maximumValue, sliderWidth]);

  // Convert position to value
  const positionToValue = useCallback((position: number) => {
    const range = maximumValue - minimumValue;
    const normalizedPosition = Math.max(0, Math.min(1, position / (sliderWidth - 20)));
    let newValue = minimumValue + (normalizedPosition * range);
    
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    return Math.max(minimumValue, Math.min(maximumValue, newValue));
  }, [minimumValue, maximumValue, sliderWidth, step]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        const locationX = evt.nativeEvent.locationX;
        const newValue = positionToValue(locationX - 10); // 10 is half thumb width
        onValueChange(newValue);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDragging.current) {
          const locationX = evt.nativeEvent.locationX || gestureState.moveX;
          const newValue = positionToValue(locationX - 10);
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
    })
  ).current;

  const thumbPosition = getThumbPosition();
  const trackFillWidth = thumbPosition + 10; // 10 is half thumb width

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
      {...panResponder.panHandlers}
    >
      {/* Track background */}
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />
      
      {/* Track fill */}
      <View
        style={[
          styles.trackFill,
          {
            backgroundColor: minimumTrackTintColor,
            width: trackFillWidth,
          },
        ]}
      />
      
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            left: thumbPosition,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 10,
    right: 10,
  },
  trackFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 10,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});