import React from 'react';
import pkg from '../../../package.json' assert { type: 'json' };

export default function About() {
  return (
    <section className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">About</h2>
      <p className="text-sm opacity-80">Alchohalt keeps all data on this device. It offers no medical advice.</p>
      <p className="text-xs opacity-60 mt-2">Version {pkg.version}</p>
    </section>
  );
}
