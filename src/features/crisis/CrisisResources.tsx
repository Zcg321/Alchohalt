import React from 'react';

/**
 * Crisis resources — always-on, never gated by feature flags or
 * subscriptions. Per owner-locked spec (2026-04-26):
 *
 *   "Crisis resources page (988 + SAMHSA + state-specific lifelines) —
 *    NEVER gated."
 *
 * No imports from FEATURE_FLAGS, no imports from subscriptionStore. The
 * absence of those imports is intentional — DO NOT add them. This is
 * legal-safety floor: if the app is open, this page must work.
 *
 * No `fetch()`, no analytics ping, no remote data. Hard-coded numbers
 * + URLs only. Privacy claim must hold here too.
 */

interface Resource {
  id: string;
  name: string;
  description: string;
  /** Real phone number, will become a tel: link. */
  phone?: string;
  /** Or "Text X to NUMBER" — will become an sms: link. */
  smsHint?: { keyword: string; number: string };
  /** Or a website link. */
  url?: string;
  available: string;
}

const IMMEDIATE: Resource[] = [
  {
    id: '988',
    name: '988 Suicide & Crisis Lifeline',
    description:
      'Free 24/7 support for anyone in suicidal crisis or emotional distress. Call or text 988.',
    phone: '988',
    available: '24/7',
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    description:
      'Free, confidential treatment-referral service for substance-use issues. Available in English and Spanish.',
    phone: '1-800-662-4357',
    available: '24/7',
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    description:
      'Text with a trained crisis counselor. No phone call required.',
    smsHint: { keyword: 'HOME', number: '741741' },
    available: '24/7',
  },
];

const SUPPORT_GROUPS: Resource[] = [
  {
    id: 'aa',
    name: 'Alcoholics Anonymous',
    description: 'Find local AA meetings near you.',
    url: 'https://www.aa.org',
    available: 'Varies by location',
  },
  {
    id: 'smart-recovery',
    name: 'SMART Recovery',
    description:
      'Self-empowerment, science-based recovery support. Free online meetings.',
    url: 'https://www.smartrecovery.org',
    available: 'Online + in-person',
  },
  {
    id: 'samhsa-locator',
    name: 'SAMHSA Treatment Locator',
    description: 'Search treatment facilities near you.',
    url: 'https://findtreatment.gov',
    available: 'Anytime',
  },
];

/**
 * Open a tel: link safely. Strips any non-digit other than the leading
 * "+" so the dialer doesn't get a bad URL.
 */
function callPhone(phone: string): void {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return;
  // Use anchor click so the platform decides which app handles tel:
  const a = document.createElement('a');
  a.href = `tel:${digits}`;
  a.click();
}

/** Open an SMS link with a pre-filled keyword. */
function sendText(keyword: string, number: string): void {
  const safeNumber = number.replace(/[^\d]/g, '');
  if (!safeNumber) return;
  const a = document.createElement('a');
  a.href = `sms:${safeNumber}?&body=${encodeURIComponent(keyword)}`;
  a.click();
}

/** Open an external URL with a hardened anchor. */
function openUrl(url: string): void {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
  } catch {
    return;
  }
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

export default function CrisisResources({
  className = '',
}: {
  className?: string;
}) {
  return (
    <main className={`mx-auto max-w-2xl space-y-7 px-5 py-6 sm:px-6 ${className}`}>
      {/* 911 banner — first thing on the page. Cannot be missed. Sized
          for thumb reach; the call button is the primary action. */}
      <section
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-50"
      >
        <h2 className="text-lg font-semibold tracking-tight">In immediate danger?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-red-900/90 dark:text-red-100/90">
          If you or someone near you is in immediate physical danger, call{' '}
          <strong>911</strong> right now.
        </p>
        <button
          type="button"
          onClick={() => callPhone('911')}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 min-h-[44px]"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call 911
        </button>
      </section>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Crisis &amp; Support Resources</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Free help, available right now. We never see who you call or text —
          these links open your phone&apos;s native dialer or messaging app.
        </p>
      </header>

      <section aria-labelledby="immediate-heading">
        <h2 id="immediate-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          Immediate help
        </h2>
        <ul className="mt-3 space-y-3">
          {IMMEDIATE.map((r) => (
            <li
              key={r.id}
              className="card"
            >
              <div className="card-content">
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">{r.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {r.description}
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{r.available}</p>
                  </div>
                  {r.phone ? (
                    <button
                      type="button"
                      onClick={() => callPhone(r.phone!)}
                      className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 min-h-[44px]"
                    >
                      Call {r.phone}
                    </button>
                  ) : null}
                  {r.smsHint ? (
                    <button
                      type="button"
                      onClick={() =>
                        sendText(r.smsHint!.keyword, r.smsHint!.number)
                      }
                      className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 min-h-[44px]"
                    >
                      Text {r.smsHint.keyword} to {r.smsHint.number}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ongoing-heading">
        <h2 id="ongoing-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
          Ongoing support
        </h2>
        <ul className="mt-3 space-y-3">
          {SUPPORT_GROUPS.map((r) => (
            <li
              key={r.id}
              className="card"
            >
              <div className="card-content">
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">{r.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {r.description}
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">{r.available}</p>
                  </div>
                  {r.url ? (
                    <button
                      type="button"
                      onClick={() => openUrl(r.url!)}
                      className="shrink-0 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 min-h-[44px]"
                    >
                      Visit
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-neutral-200/70 dark:border-neutral-800 pt-6 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500 space-y-2">
        <p>
          Alchohalt is not a substitute for professional medical, mental
          health, or addiction treatment. We don&apos;t see who you call or
          text from this page — these are direct device links to public
          hotlines.
        </p>
        <p>
          If you&apos;re in another country, your local emergency number may
          differ from 911. Most countries have a 24/7 mental health hotline —
          search &ldquo;crisis hotline {`<your country>`}&rdquo;.
        </p>
      </footer>
    </main>
  );
}
