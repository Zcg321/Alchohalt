/**
 * Voice Input Component
 * 
 * Allows users to log drinks via voice input.
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FEATURE_FLAGS } from '../../config/features';
import { 
  startVoiceRecognition, 
  parseVoiceInput, 
  requestVoicePermission,
  isVoiceRecognitionAvailable 
} from '../../lib/voice';

interface Props {
  onVoiceResult: (result: { 
    quantity: number; 
    volumeMl: number; 
    abvPct: number; 
    transcript: string;
    drinkType: 'beer' | 'wine' | 'spirits' | 'custom';
  }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function VoiceInput({ onVoiceResult, onError, className = '' }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Check if feature is enabled
  if (!FEATURE_FLAGS.ENABLE_VOICE_LOGGING) {
    return null;
  }

  const handleVoiceInput = async () => {
    try {
      // Check if voice recognition is available
      const available = await isVoiceRecognitionAvailable();
      if (!available) {
        onError?.('Voice recognition is not available on this device');
        return;
      }

      // Request permission if not already granted
      if (!permissionGranted) {
        const granted = await requestVoicePermission();
        setPermissionGranted(granted);
        if (!granted) {
          onError?.('Microphone permission denied');
          return;
        }
      }

      setIsListening(true);
      setTranscript('');

      // Start listening
      const results = await startVoiceRecognition();
      
      if (results.length === 0) {
        onError?.('No speech detected. Please try again.');
        setIsListening(false);
        return;
      }

      const bestMatch = results[0];
      setTranscript(bestMatch);

      // Parse the voice input
      const parsed = parseVoiceInput(bestMatch);
      
      if (parsed.confidence < 0.5) {
        onError?.('Could not understand input. Please try again or enter manually.');
        setIsListening(false);
        return;
      }

      // Call the result handler with parsed data
      onVoiceResult({
        quantity: parsed.quantity || 1,
        volumeMl: parsed.volumeMl || 355,
        abvPct: parsed.abvPct || 5.0,
        transcript: parsed.originalText,
        drinkType: parsed.drinkType || 'custom'
      });

      setIsListening(false);
    } catch (error) {
      console.error('Voice input error:', error);
      onError?.('Voice recognition failed. Please try again.');
      setIsListening(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleVoiceInput}
        disabled={isListening}
        className="w-full"
        leftIcon={
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        }
      >
        {isListening ? 'Listening...' : 'Log via Voice'}
      </Button>
      
      {transcript && (
        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Heard: &quot;{transcript}&quot;
        </div>
      )}
    </div>
  );
}
