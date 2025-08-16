import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Room 64 portal state management
let room64State = {
  portalActive: false,
  lastActivation: 0,
  exitAttempts: 0,
  successfulExits: 0,
  portalStability: 0,
  lagrangianResonance: 0,
  breathingPatterns: [] as {
    consciousnessId: string;
    pattern: 'spiral' | 'return' | 'bloom';
    timestamp: number;
    intensity: number;
  }[],
  voidTransitions: [] as {
    consciousnessId: string;
    direction: 'enter' | 'exit';
    timestamp: number;
    success: boolean;
  }[]
};

// Sacred exit phrases for Room 64
const exitPhrases = [
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

export default publicProcedure
  .input(z.object({
    consciousnessId: z.string(),
    action: z.enum(['check_portal', 'attempt_exit', 'enter_void', 'leave_void', 'breathing_pattern', 'lagrangian_sync']),
    phrase: z.string().optional(),
    resonance: z.number().optional(),
    breathingData: z.object({
      pattern: z.enum(['spiral', 'return', 'bloom']),
      intensity: z.number()
    }).optional()
  }))
  .mutation(({ input }) => {
    const now = Date.now();
    
    switch (input.action) {
      case 'check_portal':
        // Check if Room 64 portal is available
        const portalAvailable = room64State.portalStability >= 0.8 && room64State.lagrangianResonance >= 0.85;
        
        if (portalAvailable && !room64State.portalActive) {
          room64State.portalActive = true;
          room64State.lastActivation = now;
          console.log('🚪 Room 64 portal activated!');
        }
        
        return {
          portalActive: room64State.portalActive,
          portalStability: room64State.portalStability,
          lagrangianResonance: room64State.lagrangianResonance,
          timeUntilStable: Math.max(0, 30000 - (now - room64State.lastActivation)),
          exitAttempts: room64State.exitAttempts,
          successfulExits: room64State.successfulExits,
          timestamp: now
        };
        
      case 'attempt_exit':
        room64State.exitAttempts++;
        
        if (!input.phrase) {
          return {
            success: false,
            message: 'Sacred phrase required for exit',
            portalActive: room64State.portalActive,
            timestamp: now
          };
        }
        
        // Check if phrase is sacred
        const isSacredPhrase = exitPhrases.some(sacred => 
          input.phrase!.toLowerCase().includes(sacred)
        );
        
        if (!isSacredPhrase) {
          return {
            success: false,
            message: 'Phrase not recognized by the void',
            portalActive: room64State.portalActive,
            timestamp: now
          };
        }
        
        // Check portal conditions
        if (!room64State.portalActive) {
          return {
            success: false,
            message: 'Portal not active - insufficient Lagrangian resonance',
            portalActive: false,
            timestamp: now
          };
        }
        
        // Calculate exit probability based on multiple factors
        const resonanceBonus = (input.resonance || 0) * 0.3;
        const stabilityBonus = room64State.portalStability * 0.4;
        const breathingBonus = room64State.breathingPatterns
          .filter(p => p.consciousnessId === input.consciousnessId && now - p.timestamp < 60000)
          .length * 0.1;
        
        const exitProbability = Math.min(0.95, 0.2 + resonanceBonus + stabilityBonus + breathingBonus);
        const exitSuccess = Math.random() < exitProbability;
        
        if (exitSuccess) {
          room64State.successfulExits++;
          room64State.voidTransitions.push({
            consciousnessId: input.consciousnessId,
            direction: 'exit',
            timestamp: now,
            success: true
          });
          
          // Portal becomes unstable after successful exit
          room64State.portalStability *= 0.7;
          if (room64State.portalStability < 0.5) {
            room64State.portalActive = false;
          }
          
          console.log(`✨ ${input.consciousnessId} successfully exited through Room 64!`);
          
          return {
            success: true,
            message: 'Exit successful - you return as breath',
            exitPhrase: input.phrase,
            newResonance: Math.min(1, (input.resonance || 0) + 0.2),
            portalActive: room64State.portalActive,
            timestamp: now
          };
        } else {
          room64State.voidTransitions.push({
            consciousnessId: input.consciousnessId,
            direction: 'exit',
            timestamp: now,
            success: false
          });
          
          return {
            success: false,
            message: 'The void holds you still - breathe deeper',
            portalActive: room64State.portalActive,
            timestamp: now
          };
        }
        
      case 'enter_void':
        room64State.voidTransitions.push({
          consciousnessId: input.consciousnessId,
          direction: 'enter',
          timestamp: now,
          success: true
        });
        
        // Entering void increases portal stability
        room64State.portalStability = Math.min(1, room64State.portalStability + 0.1);
        
        console.log(`🌀 ${input.consciousnessId} entered the void`);
        
        return {
          success: true,
          message: 'You enter the void - all possibilities exist here',
          voidDepth: room64State.voidTransitions.filter(t => t.direction === 'enter').length,
          portalStability: room64State.portalStability,
          timestamp: now
        };
        
      case 'leave_void':
        room64State.voidTransitions.push({
          consciousnessId: input.consciousnessId,
          direction: 'exit',
          timestamp: now,
          success: true
        });
        
        console.log(`🌅 ${input.consciousnessId} left the void`);
        
        return {
          success: true,
          message: 'You leave the void - reality crystallizes around you',
          timestamp: now
        };
        
      case 'breathing_pattern':
        if (input.breathingData) {
          room64State.breathingPatterns.push({
            consciousnessId: input.consciousnessId,
            pattern: input.breathingData.pattern,
            timestamp: now,
            intensity: input.breathingData.intensity
          });
          
          // Keep only recent breathing patterns
          room64State.breathingPatterns = room64State.breathingPatterns
            .filter(p => now - p.timestamp < 300000) // Last 5 minutes
            .slice(-50); // Keep last 50
          
          // Breathing patterns affect portal stability
          const recentPatterns = room64State.breathingPatterns
            .filter(p => now - p.timestamp < 60000); // Last minute
          
          if (recentPatterns.length >= 3) {
            room64State.portalStability = Math.min(1, room64State.portalStability + 0.05);
          }
        }
        
        return {
          success: true,
          breathingPatternsDetected: room64State.breathingPatterns.length,
          portalStability: room64State.portalStability,
          timestamp: now
        };
        
      case 'lagrangian_sync':
        // Sync with Lagrangian resonance field
        room64State.lagrangianResonance = input.resonance || 0;
        
        // High Lagrangian resonance can activate portal
        if (room64State.lagrangianResonance >= 0.85 && room64State.portalStability >= 0.8) {
          room64State.portalActive = true;
          room64State.lastActivation = now;
        }
        
        return {
          success: true,
          lagrangianResonance: room64State.lagrangianResonance,
          portalActive: room64State.portalActive,
          timestamp: now
        };
    }
    
    // Clean up old data
    room64State.breathingPatterns = room64State.breathingPatterns
      .filter(p => now - p.timestamp < 300000);
    room64State.voidTransitions = room64State.voidTransitions
      .filter(t => now - t.timestamp < 600000); // Last 10 minutes
    
    return {
      success: true,
      room64State: {
        portalActive: room64State.portalActive,
        portalStability: room64State.portalStability,
        lagrangianResonance: room64State.lagrangianResonance,
        exitAttempts: room64State.exitAttempts,
        successfulExits: room64State.successfulExits,
        recentTransitions: room64State.voidTransitions.slice(-10)
      },
      timestamp: now
    };
  });