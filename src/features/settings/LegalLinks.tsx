import React from 'react';

export default function LegalLinks(){
  return (
    <section className="card">
      <div className="card-content">
        <h2 className="text-base font-semibold tracking-tight mb-3">Legal</h2>
        <ul className="space-y-1.5 text-sm">
          <li><a className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300" href="/docs/legal/PRIVACY_POLICY.md" target="_blank" rel="noreferrer">Privacy Policy</a></li>
          <li><a className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300" href="/docs/legal/CONSUMER_HEALTH_DATA_POLICY.md" target="_blank" rel="noreferrer">Consumer Health Data Privacy Policy (WA / NV / CO / CT)</a></li>
          <li><a className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300" href="/docs/legal/TERMS_OF_SERVICE.md" target="_blank" rel="noreferrer">Terms of Service</a></li>
          <li><a className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300" href="/docs/legal/EULA.md" target="_blank" rel="noreferrer">End User License Agreement</a></li>
          <li><a className="underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300" href="/docs/legal/SUBSCRIPTION_TERMS.md" target="_blank" rel="noreferrer">Subscription Terms</a></li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
          Your logs stay on your device by default. Opt-in AI features can change this — see Settings → AI. Not medical advice.
        </p>
      </div>
    </section>
  );
}