import { useEffect, useState } from 'react';
import { getJSON, setJSON } from '../../lib/storage';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { t } = useLanguage();

  useEffect(() => {
    getJSON<'light' | 'dark'>('theme', 'light').then((t) => {
      setTheme(t);
      document.documentElement.classList.toggle('dark', t === 'dark');
    });
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    setJSON('theme', next);
  }

  return (
    <Button variant="secondary" onClick={toggle} aria-label={t('toggleDark')}>
      {theme === 'dark' ? t('lightMode') : t('darkMode')}
    </Button>
  );
}
