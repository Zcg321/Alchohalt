import React, { useState } from 'react';
import { useDB } from '../../store/db';
import type { Theme, Language } from '../../store/db';
import { resyncNotifications } from '../../lib/notify';
import DevTools from './DevTools';
import ExportImport from '../drinks/ExportImport';
import About from './About';

export default function SettingsPanel() {
  const { settings, setTheme, setLanguage, setReminderTimes, setRemindersEnabled } = useDB(s => ({
    settings: s.db.settings, setTheme: s.setTheme, setLanguage: s.setLanguage,
    setReminderTimes: s.setReminderTimes, setRemindersEnabled: s.setRemindersEnabled
  }));
  const [time, setTime] = useState('20:00');
  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    const t = Array.from(new Set([...(settings.reminders.times||[]), time])).sort();
    setReminderTimes(t); resyncNotifications();
  };
  const remove = (t:string) => { setReminderTimes((settings.reminders.times||[]).filter(x=>x!==t)); };

  return (
    <div className="space-y-6">
      <section className="p-4 border rounded-2xl">
        <h2 className="font-semibold mb-2">Appearance</h2>
        <div className="flex gap-2">
          <select aria-label="Theme" value={settings.theme} onChange={e=>setTheme(e.target.value as Theme)} className="border rounded px-2 py-1">
            <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
          <select aria-label="Language" value={settings.language} onChange={e=>setLanguage(e.target.value as Language)} className="border rounded px-2 py-1">
            <option value="en">English</option><option value="es">Español</option>
          </select>
        </div>
      </section>

      <section className="p-4 border rounded-2xl">
        <h2 className="font-semibold mb-2">Reminders</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.reminders.enabled} onChange={e=>setRemindersEnabled(e.target.checked)} />
          <span>Enable daily reminders</span>
        </label>
        <div className="mt-3 flex items-center gap-2">
          <input aria-label="Reminder time (HH:mm)" type="time" value={time} onChange={e=>setTime(e.target.value)} className="border rounded px-2 py-1"/>
          <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={add}>Add time</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(settings.reminders.times||[]).map(t=>(
            <span key={t} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border">
              {t}
              <button aria-label={`Remove ${t}`} className="opacity-70 hover:opacity-100" onClick={()=>remove(t)}>×</button>
            </span>
          ))}
        </div>
        </section>

        <section className="p-4 border rounded-2xl">
          <h2 className="font-semibold mb-2">Data</h2>
          <ExportImport />
        </section>

        <About />
        <DevTools />
      </div>
    );
  }
