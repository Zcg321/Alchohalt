/**
 * Therapy & Support Resources Component
 * 
 * Displays curated therapy resources, hotlines, and coping strategies.
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FEATURE_FLAGS } from '../../config/features';
import resourcesData from '../../data/therapy-resources.json';

interface Resource {
  id: string;
  name: string;
  description: string;
  phone?: string;
  url?: string;
  type: string;
  available?: string;
  languages?: string[];
  note?: string;
}

interface Props {
  className?: string;
  trigger?: 'stress' | 'social' | 'loneliness' | 'boredom';
}

export default function TherapyResources({ className = '', trigger }: Props) {
  const [activeCategory, setActiveCategory] = useState<'immediate' | 'educational' | 'professional' | 'coping'>('immediate');

  if (!FEATURE_FLAGS.ENABLE_THERAPY_RESOURCES) {
    return null;
  }

  const categories = [
    { id: 'immediate', label: 'Immediate Help', icon: '🚨' },
    { id: 'educational', label: 'Educational', icon: '📚' },
    { id: 'professional', label: 'Find a Therapist', icon: '👨‍⚕️' },
    { id: 'coping', label: 'Coping Strategies', icon: '🛠️' }
  ];

  const handleCall = (phone: string) => {
    // Sanitize phone input to prevent injection attacks
    const sanitizedPhone = phone.trim();
    
    if (sanitizedPhone.startsWith('Text ')) {
      // SMS link - extract and validate components
      const parts = sanitizedPhone.replace('Text ', '').split(' to ');
      if (parts.length === 2) {
        const smsMessage = parts[0].trim();
        const smsNumber = parts[1].trim().replace(/[^0-9]/g, '');
        
        // Only proceed if we have a valid number
        if (smsNumber && /^\d+$/.test(smsNumber)) {
          // Create and click a temporary link (safer than direct window.location assignment)
          const link = document.createElement('a');
          link.href = `sms:${smsNumber}?body=${encodeURIComponent(smsMessage)}`;
          link.click();
        }
      }
    } else {
      // Regular phone call - extract only digits
      const phoneNumber = sanitizedPhone.replace(/[^0-9]/g, '');
      
      // Validate phone number (must be 10-15 digits)
      if (phoneNumber && /^\d{10,15}$/.test(phoneNumber)) {
        // Create and click a temporary link (safer than direct window.location assignment)
        const link = document.createElement('a');
        link.href = `tel:${phoneNumber}`;
        link.click();
      }
    }
  };

  const handleOpenUrl = (url: string) => {
    // Validate URL before opening to prevent javascript: or data: URIs
    try {
      const urlObj = new URL(url);
      // Only allow http: and https: protocols
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Invalid URL:', url);
    }
  };

  const renderResource = (resource: Resource) => (
    <div key={resource.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{resource.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {resource.type}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {resource.description}
      </p>
      
      {resource.available && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
          Available: {resource.available}
        </p>
      )}
      
      {resource.languages && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
          Languages: {resource.languages.join(', ')}
        </p>
      )}
      
      {resource.note && (
        <p className="text-xs italic text-gray-500 dark:text-gray-500 mb-2">
          {resource.note}
        </p>
      )}
      
      <div className="flex gap-2 mt-3">
        {resource.phone && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCall(resource.phone!)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          >
            {resource.phone.startsWith('Text ') ? 'Text' : 'Call'}
          </Button>
        )}
        
        {resource.url && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenUrl(resource.url!)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            }
          >
            Visit Website
          </Button>
        )}
      </div>
    </div>
  );

  const renderCopingStrategy = (strategy: any) => (
    <div key={strategy.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{strategy.name}</h3>
        <Badge variant={strategy.difficulty === 'easy' ? 'success' : 'secondary'} className="text-xs">
          {strategy.difficulty}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {strategy.description}
      </p>
      
      {strategy.techniques && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Techniques:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {strategy.techniques.map((technique: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {technique}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Show trigger-specific suggestions if a trigger is provided
  const triggerSuggestion = trigger && resourcesData.triggerSpecific[trigger];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Support & Resources</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Access professional help, educational materials, and coping strategies
        </p>
      </div>

      {/* Trigger-specific suggestion */}
      {triggerSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 {triggerSuggestion.title}
          </h3>
          <ul className="space-y-1">
            {triggerSuggestion.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Resources list */}
      <div className="space-y-4">
        {activeCategory === 'immediate' && resourcesData.immediateHelp.map(renderResource)}
        {activeCategory === 'educational' && resourcesData.educational.map(renderResource)}
        {activeCategory === 'professional' && resourcesData.professionalHelp.map(renderResource)}
        {activeCategory === 'coping' && resourcesData.copingStrategies.map(renderCopingStrategy)}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 dark:text-gray-500 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="font-semibold mb-1">Important:</p>
        <p>
          These resources are for informational purposes only and do not constitute medical advice. 
          If you&apos;re experiencing a medical emergency, call 911 immediately. 
          For substance use support, contact SAMHSA&apos;s National Helpline at 1-800-662-4357.
        </p>
      </div>
    </div>
  );
}
