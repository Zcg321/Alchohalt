import React from 'react';
import { detectRegionFromBrowser, getPack, US_PACK, type RegionCode } from './regions';
import { telHref, smsHref, safeHttpUrl } from '../../lib/safeLinks';

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
 *
 * [INTL-1] Sprint 2B: locale-aware. Resource packs for US / UK / AU /
 * CA / IE; the detected region renders first, US always remains
 * visible below as "Other regions" so a misdetected user can still
 * reach a known-good number.
 */

export interface Resource {
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

const PRIMARY_LINK_CLASSES =
  'shrink-0 inline-flex items-center justify-center rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white no-underline shadow-sm hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 min-h-[44px]';

const SECONDARY_LINK_CLASSES =
  'shrink-0 inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-ink no-underline hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 dark:hover:bg-charcoal-700 min-h-[44px]';

function ImmediateCard({ r }: { r: Resource }) {
  return (
    <li className="card">
      <div className="card-content">
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink">{r.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {r.description}
            </p>
            <p className="mt-1.5 text-xs text-ink-subtle">{r.available}</p>
          </div>
          {r.phone ? (
            <a href={telHref(r.phone)} className={PRIMARY_LINK_CLASSES}>
              Call {r.phone}
            </a>
          ) : null}
          {r.smsHint ? (
            <a
              href={smsHref(r.smsHint.keyword, r.smsHint.number)}
              className={PRIMARY_LINK_CLASSES}
            >
              Text {r.smsHint.keyword} to {r.smsHint.number}
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function OngoingCard({ r }: { r: Resource }) {
  const href = r.url ? safeHttpUrl(r.url) : '';
  return (
    <li className="card">
      <div className="card-content">
        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink">{r.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {r.description}
            </p>
            <p className="mt-1.5 text-xs text-ink-subtle">{r.available}</p>
          </div>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={SECONDARY_LINK_CLASSES}
            >
              Visit
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

interface Props {
  className?: string;
  /** Optional override for tests / SSR. Defaults to navigator.language. */
  region?: RegionCode;
}

export default function CrisisResources({ className = '', region }: Props) {
  const detected = region ?? detectRegionFromBrowser();
  const primary = getPack(detected);
  const showUSFallback = primary.code !== 'US';

  return (
    <main className={`mx-auto max-w-2xl space-y-7 px-5 py-6 sm:px-6 ${className}`}>
      {/* 911 banner — first thing on the page. Cannot be missed. Sized
          for thumb reach; the call button is the primary action. */}
      <section
        role="alert"
        className="rounded-2xl border border-crisis-100 bg-crisis-50 p-5 text-crisis-900 dark:border-crisis-900/60 dark:bg-crisis-900/40 dark:text-crisis-50"
      >
        <h2 className="text-lg font-semibold tracking-tight">In immediate danger?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-crisis-900/90 dark:text-crisis-100/90">
          If you or someone near you is in immediate physical danger, call your
          local emergency number right now (US/CA <strong>911</strong>, UK/IE{' '}
          <strong>999</strong>, AU <strong>000</strong>).
        </p>
        {(() => {
          const emergencyNumber =
            primary.code === 'UK' || primary.code === 'IE'
              ? '999'
              : primary.code === 'AU'
                ? '000'
                : '911';
          return (
            <a
              href={`tel:${emergencyNumber}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-crisis-600 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-sm hover:bg-crisis-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crisis-700 min-h-[44px]"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call {emergencyNumber}
            </a>
          );
        })()}
      </section>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Crisis &amp; Support Resources</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Free help, available right now. We never see who you call or text —
          these links open your phone&apos;s native dialer or messaging app.
        </p>
        <p className="mt-1 text-xs text-ink-subtle">
          Showing resources for <strong>{primary.label}</strong>. Other regions are listed below.
        </p>
      </header>

      <section aria-labelledby="immediate-heading">
        <h2 id="immediate-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Immediate help — {primary.label}
        </h2>
        <ul className="mt-3 space-y-3" role="list">
          {primary.immediate.map((r) => <ImmediateCard key={r.id} r={r} />)}
        </ul>
      </section>

      <section aria-labelledby="ongoing-heading">
        <h2 id="ongoing-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Ongoing support — {primary.label}
        </h2>
        <ul className="mt-3 space-y-3" role="list">
          {primary.ongoing.map((r) => <OngoingCard key={r.id} r={r} />)}
        </ul>
      </section>

      {showUSFallback && (
        <>
          <section aria-labelledby="other-immediate-heading">
            <h2 id="other-immediate-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Other regions — Immediate help (United States)
            </h2>
            <ul className="mt-3 space-y-3" role="list">
              {US_PACK.immediate.map((r) => <ImmediateCard key={r.id} r={r} />)}
            </ul>
          </section>

          <section aria-labelledby="other-ongoing-heading">
            <h2 id="other-ongoing-heading" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
              Other regions — Ongoing support (United States)
            </h2>
            <ul className="mt-3 space-y-3" role="list">
              {US_PACK.ongoing.map((r) => <OngoingCard key={r.id} r={r} />)}
            </ul>
          </section>
        </>
      )}

      <footer className="border-t border-border-soft pt-6 text-xs leading-relaxed text-ink-subtle space-y-2">
        <p>
          Alchohalt is not a substitute for professional medical, mental
          health, or addiction treatment. We don&apos;t see who you call or
          text from this page — these are direct device links to public
          hotlines.
        </p>
        <p>
          If you&apos;re in a region we don&apos;t have a pack for, find your
          local crisis hotline by searching &ldquo;crisis hotline {`<your country>`}&rdquo;.
          The US numbers above accept calls from outside the US but local
          numbers will reach you faster.
        </p>
      </footer>
    </main>
  );
}
