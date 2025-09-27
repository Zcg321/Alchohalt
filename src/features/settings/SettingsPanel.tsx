import React, { useState } from 'react';
import { useDB } from '../../store/db';
import type { Theme, Language } from '../../store/db';
import { resyncNotifications } from '../../lib/notify';
import { Button } from '../../components/ui/Button';
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
      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
            Appearance
          </h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label">Theme</label>
              <select 
                aria-label="Theme" 
                value={settings.theme} 
                onChange={e=>setTheme(e.target.value as Theme)} 
                className="input cursor-pointer"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="label">Language</label>
              <select 
                aria-label="Language" 
                value={settings.language} 
                onChange={e=>setLanguage(e.target.value as Language)} 
                className="input cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
            Reminders
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Set up daily check-in notifications
          </p>
        </div>
        <div className="card-content space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.reminders.enabled} 
              onChange={e=>setRemindersEnabled(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <span className="text-sm font-medium">Enable daily reminders</span>
          </label>
          
          <div className="flex items-center gap-3">
            <input 
              aria-label="Reminder time (HH:mm)" 
              type="time" 
              value={time} 
              onChange={e=>setTime(e.target.value)} 
              className="input flex-1"
            />
            <Button onClick={add} size="sm">
              Add time
            </Button>
          </div>
          
          {(settings.reminders.times||[]).length > 0 && (
            <div className="space-y-2">
              <label className="label">Active reminder times</label>
              <div className="flex flex-wrap gap-2">
                {(settings.reminders.times||[]).map(t=>(
                  <span key={t} className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-200 dark:bg-primary-900/50 dark:text-primary-300 dark:border-primary-800">
                    {t}
                    <button 
                      aria-label={`Remove ${t}`} 
                      className="ml-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200 transition-colors" 
                      onClick={()=>remove(t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold flex items-center">
            <span className="w-2 h-2 bg-danger-500 rounded-full mr-3"></span>
            Data Management
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            All data stays on this device. Export for backup. Not medical advice.
          </p>
        </div>
        <div className="card-content">
          <ExportImport />
        </div>
      </section>

      <About />
      <DevTools />
    </div>
  );
}
