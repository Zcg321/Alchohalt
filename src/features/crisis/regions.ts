/**
 * Crisis-resource regions [INTL-1].
 *
 * The app launches into App Store + Play Store with English as the
 * primary locale. We default crisis numbers to US (988 / SAMHSA / CTL)
 * and surface a region-matched set on top when we can detect UK / AU /
 * CA / IE. US always remains visible as "Other regions" — never hidden
 * from a non-US user.
 *
 * No `fetch`, no analytics — this module is consumed by the always-on
 * crisis surface, which has the same privacy floor as the rest of the
 * app: hard-coded numbers + URLs only.
 */

import type { Resource } from './CrisisResources';

export type RegionCode = 'US' | 'UK' | 'AU' | 'CA' | 'IE';

export const SUPPORTED_REGIONS: ReadonlySet<RegionCode> = new Set([
  'US', 'UK', 'AU', 'CA', 'IE',
]);

interface RegionPack {
  code: RegionCode;
  label: string;
  immediate: Resource[];
  ongoing: Resource[];
}

export const US_PACK: RegionPack = {
  code: 'US',
  label: 'United States',
  immediate: [
    {
      id: 'us-988',
      name: '988 Suicide & Crisis Lifeline',
      description:
        'Free 24/7 support for anyone in suicidal crisis or emotional distress. Call or text 988.',
      phone: '988',
      available: '24/7',
    },
    {
      id: 'us-samhsa',
      name: 'SAMHSA National Helpline',
      description:
        'Free, confidential treatment-referral service for substance-use issues. Available in English and Spanish.',
      phone: '1-800-662-4357',
      available: '24/7',
    },
    {
      id: 'us-crisis-text',
      name: 'Crisis Text Line',
      description:
        'Text with a trained crisis counselor. No phone call required.',
      smsHint: { keyword: 'HOME', number: '741741' },
      available: '24/7',
    },
    /* [R12-6] Teen-specific resources. Added per the round-12
     * parent-of-teen judge walkthrough (see
     * audit-walkthrough/round-12-judge-teen-parent.md). Visible to
     * everyone — no classifier, no age gate. A teen recognizes
     * themselves in the description; an adult skips past. Same
     * posture as 988: always-on, never gated. */
    {
      id: 'us-teen-line',
      name: 'Teen Line',
      description:
        'For callers under 18. Calls answered by trained teens, supervised by counselors. Lower friction than calling an adult-staffed hotline.',
      phone: '1-800-852-8336',
      available: '6pm–10pm PT, daily',
    },
    {
      id: 'us-crisis-text-teen',
      name: 'Crisis Text Line — Teen',
      description:
        'For callers under 18. Same number as Crisis Text Line above; texting TEEN routes you to a teen-trained counselor.',
      smsHint: { keyword: 'TEEN', number: '741741' },
      available: '24/7',
    },
  ],
  ongoing: [
    {
      id: 'us-aa',
      name: 'Alcoholics Anonymous',
      description: 'Find local AA meetings near you.',
      url: 'https://www.aa.org',
      available: 'Varies by location',
    },
    {
      id: 'us-smart-recovery',
      name: 'SMART Recovery',
      description:
        'Self-empowerment, science-based recovery support. Free online meetings.',
      url: 'https://www.smartrecovery.org',
      available: 'Online + in-person',
    },
    {
      id: 'us-samhsa-locator',
      name: 'SAMHSA Treatment Locator',
      description: 'Search treatment facilities near you.',
      url: 'https://findtreatment.gov',
      available: 'Anytime',
    },
  ],
};

export const UK_PACK: RegionPack = {
  code: 'UK',
  label: 'United Kingdom',
  immediate: [
    {
      id: 'uk-samaritans',
      name: 'Samaritans',
      description: 'Free, confidential support for anyone in distress.',
      phone: '116 123',
      available: '24/7',
    },
    {
      id: 'uk-drinkline',
      name: 'Drinkline',
      description:
        'Free, confidential helpline for anyone worried about their own or someone else’s drinking.',
      phone: '0300 123 1110',
      available: 'Mon–Fri 9am–8pm, weekends 11am–4pm',
    },
    {
      id: 'uk-nhs-111',
      name: 'NHS 111',
      description:
        'Urgent (non-life-threatening) medical advice for England, Scotland, and Wales.',
      phone: '111',
      available: '24/7',
    },
  ],
  ongoing: [
    {
      id: 'uk-aa',
      name: 'Alcoholics Anonymous Great Britain',
      description: 'Find local AA meetings across the UK.',
      url: 'https://www.alcoholics-anonymous.org.uk',
      available: 'Varies by location',
    },
    {
      id: 'uk-smart-recovery',
      name: 'SMART Recovery UK',
      description: 'Free, science-based mutual-help meetings.',
      url: 'https://smartrecovery.org.uk',
      available: 'Online + in-person',
    },
  ],
};

export const AU_PACK: RegionPack = {
  code: 'AU',
  label: 'Australia',
  immediate: [
    {
      id: 'au-lifeline',
      name: 'Lifeline',
      description: 'Crisis support and suicide prevention services.',
      phone: '13 11 14',
      available: '24/7',
    },
    {
      id: 'au-directline',
      name: 'DirectLine',
      description:
        'Free, anonymous, 24/7 alcohol and other drug counselling and referral.',
      phone: '1800 250 015',
      available: '24/7',
    },
  ],
  ongoing: [
    {
      id: 'au-aa',
      name: 'Alcoholics Anonymous Australia',
      description: 'Find local AA meetings across Australia.',
      url: 'https://aa.org.au',
      available: 'Varies by location',
    },
    {
      id: 'au-counsellingonline',
      name: 'Counselling Online',
      description:
        'Free national online counselling for alcohol and other drug issues.',
      url: 'https://www.counsellingonline.org.au',
      available: '24/7',
    },
  ],
};

export const CA_PACK: RegionPack = {
  code: 'CA',
  label: 'Canada',
  immediate: [
    {
      id: 'ca-talk-suicide',
      name: 'Talk Suicide Canada',
      description: 'Bilingual suicide prevention service available across Canada.',
      phone: '1-833-456-4566',
      available: '24/7',
    },
    {
      id: 'ca-on-drug-alcohol',
      name: 'Drug & Alcohol Helpline (Ontario)',
      description:
        'Free, confidential information and referral for alcohol- and drug-related concerns in Ontario.',
      phone: '1-800-565-8603',
      available: '24/7',
    },
  ],
  ongoing: [
    {
      id: 'ca-aa',
      name: 'Alcoholics Anonymous Canada',
      description: 'Find local AA meetings across Canada.',
      url: 'https://www.aa.org',
      available: 'Varies by location',
    },
    {
      id: 'ca-ccsa',
      name: 'Canadian Centre on Substance Use and Addiction',
      description: 'Information, support, and referrals across Canada.',
      url: 'https://www.ccsa.ca',
      available: 'Anytime',
    },
  ],
};

export const IE_PACK: RegionPack = {
  code: 'IE',
  label: 'Ireland',
  immediate: [
    {
      id: 'ie-samaritans',
      name: 'Samaritans Ireland',
      description: 'Free, confidential support for anyone in distress.',
      phone: '116 123',
      available: '24/7',
    },
    {
      id: 'ie-hse-drugs-helpline',
      name: 'HSE Drugs & Alcohol Helpline',
      description: 'Free, confidential information and support.',
      phone: '1800 459 459',
      available: 'Mon–Fri 9:30am–5:30pm',
    },
  ],
  ongoing: [
    {
      id: 'ie-aa',
      name: 'Alcoholics Anonymous Ireland',
      description: 'Find local AA meetings across Ireland.',
      url: 'https://www.alcoholicsanonymous.ie',
      available: 'Varies by location',
    },
    {
      id: 'ie-drugs-ie',
      name: 'Drugs.ie',
      description: 'Information and support service from the HSE.',
      url: 'https://www.drugs.ie',
      available: 'Anytime',
    },
  ],
};

const PACKS: Record<RegionCode, RegionPack> = {
  US: US_PACK,
  UK: UK_PACK,
  AU: AU_PACK,
  CA: CA_PACK,
  IE: IE_PACK,
};

export function getPack(region: RegionCode): RegionPack {
  return PACKS[region] ?? US_PACK;
}

/** Detect the user's region from navigator.language. Returns one of
 *  the supported region codes, or 'US' if we can't tell or the locale
 *  isn't in our supported set. Pure function — never throws, never
 *  hits a network. */
export function detectRegion(navLanguage?: string | null): RegionCode {
  const raw = (navLanguage ?? '').trim();
  if (!raw) return 'US';
  // Examples: "en-US", "en-GB", "en-AU", "en-CA", "en-IE", "fr-CA", "es-US"
  const parts = raw.split(/[-_]/);
  if (parts.length < 2) {
    // Languages without an explicit region tag — best-effort defaults
    // for the languages we surface in the app.
    return 'US';
  }
  const region = (parts[parts.length - 1] ?? '').toUpperCase();
  switch (region) {
    case 'US':
      return 'US';
    case 'GB':
    case 'UK':
      return 'UK';
    case 'AU':
      return 'AU';
    case 'CA':
      return 'CA';
    case 'IE':
      return 'IE';
    default:
      return 'US';
  }
}

/** Browser-only convenience. Defers reading navigator until call-time
 *  so SSR / test harness still imports cleanly. */
export function detectRegionFromBrowser(): RegionCode {
  if (typeof navigator === 'undefined') return 'US';
  return detectRegion(navigator.language);
}
