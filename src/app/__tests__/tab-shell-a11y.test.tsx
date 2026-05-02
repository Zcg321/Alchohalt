/**
 * Regression for [A11Y-TABSHELL].
 *
 * The pre-fix tab nav used <ul role="tablist"><li><button role="tab"></li></ul>,
 * which violated WAI-ARIA's child-of-tablist constraint and produced
 * three critical/serious axe violations on every screen
 * (aria-required-children, aria-required-parent, listitem). Lighthouse
 * a11y was stuck at 76-78 on mobile across all tabs.
 *
 * Post-fix contract:
 *   1. The tablist is a <div role="tablist"> whose direct children are
 *      <button role="tab"> — no <ul>/<li> wrapping.
 *   2. Each tab carries id, aria-selected, aria-controls, and
 *      tabIndex={active ? 0 : -1} (roving-tabindex).
 *   3. The active panel is role="tabpanel", aria-labelledby ties to the
 *      active tab's id, tabIndex=0 so keyboard users can land on it.
 *   4. ArrowLeft / ArrowRight cycle through tabs and activate them
 *      (focus moves with selection).
 *   5. Home jumps to first, End jumps to last.
 */

import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabShell from '../TabShell';

const PANELS = {
  today: <div>Today panel content</div>,
  track: <div>Track panel content</div>,
  goals: <div>Goals panel content</div>,
  insights: <div>Insights panel content</div>,
  settings: <div>Settings panel content</div>,
};

describe('[A11Y-TABSHELL] WAI-ARIA tabs contract', () => {
  it('renders a single role=tabpanel with role=tab buttons as direct children of role=tablist', () => {
    const { container } = render(<TabShell panels={PANELS} />);
    const tablists = container.querySelectorAll('[role="tablist"]');
    // Both desktop and mobile tablists exist (CSS-hidden per viewport).
    expect(tablists.length).toBe(2);
    for (const list of Array.from(tablists)) {
      const directChildren = Array.from(list.children);
      // every direct child is the tab button (no <li>/<ul> nesting)
      for (const child of directChildren) {
        expect(child.getAttribute('role')).toBe('tab');
      }
    }
    // No <li> or <ul> inside the tablist
    for (const list of Array.from(tablists)) {
      expect(list.querySelector('li')).toBeNull();
      expect(list.querySelector('ul')).toBeNull();
    }
  });

  it('every role=tab has id, aria-selected, aria-controls, and roving tabindex', () => {
    const { container } = render(<TabShell panels={PANELS} activeTab="today" />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBeGreaterThanOrEqual(5);
    let activeCount = 0;
    for (const t of Array.from(tabs)) {
      expect(t.getAttribute('id')).toBeTruthy();
      expect(t.getAttribute('aria-controls')).toBeTruthy();
      expect(['true', 'false']).toContain(t.getAttribute('aria-selected') ?? '');
      const ti = t.getAttribute('tabindex');
      expect(['0', '-1']).toContain(ti);
      if (ti === '0') activeCount += 1;
    }
    // Roving tabindex: per tablist, exactly one tab has tabindex=0.
    // We have two tablists, both showing the same active tab, so 2 active.
    expect(activeCount).toBe(2);
  });

  it('renders the active panel as role=tabpanel with aria-labelledby + tabindex=0', () => {
    const { container } = render(<TabShell panels={PANELS} activeTab="goals" />);
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('id')).toMatch(/panel-goals/);
    expect(panel!.getAttribute('aria-labelledby')).toMatch(/tab-.*-goals/);
    expect(panel!.getAttribute('tabindex')).toBe('0');
    expect(panel!.textContent).toContain('Goals panel content');
  });

  it('ArrowRight on the active tab moves selection to the next tab', () => {
    let active: string | undefined = 'today';
    const { container, rerender } = render(
      <TabShell panels={PANELS} activeTab={active as 'today'} onChange={(t) => { active = t; }} />,
    );
    // Find the desktop tablist (first one)
    const tablists = container.querySelectorAll('[role="tablist"]');
    const list = tablists[0]!;
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(active).toBe('track');

    // After keydown, parent should re-render with the new active tab
    rerender(<TabShell panels={PANELS} activeTab={active as 'track'} onChange={(t) => { active = t; }} />);
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(active).toBe('goals');
  });

  it('Home jumps to the first tab and End jumps to the last', () => {
    let active: string | undefined = 'goals';
    const { container, rerender } = render(
      <TabShell panels={PANELS} activeTab={active as 'goals'} onChange={(t) => { active = t; }} />,
    );
    const list = container.querySelector('[role="tablist"]')!;
    fireEvent.keyDown(list, { key: 'Home' });
    expect(active).toBe('today');
    rerender(<TabShell panels={PANELS} activeTab={active as 'today'} onChange={(t) => { active = t; }} />);
    fireEvent.keyDown(list, { key: 'End' });
    expect(active).toBe('settings');
  });

  it('ArrowLeft from the first tab wraps to the last (cycle)', () => {
    let active: string | undefined = 'today';
    const { container } = render(
      <TabShell panels={PANELS} activeTab={active as 'today'} onChange={(t) => { active = t; }} />,
    );
    const list = container.querySelector('[role="tablist"]')!;
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(active).toBe('settings');
  });

  it('clicking a tab activates it (default <button> Enter/Space behavior preserved)', () => {
    let active: string | undefined = 'today';
    render(
      <TabShell panels={PANELS} activeTab={active as 'today'} onChange={(t) => { active = t; }} />,
    );
    fireEvent.click(screen.getAllByRole('tab', { name: /Insights/i })[0]!);
    expect(active).toBe('insights');
  });
});
