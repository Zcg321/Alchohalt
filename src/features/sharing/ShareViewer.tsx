import React from 'react';
import { decodePayload } from './sharePayload';

/**
 * [R10-3] Read-only view of a shared payload. Renders at /share with
 * the encoded payload in the URL fragment (#p=<base64url>). Reads the
 * fragment, decodes, and renders. If expired or malformed, shows a
 * polite "this link is no longer available" message.
 *
 * Intentional: no fetch, no API call. The fragment is everything.
 * The visiting browser doesn't need any state from the user's
 * device. The recipient can be on a different device, OS, browser.
 */
export default function ShareViewer() {
  const fragment = typeof window !== 'undefined' ? window.location.hash : '';
  const match = fragment.match(/^#p=(.+)$/);
  const encoded = match?.[1];

  if (!encoded) {
    return <Empty title="Nothing to show" body="This link doesn't carry a shared summary." />;
  }

  const result = decodePayload(encoded);
  if (!result.ok) {
    return <Empty title="Link is invalid" body="The data couldn't be read." />;
  }
  if (result.expired) {
    return <Empty title="Link has expired" body="Shared links last 24 hours. Ask for a fresh one." />;
  }

  const { payload } = result;
  const expiresIn = Math.max(0, payload.exp - Date.now());
  const hours = Math.floor(expiresIn / 3600000);
  const minutes = Math.floor((expiresIn % 3600000) / 60000);

  return (
    <main className="min-h-screen bg-surface text-ink p-6 max-w-xl mx-auto">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-ink-soft">Read-only summary</p>
        <h1 className="text-2xl font-semibold mt-1">Shared from Alchohalt</h1>
        <p className="text-xs text-ink-soft mt-2">
          Expires in {hours}h {minutes}m. The data is in this URL, not on a server.
        </p>
      </header>

      {payload.message && (
        <section className="mb-6 p-4 rounded-md bg-current/5 border border-current/10">
          <p className="text-sm whitespace-pre-line">{payload.message}</p>
        </section>
      )}

      <dl className="space-y-3">
        {payload.data.currentStreak !== undefined && (
          <Row label="Current alcohol-free streak" value={`${payload.data.currentStreak} days`} />
        )}
        {payload.data.totalAfDays !== undefined && (
          <Row label="Total alcohol-free days" value={`${payload.data.totalAfDays}`} />
        )}
        {payload.data.weeklyGoal !== undefined && (
          <Row label="Weekly drink goal" value={`${payload.data.weeklyGoal} drinks`} />
        )}
        {payload.data.last30dTotal !== undefined && (
          <Row label="Last 30 days — total drinks" value={`${payload.data.last30dTotal}`} />
        )}
        {payload.data.activeGoalSummary && (
          <Row
            label={`Active goal: ${payload.data.activeGoalSummary.title}`}
            value={`${payload.data.activeGoalSummary.current} / ${payload.data.activeGoalSummary.target}`}
          />
        )}
      </dl>

      <footer className="mt-8 text-xs text-ink-soft border-t border-current/10 pt-4">
        <p>This is a one-way snapshot — it can&rsquo;t message back, request more, or be shared further.</p>
      </footer>
    </main>
  );
}

interface RowProps {
  label: string;
  value: string;
}
function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-current/10 pb-2">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-surface text-ink p-6 flex items-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-ink-soft">{body}</p>
      </div>
    </main>
  );
}
