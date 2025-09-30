import React, { useEffect } from 'react';
import { useTheme } from '../../services/theme';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n';

export function ThemeToggle() {
  const { theme, setTheme, currentTheme, systemTheme, supportsHighContrast } = useTheme();
  const { t } = useLanguage();

  // Apply theme on component mount and changes
  useEffect(() => {
    // The theme service handles application automatically
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  }

  const getLabel = () => {
    switch (theme) {
      case 'light': return t('darkMode');
      case 'dark': return t('systemMode'); 
      case 'system': return t('lightMode');
      default: return t('toggleTheme');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '🖥️';
      default: return '🎨';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button 
          variant="secondary" 
          onClick={toggle} 
          aria-label={t('toggleTheme')}
          className="gap-2"
        >
          <span>{getIcon()}</span>
          {getLabel()}
        </Button>
        
        {supportsHighContrast && (
          <div className="text-xs text-warning-600 font-medium">
            High Contrast
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted">
        Current: {theme === 'system' ? `System (${systemTheme})` : theme}
        {currentTheme.reducedMotion && ' • Reduced Motion'}
      </div>
    </div>
  );
}
