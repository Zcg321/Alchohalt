/**
 * [R16-2] User-installable crisis-line editor.
 *
 * Lets a user with a local-language hotline (or a local-market line
 * we don't ship in regions.ts) paste their own number. Stored in
 * settings.userCrisisLine and rendered FIRST in CrisisResources, above
 * the auto-detected regional pack.
 *
 * Voice: "If you have a local crisis line you trust, add it here."
 * The CTA is opt-in language — we're not asking them to verify a
 * provided line, we're handing them a slot if they have one.
 *
 * Validation:
 *   - phone: trimmed to non-empty (we don't validate format because
 *     local conventions vary wildly — Estonia uses 116 006, Japan
 *     uses 81-50-5577-5489, etc. The user knows their own number).
 *   - label: trimmed to non-empty.
 *   - description: optional.
 *
 * No external lookup. No cloud sync of the entry separate from the
 * normal data flow. Cleared by setting userCrisisLine: undefined.
 */
import React, { useState } from 'react';
import { useDB } from '../../store/db';

interface Props {
  className?: string;
}

const INPUT_CLASSES =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-sage-500';

export default function UserCrisisLineEditor({ className = '' }: Props) {
  const userCrisisLine = useDB((s) => s.db.settings.userCrisisLine);
  const setSettings = useDB((s) => s.setSettings);

  const [label, setLabel] = useState(userCrisisLine?.label ?? '');
  const [phone, setPhone] = useState(userCrisisLine?.phone ?? '');
  const [description, setDescription] = useState(userCrisisLine?.description ?? '');

  const trimmedLabel = label.trim();
  const trimmedPhone = phone.trim();
  const trimmedDescription = description.trim();
  const canSave = trimmedLabel.length > 0 && trimmedPhone.length > 0;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSettings({
      userCrisisLine: {
        label: trimmedLabel,
        phone: trimmedPhone,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      },
    });
  }

  function handleClear() {
    setSettings({ userCrisisLine: undefined });
    setLabel('');
    setPhone('');
    setDescription('');
  }

  const isSaved =
    !!userCrisisLine &&
    userCrisisLine.label === trimmedLabel &&
    userCrisisLine.phone === trimmedPhone &&
    (userCrisisLine.description ?? '') === trimmedDescription;

  return (
    <section
      data-testid="user-crisis-line-editor"
      className={`rounded-2xl border border-border-soft bg-surface-elevated p-card space-y-3 ${className}`}
      aria-labelledby="user-crisis-line-heading"
    >
      <header>
        <h3 id="user-crisis-line-heading" className="text-h4 text-ink">
          Add your own crisis line
        </h3>
        <p className="mt-1 text-caption text-ink-soft">
          If you have a local crisis line you trust, add it here. It will
          show first in the Crisis tab, above the regional list. Stays on
          your device.
        </p>
      </header>
      <form onSubmit={handleSave} className="space-y-3">
        <label className="block">
          <span className="block text-caption text-ink-soft mb-1">Name</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Lifeline (Australia)"
            data-testid="user-crisis-line-label"
            className={INPUT_CLASSES}
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className="block text-caption text-ink-soft mb-1">Phone number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 13 11 14"
            data-testid="user-crisis-line-phone"
            className={INPUT_CLASSES}
            maxLength={40}
          />
        </label>
        <label className="block">
          <span className="block text-caption text-ink-soft mb-1">
            Description (optional)
          </span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this line is for"
            data-testid="user-crisis-line-description"
            className={INPUT_CLASSES}
            maxLength={140}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSave}
            data-testid="user-crisis-line-save"
            className="rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sage-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {userCrisisLine ? 'Update' : 'Save'}
          </button>
          {userCrisisLine ? (
            <button
              type="button"
              onClick={handleClear}
              data-testid="user-crisis-line-clear"
              className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
            >
              Remove
            </button>
          ) : null}
          {isSaved ? (
            <span className="text-caption text-ink-subtle" data-testid="user-crisis-line-saved-marker">
              Saved.
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
