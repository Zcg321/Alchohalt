/**
 * Hard-Time panel — the urgent-mode subset of crisis resources.
 *
 * Distinct from CrisisResources (the broader, region-aware list).
 * That surface is a directory; this is a small set of doors with their
 * handles labelled. A user opening this is not in browse-mode.
 *
 * Voice rule (round-4 spec): literal, low-emotion, action-first. No
 * "we hear you" / "you're not alone" / "we're here for you" filler.
 * Each item is a labelled handle. The user knows what they need; this
 * panel just stops being in the way.
 *
 * Four doors:
 *   1. Call 988               — Suicide & Crisis Lifeline (US)
 *   2. Text 988               — same line, text channel
 *   3. SAMHSA 1-800-662-HELP  — US substance-use helpline
 *   4. Stop tracking tonight  — sets settings.quietUntilTs to next-day
 *      midnight; TodayHome renders a quieter view until then. No
 *      auto-logged entry, no haptic, no celebratory anything.
 *
 * Plus a 1-min breathing timer:
 *   - "Breathe in" 4s, "Breathe out" 6s, six full cycles = 60s.
 *   - Just text changes — no scaling, no glow, no audio.
 *   - Reduced-motion is respected because there's no motion to begin
 *     with; the only "animation" is the seconds counter ticking.
 *   - "Stop" always available; finishing or stopping returns the
 *     panel to its idle state.
 *
 * Phone numbers are rendered as `<a href="tel:...">` (call) and
 * `<a href="sms:...">` (text). Real device links — the page never
 * intercepts. Privacy claim still holds: we don't see who you call
 * or text from this panel.
 */

import React, { useEffect, useState } from 'react';
import { useDB } from '../../store/db';
import { telHref, smsHref } from '../../lib/safeLinks';

interface Props {
  onClose: () => void;
}

const PRIMARY_BTN =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-700 px-5 py-4 text-base font-semibold text-white no-underline shadow-card hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors min-h-[56px]';

const SECONDARY_BTN =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-elevated px-5 py-4 text-base font-semibold text-ink no-underline hover:bg-cream-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 transition-colors min-h-[56px]';

/**
 * Next-day midnight in local time. Anchors the quiet-mode auto-expire
 * to the user's day boundary, not 24h from now — "tomorrow" reads more
 * like "until I wake up" than "for the next day".
 */
function nextDayMidnight(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

/* 1-minute breathing timer. 60 elapsed-second clock; phase derived
 * from the elapsed-second count (mod 10): seconds 0–3 = "in",
 * 4–9 = "out". Six 10-second cycles total. Single setInterval, no
 * phase-aware second-pass effect. */
const BREATH_TOTAL = 60;
const PHASE_IN_SECONDS = 4;

function BreathingTimer() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= BREATH_TOTAL) {
          setRunning(false);
          setDone(true);
          return BREATH_TOTAL;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function start() { setElapsed(0); setDone(false); setRunning(true); }
  function stop() { setRunning(false); setDone(false); setElapsed(0); }

  if (!running && !done) {
    return <button type="button" onClick={start} className={SECONDARY_BTN}>Breathe for one minute</button>;
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 text-center">
        <p className="text-h3 text-ink">Done.</p>
        <p className="mt-1 text-caption text-ink-soft">One minute, six breaths.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={start} className={SECONDARY_BTN}>Once more</button>
          <button type="button" onClick={stop} className={SECONDARY_BTN}>Close</button>
        </div>
      </div>
    );
  }

  const inPhase = elapsed % 10 < PHASE_IN_SECONDS;
  const phaseSeconds = inPhase ? elapsed % 10 : (elapsed % 10) - PHASE_IN_SECONDS;
  const phaseLength = inPhase ? PHASE_IN_SECONDS : 10 - PHASE_IN_SECONDS;
  const cycle = Math.floor(elapsed / 10) + 1;

  return (
    <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 text-center" role="status" aria-live="polite">
      <p className="text-h2 text-ink">{inPhase ? 'Breathe in' : 'Breathe out'}</p>
      <p className="mt-2 stat-num text-display text-ink leading-none">{phaseLength - phaseSeconds}</p>
      <p className="mt-2 text-caption text-ink-soft">Breath {Math.min(cycle, 6)} of 6</p>
      <button type="button" onClick={stop} className="mt-5 text-caption text-ink-soft underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">Stop</button>
    </div>
  );
}

export default function HardTimePanel({ onClose }: Props) {
  const { setSettings } = useDB();

  function handleQuietRest() {
    setSettings({ quietUntilTs: nextDayMidnight() });
    onClose();
  }

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6 sm:px-6">
      <header>
        <h1 className="text-h2 text-ink">Right now</h1>
        <p className="mt-1 text-caption text-ink-soft">
          Pick what helps. The phone numbers go straight to your dialer.
        </p>
      </header>

      <div className="space-y-3">
        <a
          href={telHref('988')}
          className={PRIMARY_BTN}
          data-testid="hard-time-call-988"
        >
          Call 988
          <span className="text-caption font-normal opacity-90">— Suicide &amp; Crisis Lifeline</span>
        </a>
        <a
          href={smsHref('HOME', '741741')}
          className={SECONDARY_BTN}
          data-testid="hard-time-text-741741"
        >
          Text HOME to 741741
          <span className="text-caption font-normal opacity-90">— Crisis Text Line</span>
        </a>
        <a
          href={telHref('1-800-662-4357')}
          className={SECONDARY_BTN}
          data-testid="hard-time-call-samhsa"
        >
          Call 1-800-662-HELP
          <span className="text-caption font-normal opacity-90">— SAMHSA, 24/7</span>
        </a>
      </div>

      <div className="pt-2">
        <BreathingTimer />
      </div>

      <div className="pt-2 border-t border-border-soft">
        <button
          type="button"
          onClick={handleQuietRest}
          className={SECONDARY_BTN}
          data-testid="hard-time-quiet-rest"
        >
          Stop tracking until tomorrow
        </button>
        <p className="mt-2 text-micro text-ink-subtle text-center">
          Hides the dashboard until midnight. Nothing logged. The app stays here when you come back.
        </p>
      </div>

      <footer className="pt-2 text-micro text-ink-subtle">
        <p>
          We don&apos;t see who you call or text — these are direct device links.
        </p>
      </footer>
    </main>
  );
}
