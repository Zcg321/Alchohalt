/**
 * Voice Recognition Service
 * 
 * Provides wrappers for speech recognition to enable voice-activated drink logging.
 * This is a mock implementation that can be replaced with actual plugin calls
 * when @capacitor-community/speech-recognition plugin is installed.
 */

import { FEATURE_FLAGS } from '../config/features';

interface SpeechRecognitionPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  startListening(options: { language: string; maxResults: number }): Promise<{ matches: string[] }>;
  stopListening(): Promise<void>;
  isAvailable(): Promise<{ available: boolean }>;
}

// Mock plugin instance (would be replaced with actual import)
let mockSpeechRecognition: SpeechRecognitionPlugin | null = null;

/**
 * Request microphone permissions
 */
export async function requestVoicePermission(): Promise<boolean> {
  if (!FEATURE_FLAGS.ENABLE_VOICE_LOGGING) {
    console.log('Voice logging is disabled');
    return false;
  }

  try {
    if (mockSpeechRecognition) {
      const result = await mockSpeechRecognition.requestPermission();
      return result.granted;
    }
    
    // Mock success for web/development
    console.log('Mock: Voice permission requested');
    return true;
  } catch (error) {
    console.error('Failed to request voice permission:', error);
    return false;
  }
}

/**
 * Check if voice recognition is available
 */
export async function isVoiceRecognitionAvailable(): Promise<boolean> {
  if (!FEATURE_FLAGS.ENABLE_VOICE_LOGGING) {
    return false;
  }

  try {
    if (mockSpeechRecognition) {
      const result = await mockSpeechRecognition.isAvailable();
      return result.available;
    }
    
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return true;
    }
  } catch (error) {
    console.error('Error checking voice recognition availability:', error);
  }

  return false;
}

/**
 * Start listening for voice input
 */
export async function startVoiceRecognition(language: string = 'en-US'): Promise<string[]> {
  if (!FEATURE_FLAGS.ENABLE_VOICE_LOGGING) {
    throw new Error('Voice logging is disabled');
  }

  try {
    if (mockSpeechRecognition) {
      const result = await mockSpeechRecognition.startListening({
        language,
        maxResults: 5
      });
      return result.matches;
    }
    
    // Mock results for development/testing
    const mockPhrases = [
      'two beers',
      'one glass of wine',
      'a shot of whiskey',
      'three bottles of beer'
    ];
    return [mockPhrases[Math.floor(Math.random() * mockPhrases.length)]];
  } catch (error) {
    console.error('Failed to start voice recognition:', error);
    throw error;
  }
}

/**
 * Stop listening for voice input
 */
export async function stopVoiceRecognition(): Promise<void> {
  if (!FEATURE_FLAGS.ENABLE_VOICE_LOGGING) {
    return;
  }

  try {
    if (mockSpeechRecognition) {
      await mockSpeechRecognition.stopListening();
    }
  } catch (error) {
    console.error('Failed to stop voice recognition:', error);
  }
}

export interface ParsedDrinkInput {
  quantity?: number;
  drinkType?: 'beer' | 'wine' | 'spirits' | 'custom';
  volumeMl?: number;
  abvPct?: number;
  confidence: number; // 0-1
  originalText: string;
}

/**
 * Parse voice transcript to extract drink information
 */
export function parseVoiceInput(transcript: string): ParsedDrinkInput {
  const text = transcript.toLowerCase().trim();
  const result: ParsedDrinkInput = {
    originalText: transcript,
    confidence: 0.5
  };

  // Extract quantity
  const quantityPatterns = [
    /(\d+)\s+(beer|beers|bottle|bottles)/i,
    /(\d+)\s+(glass|glasses)\s+of\s+(wine|red wine|white wine)/i,
    /(\d+)\s+(shot|shots)/i,
    /(one|two|three|four|five|six|seven|eight|nine|ten)\s+(beer|beers|wine|shot|shots)/i,
    /^(a|an)\s+(beer|glass of wine|shot)/i
  ];

  const numberWords: { [key: string]: number } = {
    'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };

  let foundQuantity = false;
  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      foundQuantity = true;
      const qty = match[1];
      if (qty in numberWords) {
        result.quantity = numberWords[qty];
      } else if (!isNaN(parseInt(qty))) {
        result.quantity = parseInt(qty);
      } else {
        result.quantity = 1;
      }
      break;
    }
  }

  if (!foundQuantity) {
    result.quantity = 1; // Default to 1
  }

  // Extract drink type
  if (text.includes('beer') || text.includes('lager') || text.includes('ale')) {
    result.drinkType = 'beer';
    result.volumeMl = 355; // Standard 12oz beer
    result.abvPct = 5.0;
    result.confidence = 0.8;
  } else if (text.includes('wine') || text.includes('red wine') || text.includes('white wine') || text.includes('glass')) {
    result.drinkType = 'wine';
    result.volumeMl = 148; // Standard 5oz wine glass
    result.abvPct = 12.0;
    result.confidence = 0.8;
  } else if (text.includes('shot') || text.includes('whiskey') || text.includes('vodka') || 
             text.includes('rum') || text.includes('tequila') || text.includes('gin')) {
    result.drinkType = 'spirits';
    result.volumeMl = 44; // Standard 1.5oz shot
    result.abvPct = 40.0;
    result.confidence = 0.8;
  } else {
    result.drinkType = 'custom';
    result.confidence = 0.3; // Low confidence for unrecognized drinks
  }

  return result;
}

/**
 * Initialize voice plugin (to be called when actual plugin is installed)
 */
export function initializeVoicePlugin(plugin?: SpeechRecognitionPlugin) {
  mockSpeechRecognition = plugin || null;
}
