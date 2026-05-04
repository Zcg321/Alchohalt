import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDB } from '../../store/db';
import type { OnboardingDiagnostics } from '../../store/db';
import { useLanguage } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { analytics } from '../analytics/analytics';
import { useExperiment } from '../experiments/useExperiment';

/**
 * [ONBOARD-1] Three-beat conversational onboarding.
 *
 * Replaces the previous 6-step emoji carousel (welcome / privacy /
 * tracking / insights / goals / ready) with three honest beats:
 *
 *   1. "Hi. What brings you here today?"
 *      Three optional chips: Trying to drink less / Trying to stop /
 *      Not sure yet. Skip works. Choice is recorded but never required.
 *
 *   2. "How would you like to track?"
 *      Three optional chips: One day at a time / A month off /
 *      Set my own. Skip works.
 *
 *   3. "Your data, your device."
 *      Single Get started button.
 *
 * Each beat has Skip and a real X close button. Esc + backdrop click
 * also dismiss. All paths persist `hasCompletedOnboarding=true` so
 * the modal does not re-fire on next load.
 *
 * Voice: trusted-friend tone. No "Welcome to Alchohalt!". No emoji
 * parade. No exclamation marks. Sentence case throughout.
 */

type Intent = 'cut-back' | 'quit' | 'curious' | 'undecided';
type TrackStyle = 'day-by-day' | 'thirty-day' | 'custom';

interface BeatOneProps {
  onChoose: (intent: Intent) => void;
  onJustLooking: () => void;
  justLookingLabel: string;
  /** [R23-C] Tertiary "Decide later" label — distinct from the just-looking
   * skip path because it advances the flow + records intent='undecided'
   * rather than dismissing the modal. */
  decideLaterLabel: string;
  /** [R15-B] Variant from the onboarding-chip-copy-2026Q2 experiment. */
  chipVariant: string | null;
}
/* [R15-B / R16-A] Three label sets driven by the active experiment
 * variant. The intent IDs ('cut-back', 'quit', 'curious') are stable
 * so the downstream OnboardingDiagnostics record stays consistent
 * across variants — only the human-facing label changes. */
/* [R23-C] The three primary chips remain cut-back / quit / curious;
 * 'undecided' is rendered separately as a tertiary chip with its own
 * label. Keeping the label sets focused on the three primaries
 * preserves the experiment variants without introducing a 4th label
 * column nobody is testing. */
type PrimaryIntent = Exclude<Intent, 'undecided'>;
const CHIP_LABELS_CONTROL: Readonly<Record<PrimaryIntent, string>> = {
  'cut-back': 'Trying to drink less',
  quit: 'Trying to stop',
  curious: 'Not sure yet',
};
const CHIP_LABELS_FIRST_PERSON: Readonly<Record<PrimaryIntent, string>> = {
  'cut-back': 'I want to drink less',
  quit: "I'm stopping for now",
  curious: "I'm here to learn",
};
/* [R16-A] Gentler middle ground: keeps the first-person voice but
 * restores the hedge of "trying" / "pausing" / "looking" so the chips
 * read as observation of a current attempt rather than a declaration
 * of intent. */
const CHIP_LABELS_FIRST_PERSON_TRYING: Readonly<Record<PrimaryIntent, string>> = {
  'cut-back': "I'm trying to drink less",
  quit: "I'm pausing alcohol for now",
  curious: "I'm just looking around",
};
function chipLabelFor(variant: string | null, intent: PrimaryIntent): string {
  if (variant === 'first-person') return CHIP_LABELS_FIRST_PERSON[intent];
  if (variant === 'first-person-trying') return CHIP_LABELS_FIRST_PERSON_TRYING[intent];
  return CHIP_LABELS_CONTROL[intent];
}
function BeatOne({ onChoose, onJustLooking, justLookingLabel, decideLaterLabel, chipVariant }: BeatOneProps) {
  /* [ONBOARDING-ROUND-4] Half-second pause before chips appear. The
   * user just opened the app on Day 0 — let the question land before
   * the answer prompts crowd in. The chips fade in via the existing
   * animate-fade-in keyframe. Reduced-motion users get an instant
   * mount without the fade. */
  const [showChips, setShowChips] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShowChips(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Hi. What brings you here today?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Whatever you pick stays on your phone. You can change your mind anytime.
      </p>
      {showChips ? (
        <>
          <div
            className="mt-5 grid gap-2.5 motion-safe:animate-fade-in"
            data-testid="onboarding-chip-row"
            data-variant={chipVariant ?? 'control'}
          >
            {(['cut-back', 'quit', 'curious'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChoose(id)}
                data-testid={`onboarding-chip-${id}`}
                className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
              >
                {chipLabelFor(chipVariant, id)}
              </button>
            ))}
          </div>
          {/* [R23-C] Tertiary "Decide later" chip. Visually subdued
              (dashed border, no fill) so it reads as a non-decision,
              not a fourth equal option. Records intent='undecided'
              and ADVANCES to step 1 — distinct from the just-looking
              link below which dismisses the modal. */}
          <div className="mt-3 motion-safe:animate-fade-in">
            <button
              type="button"
              onClick={() => onChoose('undecided')}
              data-testid="onboarding-chip-undecided"
              className="w-full rounded-2xl border border-dashed border-neutral-300/80 bg-transparent px-5 py-3 text-start text-sm font-medium text-neutral-600 hover:bg-neutral-50/60 hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-600/70 dark:text-neutral-300 dark:hover:bg-neutral-800/40 transition-colors min-h-[44px]"
            >
              {decideLaterLabel}
            </button>
          </div>
          {/* [R9-T2] Tertiary skip-ahead. Distinct from the bottom "Skip and
              explore" so we can tell from local Diagnostics whether users
              jump straight in or pick a chip first. */}
          <div className="mt-4 text-center motion-safe:animate-fade-in">
            <button
              type="button"
              onClick={onJustLooking}
              data-testid="onboarding-just-looking"
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded"
            >
              {justLookingLabel}
            </button>
          </div>
        </>
      ) : (
        /* Reserved-space placeholder so the dialog doesn't reflow when
         * the chips arrive. Three primary chips × 56px + tertiary
         * Decide-later chip × 52px + just-looking link row.
         * [R23-C] Bumped from 200 → 252px to fit the new chip. */
        <div aria-hidden className="mt-5 h-[252px]" />
      )}
    </>
  );
}

interface BeatTwoProps {
  onChoose: (style: TrackStyle) => void;
}
function BeatTwo({ onChoose }: BeatTwoProps) {
  /* [ONBOARDING-ROUND-4] Each option now has a 1-line preview
   * underneath so the user can pick informed without committing
   * blind. Wording stays literal — describes what the choice looks
   * like in the app, not what it says about the user. */
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        How would you like to track?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Pick the rhythm that fits. You can adjust this in Settings later.
      </p>
      <div className="mt-5 grid gap-2.5">
        {([
          ['day-by-day', 'One day at a time', 'Daily check-in. No streaks, no targets.'],
          ['thirty-day', 'A month off', 'A 30-day window. Just the count.'],
          ['custom', 'Set my own', 'Custom daily and weekly caps.'],
        ] as const).map(([id, label, preview]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[56px]"
          >
            <div>{label}</div>
            <div className="mt-0.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">{preview}</div>
          </button>
        ))}
      </div>
    </>
  );
}

interface BeatThreeProps {
  onStart: () => void;
}
function BeatThree({ onStart }: BeatThreeProps) {
  /* [ONBOARDING-ROUND-4] Optional "Tell me how" disclosure for users
   * who want to verify the privacy claim before tapping Get started.
   * Native <details> stays keyboard-accessible by default and inherits
   * the dialog's focus trap. Copy stays calm — describes mechanism in
   * plain language without crypto jargon. */
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Your data, your device.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Nobody else, including us, can see what you log. Optional AI
        features (off by default) are the only thing that can change
        this — you control them in Settings.
      </p>
      <details className="mt-3 rounded-xl border border-neutral-200/70 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-600 open:bg-white dark:border-neutral-700/60 dark:bg-neutral-800/40 dark:text-neutral-400 dark:open:bg-neutral-800/70">
        <summary className="cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded">
          Tell me how
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            Entries live in your phone&apos;s local storage. Nothing leaves the device unless you turn on cloud sync, and then they&apos;re sealed end-to-end with a key only your device knows. We hold the encrypted blobs, not the contents.
          </p>
          <p>
            If you turn on AI insights (off by default), an anonymized summary is sent to the model — no entries, no identifiers. The full data flow is in Settings.
          </p>
        </div>
      </details>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors min-h-[48px]"
      >
        Get started
      </button>
    </>
  );
}

export default function OnboardingFlow() {
  const { t } = useLanguage();
  const { db, setSettings } = useDB();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isVisible, setIsVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  /* [R15-B] First active A/B test. Variant is stable per device,
   * deterministic from the install bucket. The hook returns null
   * when the experiment is dormant or the env can't read storage,
   * which falls through to the control labels in chipLabelFor. */
  const chipVariant = useExperiment('onboarding-chip-copy-2026Q2');
  // [R9-2] Local-only diagnostics buffer. Persisted on `complete()` /
  // `skip()` so we don't write on every chip tap.
  const [intent, setIntent] = useState<Intent | undefined>();
  const [trackStyle, setTrackStyle] = useState<TrackStyle | undefined>();

  useEffect(() => {
    if (!db.settings?.hasCompletedOnboarding) setIsVisible(true);
  }, [db.settings]);

  /* [ONBOARDING-ROUND-4] Skip-vs-complete event for the no-op analytics
   * shim. Differentiates the path: explicit Get-started click counts
   * as "complete"; skip-link / Esc / backdrop-click count as "skip".
   * No PII — just the event name. The shim is no-op in production
   * (audit-flagged in src/features/analytics/analytics.ts), so this
   * call only logs to console.debug in dev. Wiring the call now means
   * the moment the shim grows a real opt-in destination, the data is
   * already flowing. */
  const persist = useCallback((diag: OnboardingDiagnostics) => {
    setSettings({
      hasCompletedOnboarding: true,
      onboardingDiagnostics: diag,
    });
    setIsVisible(false);
  }, [setSettings]);

  const complete = useCallback(() => {
    analytics.track('onboarding-complete', { step });
    persist({
      status: 'completed',
      intent,
      trackStyle,
      completedAt: Date.now(),
    });
  }, [persist, intent, trackStyle, step]);

  const skip = useCallback((path: NonNullable<OnboardingDiagnostics['skipPath']>) => {
    analytics.track('onboarding-skipped', { step });
    persist({
      status: 'skipped',
      intent,
      trackStyle,
      completedAt: Date.now(),
      skipPath: path,
      // [R11-1] Capture step at moment of skip so the local funnel
      // view can compute drop-off per beat.
      skipStep: step as 0 | 1 | 2,
    });
  }, [persist, intent, trackStyle, step]);

  // [BUG-9] Esc dismisses + persists. [R9-2] Records the skip path.
  useEffect(() => {
    if (!isVisible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') skip('escape');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, skip]);

  /* [A11Y-FOCUS-TRAP] Tab inside the onboarding dialog wraps to first/
   * last focusable element. Without it, Tab from the last button (Get
   * started / Skip) escaped to the page underneath. The window-level
   * Escape handler above already covers Escape; onEscape on the trap
   * is intentionally omitted. */
  useFocusTrap(dialogRef, isVisible);

  if (!isVisible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding-modal"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center overflow-y-auto bg-neutral-950/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => {
        // [BUG-9] Backdrop click dismisses + persists. [R9-2] tracked
        // as a distinct skip path in local diagnostics.
        if (e.target === e.currentTarget) skip('backdrop');
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800 animate-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span id="onboarding-title" className="sr-only">
              Quick intro, step {step + 1} of 3
            </span>
            <div
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`Step ${step + 1} of 3`}
              className="flex gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step
                      ? 'bg-neutral-800 dark:bg-neutral-100'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => skip('x-button')}
            aria-label={t('onboarding.close', 'Close')}
            data-testid="onboarding-x-button"
            className="-mt-1 -me-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          {step === 0 && (
            <BeatOne
              onChoose={(i) => { setIntent(i); setStep(1); }}
              onJustLooking={() => skip('just-looking')}
              justLookingLabel={t('onboarding.justLooking', "I'm just looking")}
              decideLaterLabel={t('onboarding.decideLater', 'Decide later')}
              chipVariant={chipVariant}
            />
          )}
          {step === 1 && (
            <BeatTwo
              onChoose={(s) => { setTrackStyle(s); setStep(2); }}
            />
          )}
          {step === 2 && <BeatThree onStart={complete} />}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2)))}
              className="hover:text-neutral-700 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
            >
              {t('onboarding.back', 'Back')}
            </button>
          ) : <span />}
          <button
            type="button"
            onClick={() => skip('skip-explore')}
            data-testid="onboarding-skip"
            className="hover:text-neutral-700 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
          >
            {t('onboarding.skipExplore', 'Skip and explore')}
          </button>
        </div>
      </div>
    </div>
  );
}
