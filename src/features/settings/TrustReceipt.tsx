/**
 * [R8-C] Trust Receipt UI — opt-in provenance log for Settings.
 *
 * Sibling to PrivacyStatus. Where PrivacyStatus says "here are the
 * features that COULD send data, and whether they're on", the Trust
 * Receipt shows "here is every storage write and every outbound
 * request the app actually made since you flipped this on."
 *
 * Design choices:
 *
 * - Off by default: this is a debug surface, not a normal-user UI.
 *   The vast majority of users never need it. Showing the toggle to
 *   everyone is fine; rendering the live log only when active keeps
 *   noise out of normal Settings.
 *
 * - Newest-first list, capped at 200 entries. The receipt module
 *   bounds memory; we just render what's there.
 *
 * - Voice: technical, factual. No "we promise" language, no
 *   reassurance copy. The user is here BECAUSE they want raw facts.
 *
 * - "Mark and clear" pattern: a Clear button sets a baseline so the
 *   user can run a specific action (open AI insights, tap Sync) and
 *   see the resulting events in isolation, instead of scrolling
 *   through a thousand storage gets.
 *
 * The log is in-memory only — never persisted. The on/off toggle
 * itself goes through normal storage so the user's choice survives
 * reload, but the events do not.
 */

import { useEffect, useRef, useState } from 'react';

import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import {
  clearTrustEvents,
  getTrustEvents,
  subscribe,
  type TrustEvent,
} from '../../lib/trust/receipt';
import { buildPrintableReceipt } from '../../lib/trust/printableReceipt';
import { getJSON, setJSON } from '../../lib/storage';

const STORAGE_KEY = 'trust-receipt-enabled';

function useTrustEvents(): readonly TrustEvent[] {
  const [events, setEvents] = useState<readonly TrustEvent[]>(() => getTrustEvents());
  useEffect(() => subscribe((e) => setEvents([...e])), []);
  return events;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function TypeBadge({ type }: { type: TrustEvent['type'] }) {
  const styles: Record<TrustEvent['type'], string> = {
    'storage-set':
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800',
    'storage-get':
      'bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-300 dark:border-neutral-700',
    fetch:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    cleartext:
      'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/40 dark:text-danger-300 dark:border-danger-800',
  };
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${styles[type]}`}
    >
      {type}
    </span>
  );
}

/* [R8-C-FIX Copilot] Render detail JSON safely:
 *   - Replacer drops non-serializable values (functions, symbols).
 *   - Object cycle detection short-circuits with "[circular]".
 * Combined with the recordStorageEvent contract that callers pass
 * only metadata (key, bytes, hit, ms), the panel can never crash
 * when a row is expanded. */
function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      value,
      (_key, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v as object)) return '[circular]';
          seen.add(v as object);
        }
        if (typeof v === 'function' || typeof v === 'symbol') return '[unserializable]';
        if (typeof v === 'bigint') return `${v.toString()}n`;
        return v;
      },
      2,
    );
  } catch {
    return '[unrenderable]';
  }
}

function EventRow({ event }: { event: TrustEvent }) {
  const [open, setOpen] = useState(false);
  const hasDetail = !!event.detail && Object.keys(event.detail).length > 0;
  /* [R8-C-FIX Copilot] When there's no detail to expand, render a
   * non-interactive <div> instead of a focusable <button> with a
   * no-op handler. Removes the button from tab order entirely. */
  const Header = hasDetail ? (
    <button
      type="button"
      className="flex w-full items-start gap-3 text-start"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
    >
      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-500">
        {formatTime(event.ts)}
      </span>
      <TypeBadge type={event.type} />
      <span className="min-w-0 flex-1 break-all font-mono text-xs text-neutral-700 dark:text-neutral-300">
        {event.summary}
      </span>
    </button>
  ) : (
    <div className="flex w-full items-start gap-3 text-start">
      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-500">
        {formatTime(event.ts)}
      </span>
      <TypeBadge type={event.type} />
      <span className="min-w-0 flex-1 break-all font-mono text-xs text-neutral-700 dark:text-neutral-300">
        {event.summary}
      </span>
    </div>
  );
  return (
    <li className="border-b border-neutral-200/60 py-2 last:border-b-0 dark:border-neutral-700/60">
      {Header}
      {hasDetail && open ? (
        <pre className="ms-12 mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-[11px] text-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
{safeStringify(event.detail)}
        </pre>
      ) : null}
    </li>
  );
}

export default function TrustReceipt() {
  const [enabled, setEnabled] = useState(false);
  const events = useTrustEvents();
  /* [R8-C-FIX] Codex review caught a hydration race: the async getJSON
   * resolution unconditionally called setEnabled after mount, so a
   * user toggle that fired before resolution would be clobbered when
   * the read landed. The ref tracks whether the user has interacted;
   * if they have, we drop the persisted value rather than overwrite
   * their intent. */
  const userInteractedRef = useRef(false);

  useEffect(() => {
    void getJSON<boolean>(STORAGE_KEY, false).then((v) => {
      if (!userInteractedRef.current) setEnabled(v);
    });
  }, []);

  const flip = (next: boolean) => {
    userInteractedRef.current = true;
    setEnabled(next);
    void setJSON(STORAGE_KEY, next);
  };

  /* [R15-4] Open the printable receipt in a new window via blob URL.
   * The user invokes the platform print dialog (Ctrl+P / Cmd+P) and
   * picks "Save as PDF" if they want an archival copy. We open it in
   * a new tab rather than try to auto-print — auto-print is brittle
   * cross-browser, and the user often wants to scroll through first. */
  const handlePrint = () => {
    const html = buildPrintableReceipt({
      events,
      generatedAt: Date.now(),
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup blocked; fall back to navigating current tab. Last
      // resort — usually the user's popup-blocker prompts and lets
      // them through on retry.
      window.location.href = url;
    }
    /* Don't revoke immediately — give the new window a few seconds
     * to fully load + render before we tear down the blob URL. */
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const reversed = enabled ? [...events].reverse() : [];

  return (
    <section className="card" aria-labelledby="trust-receipt-heading">
      <div className="card-header">
        <h2
          id="trust-receipt-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Trust receipt
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Live log of storage writes and outbound requests this session.
          In-memory only; cleared on reload. Browser DevTools remains
          authoritative — this surface is a convenience for verifying
          the app&rsquo;s own behavior without leaving Settings.
        </p>
      </div>
      <div className="card-content space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Toggle
            checked={enabled}
            onChange={flip}
            aria-label="Show trust receipt"
          >
            Show trust receipt
          </Toggle>
          {enabled ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                data-testid="trust-receipt-print"
              >
                Save / print
              </Button>
              <Button variant="ghost" size="sm" onClick={clearTrustEvents}>
                Clear log
              </Button>
            </div>
          ) : null}
        </div>

        {enabled ? (
          reversed.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              No events yet. Interact with the app — log a drink, open AI
              Insights, tap Sync — and they&rsquo;ll appear here.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
              {reversed.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )
        ) : null}
      </div>
    </section>
  );
}
