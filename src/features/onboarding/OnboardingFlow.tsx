import React, { useEffect, useRef, useState } from 'react';
import { useDB } from '../../store/db';
import { useLanguage } from '../../i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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

type Intent = 'cut-back' | 'quit' | 'curious';
type TrackStyle = 'day-by-day' | 'thirty-day' | 'custom';

interface BeatOneProps {
  onChoose: (intent: Intent) => void;
}
function BeatOne({ onChoose }: BeatOneProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Hi. What brings you here today?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Whatever you pick stays on your phone. You can change your mind anytime.
      </p>
      <div className="mt-5 grid gap-2.5">
        {([
          ['cut-back', 'Trying to drink less'],
          ['quit', 'Trying to stop'],
          ['curious', 'Not sure yet'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

interface BeatTwoProps {
  onChoose: (style: TrackStyle) => void;
}
function BeatTwo({ onChoose }: BeatTwoProps) {
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
          ['day-by-day', 'One day at a time'],
          ['thirty-day', 'A month off'],
          ['custom', 'Set my own'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChoose(id)}
            className="w-full rounded-2xl border border-neutral-200/70 bg-white px-5 py-3.5 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700/60 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800 transition-colors min-h-[48px]"
          >
            {label}
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

  useEffect(() => {
    if (!db.settings?.hasCompletedOnboarding) setIsVisible(true);
  }, [db.settings]);

  function complete() {
    setSettings({ hasCompletedOnboarding: true });
    setIsVisible(false);
  }

  // [BUG-9] Esc dismisses + persists.
  useEffect(() => {
    if (!isVisible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') complete();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, complete]);

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
        // [BUG-9] Backdrop click dismisses + persists.
        if (e.target === e.currentTarget) complete();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800 animate-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span id="onboarding-title" className="sr-only">
              Quick intro
            </span>
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
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
            onClick={complete}
            aria-label={t('onboarding.skip', 'Skip')}
            className="-mt-1 -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-cream-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          {step === 0 && <BeatOne onChoose={() => setStep(1)} />}
          {step === 1 && <BeatTwo onChoose={() => setStep(2)} />}
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
            onClick={complete}
            data-testid="onboarding-skip"
            className="hover:text-neutral-700 dark:hover:text-neutral-200 underline-offset-2 hover:underline"
          >
            {t('onboarding.skip', 'Skip and explore')}
          </button>
        </div>
      </div>
    </div>
  );
}
