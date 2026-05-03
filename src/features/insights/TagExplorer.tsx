/**
 * [R15-A] Tag explorer surface.
 *
 * Renders a per-tag breakdown when the user taps a tag in
 * TagPatternsCard. Shows count, span, time-of-day distribution
 * (24-hour bars), day-of-week distribution (7 bars), and the 10
 * most recent matching entries.
 *
 * Voice: factual. The explorer surfaces shape; the user does the
 * interpreting. No "you tend to..." sentences.
 */
import React from 'react';
import type { Drink } from '../../types/common';
import { buildTagDetail } from './tagExplorerAnalyzer';

interface Props {
  drinks: Drink[];
  tag: string;
  onClose: () => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeShort(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1" title={`${label}: ${value}`}>
      <div
        className="w-3 rounded-sm bg-primary-300 dark:bg-primary-700"
        style={{ height: `${Math.max(2, pct * 0.6)}px` }}
        aria-hidden="true"
      />
      <span className="text-[10px] text-ink-soft tabular-nums">{label}</span>
    </div>
  );
}

export default function TagExplorer({ drinks, tag, onClose }: Props) {
  const detail = buildTagDetail(drinks, tag);
  if (!detail) return null;

  const maxHour = Math.max(...detail.hourBuckets);
  const maxWeekday = Math.max(...detail.weekdayBuckets);

  // Display only hours that have at least one entry, to keep the row
  // compact. If user has 1-2 hours of activity the row stays narrow.
  const activeHours = detail.hourBuckets
    .map((count, hour) => ({ count, hour }))
    .filter((h) => h.count > 0);

  return (
    <section
      data-testid="tag-explorer"
      aria-labelledby={`tag-explorer-${tag}-heading`}
      className="rounded-2xl border border-border bg-surface p-card space-y-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4
          id={`tag-explorer-${tag}-heading`}
          className="text-h4 text-ink"
        >
          #{tag}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-caption text-ink-soft underline underline-offset-2 hover:text-ink"
          aria-label={`Close ${tag} explorer`}
          data-testid="tag-explorer-close"
        >
          Close
        </button>
      </div>

      <p className="text-caption text-ink-soft tabular-nums">
        {detail.count} {detail.count === 1 ? 'entry' : 'entries'}
        {' · '}
        avg {detail.avgStd.toFixed(2)} std
        {' · '}
        {formatDateShort(detail.earliestTs)}
        {detail.earliestTs !== detail.latestTs && (
          <> {' to '} {formatDateShort(detail.latestTs)}</>
        )}
      </p>

      <div>
        <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
          By weekday
        </h5>
        <div className="flex items-end gap-3" data-testid="tag-explorer-weekday-row">
          {detail.weekdayBuckets.map((count, idx) => (
            <MiniBar
              key={idx}
              value={count}
              max={maxWeekday}
              label={WEEKDAY_LABELS[idx]}
            />
          ))}
        </div>
      </div>

      {activeHours.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
            By hour of day
          </h5>
          <div className="flex items-end gap-2 flex-wrap" data-testid="tag-explorer-hour-row">
            {activeHours.map(({ count, hour }) => (
              <MiniBar
                key={hour}
                value={count}
                max={maxHour}
                label={`${hour}h`}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
          Recent
        </h5>
        <ul className="space-y-1" data-testid="tag-explorer-recent">
          {detail.recent.map((r, idx) => (
            <li
              key={idx}
              className="flex items-baseline justify-between text-caption text-ink-soft tabular-nums"
            >
              <span>
                {formatDateShort(r.ts)} · {formatTimeShort(r.ts)}
              </span>
              <span>{r.std.toFixed(2)} std</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
