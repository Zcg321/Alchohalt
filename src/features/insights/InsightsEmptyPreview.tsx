/**
 * [R25-H] Insights empty-state preview.
 *
 * When the user has fewer than 7 entries, the existing empty-state
 * gives them only a calm "nothing to chart yet" message. R25-H adds
 * a "this is what your data could look like" preview underneath —
 * a sketch of the trend tile, money-saved widget, and tag insights
 * with sample numbers. Voice rule: every preview surface is
 * explicitly labeled "Sample" so users never confuse fake data for
 * theirs.
 *
 * Design constraints:
 *   - Pure SVG / CSS sketch. No data injection into the real charts —
 *     that would risk a "wait, did I log that?" confusion bug.
 *   - "Sample" badges on every tile (not just at the top), so a user
 *     who scrolls to the third tile still sees the disclaimer.
 *   - Reduced-motion compatible: no animation. Static skeleton-like
 *     bars only.
 *   - Same card chrome as real tiles, so the visual rhythm sets
 *     expectations correctly without surprising the user when their
 *     real insights replace it.
 *
 * Threshold: < 7 entries. Below 7, even simple trends look noisy;
 * the preview gives shape to "what you'll see soon" without making
 * promises about timing.
 */

import React from 'react';

interface Props {
  entryCount: number;
}

const SAMPLE_BADGE_CLASSES =
  'inline-flex items-center gap-1.5 rounded-pill bg-cream-100 px-2.5 py-1 text-xs font-medium text-ink-soft border border-border-soft';

export default function InsightsEmptyPreview({ entryCount }: Props) {
  const remaining = Math.max(0, 7 - entryCount);

  return (
    <section
      className="rounded-2xl border border-border-soft bg-surface-elevated p-card"
      aria-labelledby="insights-empty-preview-heading"
      data-testid="insights-empty-preview"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 id="insights-empty-preview-heading" className="text-h3 text-ink">
            What your Insights will look like
          </h3>
          <p className="mt-1 text-caption text-ink-soft">
            {entryCount === 0
              ? 'Log your first drink to start filling these in.'
              : `${remaining} more ${remaining === 1 ? 'entry' : 'entries'} until your real trends appear.`}
          </p>
        </div>
        <span className={SAMPLE_BADGE_CLASSES} aria-hidden>
          <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-ink-soft/60" />
          Sample
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SamplePill
          label="Trailing 7 days"
          value="3.2"
          unit="std drinks"
          caption="Down from 5.1 the prior week."
        />
        <SamplePill
          label="Money saved"
          value="$28"
          unit="vs. baseline"
          caption="Trailing 30 days at your average price."
        />
        <SamplePill
          label="Peak hour"
          value="8 PM"
          unit="– 9 PM"
          caption="Your most-frequent log window."
        />
        <SamplePill
          label="Mood pattern"
          value="3 / 7"
          unit="bored entries"
          caption="HALT tag distribution from your logs."
        />
      </div>

      <SampleBarChart />

      <p className="mt-4 text-micro text-ink-subtle">
        These numbers are illustrative only. Your real insights replace
        this preview as soon as you have enough entries (typically about
        a week of logs).
      </p>
    </section>
  );
}

function SamplePill({
  label, value, unit, caption,
}: { label: string; value: string; unit: string; caption: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-ink-soft">{label}</p>
        <span className="text-[10px] uppercase tracking-wider text-ink-soft/70">Sample</span>
      </div>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-h2 text-ink leading-none">{value}</span>
        <span className="text-xs text-ink-soft">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-ink-soft">{caption}</p>
    </div>
  );
}

function SampleBarChart() {
  // Static 7-bar sketch — no animation, reduced-motion safe.
  // Heights chosen to suggest a downward trend without being on-the-nose.
  const heights = [70, 64, 58, 50, 44, 38, 30];

  return (
    <div
      className="mt-5 rounded-xl border border-border-soft bg-surface px-4 py-4"
      aria-label="Sample trend chart"
      data-testid="insights-empty-preview-chart"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-ink-soft">Trend (sample)</p>
        <span className={SAMPLE_BADGE_CLASSES} aria-hidden>Sample</span>
      </div>
      <svg viewBox="0 0 240 90" className="mt-3 w-full text-sage-500/40" aria-hidden>
        <line x1="20" y1="78" x2="220" y2="78" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        {heights.map((h, i) => (
          <rect
            key={i}
            x={28 + i * 28}
            y={78 - h * 0.7}
            width="16"
            height={h * 0.7}
            rx="2"
            fill="currentColor"
            opacity={0.6 + (heights.length - i) * 0.04}
          />
        ))}
      </svg>
    </div>
  );
}
