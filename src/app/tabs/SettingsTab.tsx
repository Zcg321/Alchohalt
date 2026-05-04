/**
 * Settings tab — Account, Notifications, Privacy & Data, AI consent,
 * Plan & Billing, Crisis Resources, Legal, About.
 *
 * Sprint 2A `[IA-2]`. The existing SettingsPanel already houses most
 * of these sections; this tab surfaces it inline plus a top-level
 * "Crisis Resources" entry per spec.
 */
import React from 'react';
import SettingsPanel from '../../features/settings/SettingsPanel';

interface Props {
  onOpenCrisis: () => void;
}

export default function SettingsTab({ onOpenCrisis }: Props) {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-section-y-mobile lg:py-section-y-desktop space-y-6">
      <header className="text-center">
        <h2 className="text-h2 text-ink">Settings</h2>
      </header>

      {/* Crisis Resources surfaces here as a top-level item per spec. */}
      <button
        type="button"
        onClick={onOpenCrisis}
        className="w-full text-start rounded-2xl border border-indigo-100 bg-indigo-50 px-card py-card hover:bg-indigo-100 hover:border-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-h3 text-indigo-700">Crisis Resources</p>
            <p className="mt-1 text-caption text-indigo-700/80">
              {/* [R25-C] Header pill now opens the urgent right-now panel; this
                  link surfaces the full region-aware directory directly. */}
              24/7 support lines, full directory. The header pill opens &ldquo;right now&rdquo; support; tap &ldquo;More crisis resources&rdquo; there for this full list.
            </p>
          </div>
          <span aria-hidden className="text-indigo-700">{'>'}</span>
        </div>
      </button>

      <SettingsPanel />
    </main>
  );
}
