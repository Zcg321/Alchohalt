/**
 * Journal Entry Component
 * 
 * Displays or allows editing of a journal entry with mood tagging.
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'stressed', label: 'Stressed', emoji: '😤' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' }
] as const;

interface Props {
  initialJournal?: string;
  initialMood?: typeof MOOD_OPTIONS[number]['value'];
  onSave: (journal: string, mood: typeof MOOD_OPTIONS[number]['value']) => void;
  onCancel?: () => void;
  className?: string;
}

export default function JournalEntry({ 
  initialJournal = '', 
  initialMood = 'neutral', 
  onSave, 
  onCancel,
  className = '' 
}: Props) {
  const [journal, setJournal] = useState(initialJournal);
  const [mood, setMood] = useState<typeof MOOD_OPTIONS[number]['value']>(initialMood);

  const handleSave = () => {
    if (journal.trim()) {
      onSave(journal.trim(), mood);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mood selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How are you feeling?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMood(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                mood === option.value
                  ? 'bg-primary-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Journal text area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Journal Entry
        </label>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Write about your thoughts, feelings, or experiences..."
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {journal.length} characters
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!journal.trim()}
        >
          Save Entry
        </Button>
      </div>
    </div>
  );
}

interface JournalDisplayProps {
  journal: string;
  mood: typeof MOOD_OPTIONS[number]['value'];
  timestamp: number;
  onEdit?: () => void;
  className?: string;
}

export function JournalDisplay({ journal, mood, timestamp, onEdit, className = '' }: JournalDisplayProps) {
  const moodOption = MOOD_OPTIONS.find(m => m.value === mood) || MOOD_OPTIONS[6];
  const date = new Date(timestamp);

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{moodOption.emoji}</span>
          <div>
            <Badge variant="secondary" className="text-xs">
              {moodOption.label}
            </Badge>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {journal}
      </p>
    </div>
  );
}
