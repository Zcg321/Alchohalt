import React, { useCallback, useEffect, useRef, useState } from 'react';
/* [R29-4] BeatOne no longer needs useState/useEffect — the chips
 * render immediately. Imports kept for the rest of the file. */
import { useDB } from '../../store/db';
import type { OnboardingDiagnostics } from '../../store/db';
import { useLanguage } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { analytics } from '../analytics/analytics';

/**
 * [ONBOARD-1] Three-beat conversational onboarding.
 *
 * Replaces the previous 6-step emoji carousel (welcome / privacy /
 * tracking / insights / goals / ready) with three honest beats:
 *
 *   1. "Hi. What brings you here today?"
 *      Three optional chips, plus "Decide later" tertiary, plus
 *      "I'm just looking" skip. Choice is recorded but never required.
 *      [R25-G] Chip labels pinned to first-person-trying winner.
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
}
/* [R25-G] Onboarding chip copy A/B winner: first-person-trying.
 *
 * The R15-B / R16-A experiment ran 3 arms (control / first-person /
 * first-person-trying). R25-G picks the winner per voice principles
 * — observation over declaration, owned without commitment-anxiety —
 * and ships first-person-trying as the only variant. The experiment
 * is archived (existing exposure history preserved for the audit
 * panel; no new buckets assigned). The dead variant code is removed.
 *
 * Voice rationale documented in audit-walkthrough/round-25-onboarding-
 * ab-winner.md. The `chipLabelFor` indirection is gone — labels are
 * the same for everyone, full stop. */
type PrimaryIntent = Exclude<Intent, 'undecided'>;
const CHIP_LABELS: Readonly<Record<PrimaryIntent, string>> = {
  'cut-back': "I'm trying to drink less",
  quit: "I'm pausing alcohol for now",
  curious: "I'm just looking around",
};
function BeatOne({ onChoose, onJustLooking, justLookingLabel, decideLaterLabel }: BeatOneProps) {
  /* [R29-4] The chips render immediately and are tap-able from frame 1.
   *
   * Pre-R29 wired a 500ms setTimeout before the chips appeared
   * ("[ONBOARDING-ROUND-4] half-second pause"). Two problems with
   * that pattern:
   *   1. A reduced-motion user *also* waited 500ms — the
   *      `motion-safe:` class only suppressed the fade animation,
   *      not the JS timer that gated the render. That's a bug for
   *      the disability cohort.
   *   2. From a perceived-performance lens, 500ms of "did the app
   *      hang?" is exactly the window where first-launch users
   *      abandon — well past the 100ms threshold where users
   *      perceive an intentional pause vs a broken UI.
   *
   * The fade-in animation now runs on the chips themselves via the
   * existing `motion-safe:animate-fade-in` keyframe — visual calm is
   * preserved for users who don't have reduced-motion, and tap
   * targets are live from the first paint. */
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Hi. What brings you here today?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Whatever you pick stays on your phone. You can change your mind anytime.
      </p>
      <div
        className="mt-5 grid gap-2.5 motion-safe:animate-fade-in"
        data-testid="onboarding-chip-row"
        data-variant="first-person-trying"
      >
        {(['cut-back', 'quit', 'curious'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            data-testid={`onboarding-chip-${id}`}
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            {CHIP_LABELS[id]}
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
  onContinue: () => void;
}
function BeatThree({ onContinue }: BeatThreeProps) {
  /* [ONBOARDING-ROUND-4] Optional "Tell me how" disclosure for users
   * who want to verify the privacy claim before continuing. Native
   * <details> stays keyboard-accessible by default and inherits the
   * dialog's focus trap. Copy stays calm — describes mechanism in
   * plain language without crypto jargon.
   *
   * [R27-C] The terminal CTA on this beat is now "Continue" rather
   * than "Get started" — Beat 4 owns the final decision (log style).
   * Existing tests that click "Get started" land on Beat 4 unchanged. */
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
        onClick={onContinue}
        data-testid="onboarding-privacy-continue"
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors min-h-[48px]"
      >
        Continue
      </button>
    </>
  );
}

/* [R27-C] Beat 4: log style. R26-4 ex-Reframe/ex-Sunnyside user audit
 * found that the quick-vs-detailed toggle is buried in Settings →
 * Appearance — first-week users default into detailed mode without
 * knowing the alternative exists. Surface it once during onboarding
 * with a two-chip choice + explicit reassurance that it's reversible.
 * Either choice persists drinkLogMode and finishes onboarding via
 * onComplete; no chip == default ('detailed') if the user closes the
 * modal here. */
interface BeatFourProps {
  onChoose: (mode: 'quick' | 'detailed') => void;
}
function BeatFour({ onChoose }: BeatFourProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Want to log fast or in detail?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        You can change this anytime in Settings.
      </p>
      <div className="mt-5 grid gap-2.5">
        <button
          type="button"
          onClick={() => onChoose('quick')}
          data-testid="onboarding-log-mode-quick"
          className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[56px]"
        >
          <div>Fast — one-tap chips</div>
          <div className="mt-0.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
            Default volume + ABV per drink type. No modal.
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChoose('detailed')}
          data-testid="onboarding-log-mode-detailed"
          className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3 text-start text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[56px]"
        >
          <div>Detailed — pick volume, ABV, mood, tags</div>
          <div className="mt-0.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
            Full form. Slower but precise.
          </div>
        </button>
      </div>
      <button
        type="button"
        onClick={() => onChoose('detailed')}
        data-testid="onboarding-log-mode-skip"
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
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isVisible, setIsVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
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

  const complete = useCallback((logMode?: 'quick' | 'detailed') => {
    analytics.track('onboarding-complete', { step });
    /* [R27-C] If the user chose a log mode on Beat 4, persist it
     * alongside completion. Detailed is the existing default, so
     * recording it explicitly is harmless but makes the diagnostics
     * differentiate "user picked detailed" from "user closed before
     * Beat 4." */
    if (logMode) {
      setSettings({ drinkLogMode: logMode });
    }
    persist({
      status: 'completed',
      intent,
      trackStyle,
      completedAt: Date.now(),
    });
  }, [persist, intent, trackStyle, step, setSettings]);

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
      skipStep: step,
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
              Quick intro, step {step + 1} of 4
            </span>
            <div
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={4}
              aria-label={`Step ${step + 1} of 4`}
              className="flex gap-1.5"
            >
              {[0, 1, 2, 3].map((i) => (
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
            />
          )}
          {step === 1 && (
            <BeatTwo
              onChoose={(s) => { setTrackStyle(s); setStep(2); }}
            />
          )}
          {step === 2 && <BeatThree onContinue={() => setStep(3)} />}
          {step === 3 && <BeatFour onChoose={(mode) => complete(mode)} />}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2 | 3)))}
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
