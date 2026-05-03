/**
 * [R14-3] Free-form tag input. User types comma-separated tags; we
 * normalize, dedupe, and surface them as chips with a remove
 * affordance. Pressing comma OR Enter commits the buffered text.
 *
 * Design notes:
 *   - Tags are stored lowercase + trimmed + de-#ed (so "#Stressed"
 *     and "stressed" collapse to one). Normalization runs on commit,
 *     not on every keystroke — typing in mixed-case stays natural.
 *   - Removing a tag is a single tap on the chip ×; no bulk-delete.
 *   - Voice: matter-of-fact, no nudging copy.
 */
import React, { useState } from 'react';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { parseTags, normalizeTag } from './lib';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function TagsInput({ value, onChange }: Props) {
  const [buffer, setBuffer] = useState('');

  const commit = (raw: string) => {
    const parsed = parseTags(raw);
    if (parsed.length === 0) return;
    const set = new Set(value);
    for (const t of parsed) set.add(t);
    onChange(Array.from(set));
    setBuffer('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(buffer);
    } else if (e.key === 'Backspace' && buffer === '' && value.length > 0) {
      // Backspace on empty input pops the last tag, like a typical chip
      // input. Keeps fast keyboard editing for power users.
      onChange(value.slice(0, -1));
    }
  };

  const onBlur = () => {
    if (buffer.trim()) commit(buffer);
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2" data-testid="tags-input">
      <Label htmlFor="drink-tags">Tags</Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" data-testid="tags-input-chips">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-pill bg-cream-100 px-3 py-1 text-caption text-ink">
                #{tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => remove(tag)}
                  data-testid={`tags-input-remove-${tag}`}
                  className="ms-1 rounded-full text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Input
        id="drink-tags"
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder="Add tag (comma or Enter to commit)"
        autoComplete="off"
      />
      {/*
        Hidden helper for screen readers — the placeholder alone
        doesn't fully describe the commit gesture. */}
      <span className="sr-only">
        Tags are normalized to lowercase. Press Backspace on empty input to remove the last tag.
      </span>
      {/* Tiny normalize hint surfaces what we'll save (helps users
          notice the lowercase coercion before they commit). */}
      {buffer.trim() && normalizeTag(buffer) !== buffer.trim() && (
        <span className="block text-micro text-ink-subtle">
          Will save as: #{normalizeTag(buffer)}
        </span>
      )}
    </div>
  );
}
