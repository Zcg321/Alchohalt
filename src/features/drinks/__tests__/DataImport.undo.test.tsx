/**
 * [R27-D] DataImport — undo flow tests.
 *
 * R10 added the foreign-tracker importer; R26-4 ex-Reframe/ex-Sunnyside
 * user audit found that mismatched mappings produced "wrong shape"
 * entries that were tedious to clean up (one-by-one delete). R27-D
 * adds an Undo button on the post-commit Done step that removes only
 * the entries from the most recent import, by ID.
 *
 * Pins:
 *   - Done step shows "Imported N entries" + an Undo button after commit.
 *   - Clicking Undo removes the imported entries from db.entries.
 *   - The done message switches to "Removed N imported entries".
 *   - Undo button hides after a successful undo (no double-undo).
 *   - Undo only touches the imported IDs — pre-existing entries stay.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DataImport from '../DataImport';
import { useDB } from '../../../store/db';
import { __resetPreferencesCacheForTests } from '../../../shared/capacitor';
import { nanoid } from 'nanoid';

const CSV =
  'date,drinks,type,notes,tags\n' +
  '2026-01-10,1,beer,with friends,social\n' +
  '2026-01-11,1,wine,dinner,home|relaxed\n';

beforeEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
  // Pre-populate one entry so we can confirm undo only touches the
  // imported set.
  const seed = {
    id: nanoid(),
    ts: Date.now(),
    kind: 'beer' as const,
    stdDrinks: 1,
    intention: 'other' as const,
    craving: 0,
    halt: { H: false, A: false, L: false, T: false },
  };
  useDB.setState({
    db: {
      ...useDB.getState().db,
      entries: [seed],
    },
  });
});

afterEach(() => {
  __resetPreferencesCacheForTests();
  if (typeof window !== 'undefined') window.localStorage.clear();
});

async function pickFile() {
  // jsdom's File.text() works but is microtask-deferred; build a File
  // whose text() resolves synchronously by overriding the prototype.
  const file = new File([CSV], 'import.csv', { type: 'text/csv' });
  // Some jsdom versions don't implement File.prototype.text reliably
  // in all environments; override defensively.
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(CSV) });
  const input = screen.getByTestId('data-import-file') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
  await waitFor(
    () => {
      if (!screen.queryByTestId('data-import-preview')) {
        throw new Error('not ready');
      }
    },
    { timeout: 3000 },
  );
}

describe('DataImport — Undo flow [R27-D]', () => {
  it('Undo removes only the imported entries', async () => {
    render(<DataImport />);
    await pickFile();
    fireEvent.click(screen.getByTestId('data-import-preview'));
    fireEvent.click(screen.getByTestId('data-import-commit'));

    const before = useDB.getState().db.entries.length;
    expect(before).toBe(3); // 1 seed + 2 imported

    fireEvent.click(screen.getByTestId('data-import-undo'));
    const after = useDB.getState().db.entries.length;
    expect(after).toBe(1); // seed survived
  });

  it('Done message switches to Removed N imported after undo', async () => {
    render(<DataImport />);
    await pickFile();
    fireEvent.click(screen.getByTestId('data-import-preview'));
    fireEvent.click(screen.getByTestId('data-import-commit'));

    expect(screen.getByTestId('data-import-done-summary').textContent).toMatch(/Imported/);
    fireEvent.click(screen.getByTestId('data-import-undo'));
    expect(screen.getByTestId('data-import-done-summary').textContent).toMatch(/Removed/);
  });

  it('Undo button hides after a successful undo', async () => {
    render(<DataImport />);
    await pickFile();
    fireEvent.click(screen.getByTestId('data-import-preview'));
    fireEvent.click(screen.getByTestId('data-import-commit'));

    expect(screen.queryByTestId('data-import-undo')).toBeTruthy();
    fireEvent.click(screen.getByTestId('data-import-undo'));
    expect(screen.queryByTestId('data-import-undo')).toBeNull();
  });

  it('imports tags from the tags column onto entries', async () => {
    render(<DataImport />);
    await pickFile();
    fireEvent.click(screen.getByTestId('data-import-preview'));
    fireEvent.click(screen.getByTestId('data-import-commit'));

    const entries = useDB.getState().db.entries;
    const imported = entries.filter((e) => e.tags && e.tags.length > 0);
    expect(imported.length).toBeGreaterThan(0);
    // First imported row had tag "social"; second had "home" and "relaxed".
    const allTags = new Set(imported.flatMap((e) => e.tags ?? []));
    expect(allTags.has('social')).toBe(true);
    expect(allTags.has('home')).toBe(true);
    expect(allTags.has('relaxed')).toBe(true);
  });
});
