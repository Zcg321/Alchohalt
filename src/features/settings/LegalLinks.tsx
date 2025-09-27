import React from 'react';

export default function LegalLinks(){
  return (
    <section className="p-4 mt-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Legal</h2>
      <ul className="list-disc pl-5 text-sm">
        <li><a className="underline" href="/docs/PRIVACY.md" target="_blank" rel="noreferrer">Privacy</a></li>
        <li><a className="underline" href="/docs/TERMS.md" target="_blank" rel="noreferrer">Terms</a></li>
        <li><a className="underline" href="/docs/SECURITY.md" target="_blank" rel="noreferrer">Security</a></li>
      </ul>
      <p className="text-xs opacity-60 mt-2">Alchohalt keeps data on-device and provides no medical advice.</p>
    </section>
  );
}
