import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { telHref, smsHrefFromTextString, safeHttpUrl } from '../../lib/safeLinks';

export interface Resource {
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

const ACTION_LINK_BASE =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]';

const PHONE_ICON = (
  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const LINK_ICON = (
  <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

function ResourcePhoneLink({ phone }: { phone: string }) {
  const isText = phone.startsWith('Text ');
  const href = isText ? smsHrefFromTextString(phone) : telHref(phone);
  if (!href) return null;
  return (
    <a
      href={href}
      className={`${ACTION_LINK_BASE} bg-primary-600 text-white hover:bg-primary-700`}
    >
      {PHONE_ICON}
      {isText ? 'Text' : 'Call'}
    </a>
  );
}

function ResourceUrlLink({ url }: { url: string }) {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className={`${ACTION_LINK_BASE} bg-cream-100 text-ink hover:bg-cream-200 dark:bg-charcoal-700 dark:text-ink dark:hover:bg-charcoal-600`}
    >
      {LINK_ICON}
      Visit Website
    </a>
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{resource.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {resource.type}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{resource.description}</p>
      {resource.available && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Available: {resource.available}</p>
      )}
      {resource.languages && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
          Languages: {resource.languages.join(', ')}
        </p>
      )}
      {resource.note && (
        <p className="text-xs italic text-gray-500 dark:text-gray-500 mb-2">{resource.note}</p>
      )}
      <div className="flex gap-2 mt-3">
        {resource.phone && <ResourcePhoneLink phone={resource.phone} />}
        {resource.url && <ResourceUrlLink url={resource.url} />}
      </div>
    </div>
  );
}

export interface CopingStrategy {
  id: string;
  name: string;
  description: string;
  techniques?: string[];
  difficulty?: string;
}

export function CopingStrategyCard({ strategy }: { strategy: CopingStrategy }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{strategy.name}</h3>
        <Badge variant={strategy.difficulty === 'easy' ? 'success' : 'secondary'} className="text-xs">
          {strategy.difficulty}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{strategy.description}</p>
      {strategy.techniques && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Techniques:</p>
          <ul className="list-disc list-inside space-y-1">
            {strategy.techniques.map((technique, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {technique}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
