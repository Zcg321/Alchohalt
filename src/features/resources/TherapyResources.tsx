/**
 * Therapy & Support Resources
 *
 * Curated hotlines, educational links, and coping strategies, organised
 * into four categories. Phone/SMS/URL actions are rendered as proper
 * <a> anchors via the shared safeLinks sanitizers — same a11y + native-
 * integration story as the Crisis surface.
 */

import React, { useState } from 'react';
import { FEATURE_FLAGS } from '../../config/features';
import resourcesData from '../../data/therapy-resources.json';
import {
  CopingStrategyCard,
  ResourceCard,
  type CopingStrategy,
  type Resource,
} from './ResourceCard';

interface Props {
  className?: string;
  trigger?: 'stress' | 'social' | 'loneliness' | 'boredom';
}

type Category = 'immediate' | 'educational' | 'professional' | 'coping';

const CATEGORIES: ReadonlyArray<{ id: Category; label: string; icon: string }> = [
  { id: 'immediate', label: 'Immediate Help', icon: '🚨' },
  { id: 'educational', label: 'Educational', icon: '📚' },
  { id: 'professional', label: 'Find a Therapist', icon: '👨‍⚕️' },
  { id: 'coping', label: 'Coping Strategies', icon: '🛠️' },
];

function CategoryTabs({
  active,
  onSelect,
}: {
  active: Category;
  onSelect: (c: Category) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            active === cat.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span aria-hidden="true">{cat.icon}</span> {cat.label}
        </button>
      ))}
    </div>
  );
}

function TriggerSuggestion({ trigger }: { trigger: NonNullable<Props['trigger']> }) {
  const suggestion = resourcesData.triggerSpecific[trigger];
  if (!suggestion) return null;
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
        <span aria-hidden="true">💡</span> {suggestion.title}
      </h3>
      <ul className="space-y-1">
        {suggestion.tips.map((tip, idx) => (
          <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
            • {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryList({ active }: { active: Category }) {
  if (active === 'coping') {
    return (
      <>
        {(resourcesData.copingStrategies as CopingStrategy[]).map((s) => (
          <CopingStrategyCard key={s.id} strategy={s} />
        ))}
      </>
    );
  }
  const list: Resource[] =
    active === 'immediate'
      ? (resourcesData.immediateHelp as Resource[])
      : active === 'educational'
        ? (resourcesData.educational as Resource[])
        : (resourcesData.professionalHelp as Resource[]);
  return (
    <>
      {list.map((r) => (
        <ResourceCard key={r.id} resource={r} />
      ))}
    </>
  );
}

export default function TherapyResources({ className = '', trigger }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('immediate');

  if (!FEATURE_FLAGS.ENABLE_THERAPY_RESOURCES) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold mb-2">Support & Resources</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Access professional help, educational materials, and coping strategies
        </p>
      </div>

      {trigger && <TriggerSuggestion trigger={trigger} />}

      <CategoryTabs active={activeCategory} onSelect={setActiveCategory} />

      <div className="space-y-4">
        <CategoryList active={activeCategory} />
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-500 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="font-semibold mb-1">Important:</p>
        <p>
          These resources are for informational purposes only and do not constitute medical advice.
          If you&apos;re experiencing a medical emergency, call 911 immediately. For substance use
          support, contact SAMHSA&apos;s National Helpline at 1-800-662-4357.
        </p>
      </div>
    </div>
  );
}
