/**
 * [R15-A] Tag explorer analyzer.
 *
 * Given a tag and the user's drinks, returns the full per-tag
 * breakdown: count, avgStd, span (first → last), 24-hour
 * distribution, and day-of-week distribution.
 *
 * Pure function. No side effects, no React. Voice for the consuming
 * component is factual; this analyzer just returns numbers.
 *
 * Drinks without the tag are filtered out before any computation,
 * so the returned arrays always reflect only entries carrying the
 * tag. Returns null when the tag has no matching drinks — caller
 * decides how to render the empty case.
 */
import type { Drink } from '../../types/common';
import { stdDrinks } from '../../lib/calc';

export interface TagDetail {
  tag: string;
  count: number;
  avgStd: number;
  totalStd: number;
  /** Earliest entry timestamp; equals latestTs when count === 1. */
  earliestTs: number;
  /** Most recent entry timestamp. */
  latestTs: number;
  /** 24 buckets, hours 0..23, count of entries per local hour. */
  hourBuckets: number[];
  /** 7 buckets, Sunday=0..Saturday=6, count of entries per local weekday. */
  weekdayBuckets: number[];
  /** Up to 10 most recent entries that carry the tag, newest first. */
  recent: { ts: number; std: number }[];
}

const RECENT_LIMIT = 10;

export function buildTagDetail(
  drinks: Drink[],
  tag: string,
): TagDetail | null {
  const matches = drinks.filter((d) => (d.tags ?? []).includes(tag));
  if (matches.length === 0) return null;

  const hourBuckets = new Array<number>(24).fill(0);
  const weekdayBuckets = new Array<number>(7).fill(0);
  let totalStd = 0;
  let earliestTs = matches[0].ts;
  let latestTs = matches[0].ts;

  for (const d of matches) {
    const std = stdDrinks(d.volumeMl, d.abvPct);
    totalStd += std;
    if (d.ts < earliestTs) earliestTs = d.ts;
    if (d.ts > latestTs) latestTs = d.ts;
    const dt = new Date(d.ts);
    hourBuckets[dt.getHours()] += 1;
    weekdayBuckets[dt.getDay()] += 1;
  }

  const sorted = [...matches].sort((a, b) => b.ts - a.ts);
  const recent = sorted.slice(0, RECENT_LIMIT).map((d) => ({
    ts: d.ts,
    std: stdDrinks(d.volumeMl, d.abvPct),
  }));

  return {
    tag,
    count: matches.length,
    avgStd: totalStd / matches.length,
    totalStd,
    earliestTs,
    latestTs,
    hourBuckets,
    weekdayBuckets,
    recent,
  };
}
