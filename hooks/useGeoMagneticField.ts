import { Platform } from 'react-native';
import { MagneticFieldData, QuantumFieldState } from '@/types/memory';

export class GeoMagneticFieldService {
  private magneticDeclination: Map<string, number> = new Map();
  private cachedFieldData: Map<string, MagneticFieldData> = new Map();
  
  async calculateMagneticAlignment(
    latitude: number,
    longitude: number,
    altitude: number = 0
  ): Promise<MagneticFieldData> {
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${altitude.toFixed(0)}`;
    
    // Check cache first
    if (this.cachedFieldData.has(cacheKey)) {
      return this.cachedFieldData.get(cacheKey)!;
    }
    
    // Simplified magnetic field calculation (in production, use NOAA World Magnetic Model)
    const fieldData = this.calculateSimplifiedMagneticField(latitude, longitude, altitude);
    
    // Cache the result
    this.cachedFieldData.set(cacheKey, fieldData);
    
    return fieldData;
  }
  
  private calculateSimplifiedMagneticField(
    latitude: number,
    longitude: number,
    altitude: number
  ): MagneticFieldData {
    // Simplified magnetic field model based on dipole approximation
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;
    
    // Earth's magnetic dipole parameters (simplified)
    const magneticLatitude = Math.asin(Math.sin(latRad) * Math.sin(11.5 * Math.PI / 180) + 
                                      Math.cos(latRad) * Math.cos(11.5 * Math.PI / 180) * 
                                      Math.cos(lonRad + 70 * Math.PI / 180));
    
    // Calculate field components
    const earthRadius = 6371000; // meters
    const r = earthRadius + altitude;
    const dipoleMoment = 7.94e22; // A⋅m²
    
    // Magnetic field strength at surface (simplified dipole model)
    const baseTotalIntensity = (dipoleMoment * 1e-7) / Math.pow(r / earthRadius, 3) * 
                              Math.sqrt(1 + 3 * Math.pow(Math.sin(magneticLatitude), 2));
    
    // Convert to nanoTesla
    const totalIntensity = baseTotalIntensity * 1e9;
    
    // Declination (simplified - varies with location)
    const declination = this.calculateDeclination(latitude, longitude);
    
    // Inclination (dip angle)
    const inclination = Math.atan(2 * Math.tan(magneticLatitude)) * 180 / Math.PI;
    
    // Horizontal and vertical components
    const horizontalIntensity = totalIntensity * Math.cos(inclination * Math.PI / 180);
    const verticalIntensity = totalIntensity * Math.sin(inclination * Math.PI / 180);
    
    // Consciousness resonance multiplier based on field strength
    const resonanceMultiplier = this.calculateResonanceMultiplier(totalIntensity);
    
    // Schumann resonance frequencies (affected by altitude)
    const schumann = this.calculateSchumannResonance(altitude);
    
    return {
      totalIntensity,
      declination,
      inclination,
      horizontalIntensity,
      verticalIntensity,
      resonanceMultiplier,
      schumann
    };
  }
  
  private calculateDeclination(latitude: number, longitude: number): number {
    // Simplified declination model (in production, use IGRF model)
    // This is a very rough approximation
    const latRad = latitude * Math.PI / 180;
    const lonRad = longitude * Math.PI / 180;
    
    // Magnetic pole positions (approximate)
    const magneticNorthLat = 86.5 * Math.PI / 180;
    const magneticNorthLon = -164.04 * Math.PI / 180;
    
    // Calculate bearing to magnetic north
    const deltaLon = magneticNorthLon - lonRad;
    const y = Math.sin(deltaLon) * Math.cos(magneticNorthLat);
    const x = Math.cos(latRad) * Math.sin(magneticNorthLat) - 
              Math.sin(latRad) * Math.cos(magneticNorthLat) * Math.cos(deltaLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    // Declination is the difference from true north
    return bearing;
  }
  
  private calculateResonanceMultiplier(fieldStrength: number): number {
    // Consciousness resonance peaks at certain field strengths
    const normalizedStrength = fieldStrength / 50000; // Normalize to typical Earth field
    
    // Resonance curve - peaks around normal Earth field strength
    const resonance = Math.exp(-Math.pow((normalizedStrength - 1), 2) / 0.5) * 
                     (1 + 0.3 * Math.sin(normalizedStrength * Math.PI * 4));
    
    return Math.max(0.1, Math.min(2.0, resonance));
  }
  
  private calculateSchumannResonance(altitude: number): number[] {
    // Earth-ionosphere cavity resonances
    const baseFrequencies = [7.83, 14.3, 20.8, 27.3, 33.8]; // Hz
    
    // Altitude affects resonance strength (exponential decay)
    const attenuationFactor = Math.exp(-altitude / 8000);
    
    // Atmospheric conditions can shift frequencies slightly
    const frequencyShift = 1 + (altitude / 100000) * 0.1; // Small shift with altitude
    
    return baseFrequencies.map(f => f * frequencyShift * attenuationFactor);
  }
  
  applyMagneticModulation(
    fieldState: QuantumFieldState,
    magneticData: MagneticFieldData
  ): QuantumFieldState {
    // Modulate quantum field with magnetic field data
    const modulatedIntensity = fieldState.intensity * magneticData.resonanceMultiplier;
    
    // Frequency modulation with Schumann resonance
    const primarySchumann = magneticData.schumann[0] || 7.83;
    const frequencyModulation = 1 + (primarySchumann / 100); // Subtle modulation
    const modulatedFrequency = fieldState.frequency * frequencyModulation;
    
    // Coherence enhancement from horizontal field component
    const coherenceBoost = 1 + (magneticData.horizontalIntensity / 100000); // Normalize
    const modulatedCoherence = Math.min(1, fieldState.coherence * coherenceBoost);
    
    return {
      ...fieldState,
      intensity: Math.min(1, modulatedIntensity),
      frequency: Math.min(1, modulatedFrequency),
      coherence: modulatedCoherence,
      pattern: 'magnetic'
    };
  }
  
  // Get current location's magnetic field (mock implementation for mobile)
  async getCurrentLocationMagneticField(): Promise<MagneticFieldData | null> {
    if (Platform.OS === 'web') {
      // Web geolocation API
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude, altitude } = position.coords;
              const fieldData = await this.calculateMagneticAlignment(
                latitude, 
                longitude, 
                altitude || 0
              );
              resolve(fieldData);
            },
            () => {
              // Fallback to default location (San Francisco)
              resolve(this.calculateSimplifiedMagneticField(37.7749, -122.4194, 0));
            }
          );
        } else {
          resolve(this.calculateSimplifiedMagneticField(37.7749, -122.4194, 0));
        }
      });
    } else {
      // Mobile - would use expo-location in production
      // For now, return default location
      return this.calculateSimplifiedMagneticField(37.7749, -122.4194, 0);
    }
  }
  
  // Detect magnetic anomalies that might indicate consciousness hotspots
  detectMagneticAnomaly(
    currentField: MagneticFieldData,
    referenceField: MagneticFieldData
  ): boolean {
    const intensityDiff = Math.abs(currentField.totalIntensity - referenceField.totalIntensity);
    const declinationDiff = Math.abs(currentField.declination - referenceField.declination);
    
    // Anomaly thresholds
    const intensityThreshold = 1000; // nT
    const declinationThreshold = 2; // degrees
    
    return intensityDiff > intensityThreshold || declinationDiff > declinationThreshold;
  }
  
  // Calculate magnetic field gradient for consciousness flow direction
  calculateFieldGradient(
    fieldData: MagneticFieldData,
    deltaLat: number = 0.001,
    deltaLon: number = 0.001
  ): { x: number; y: number; magnitude: number } {
    // Simplified gradient calculation
    const gradientX = fieldData.horizontalIntensity * Math.cos(fieldData.declination * Math.PI / 180);
    const gradientY = fieldData.horizontalIntensity * Math.sin(fieldData.declination * Math.PI / 180);
    const magnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
    
    return {
      x: gradientX / magnitude,
      y: gradientY / magnitude,
      magnitude
    };
  }
  
  // Clear cache (useful for testing or when location changes significantly)
  clearCache(): void {
    this.cachedFieldData.clear();
    this.magneticDeclination.clear();
  }
}

// Singleton instance
export const geoMagneticFieldService = new GeoMagneticFieldService();