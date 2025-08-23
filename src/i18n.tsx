import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { getJSON, setJSON } from './lib/storage';

export type Lang = 'en' | 'es';

type Dictionary = Record<string, string>;

export const dictionaries: Record<Lang, Dictionary> = {
  en: {
    appName: 'alchohalt',
    settings: 'Settings',
    language: 'Language',
    clearAllData: 'Clear all data',
    eraseConfirm: 'Erase all saved data? This cannot be undone.',
    dataCleared: 'Data cleared',
    totalStdDrinks: 'Total standard drinks',
    disclaimer: 'All data stays on this device. This app offers no medical advice.',
    export: 'Export',
    import: 'Import',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    noDrinks: 'No drinks logged yet.',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this entry?',
    drinkDeleted: 'Drink deleted',
    undo: 'Undo',
    volume: 'Volume ml',
    abv: 'ABV %',
    intentionLabel: 'Intention',
    cravingLabel: 'Craving',
    haltLabel: 'HALT',
    alternative: 'Alternative action',
    intention_celebrate: 'celebrate',
    intention_social: 'social',
    intention_taste: 'taste',
    intention_bored: 'bored',
    intention_cope: 'cope',
    halt_hungry: 'hungry',
    halt_angry: 'angry',
    halt_lonely: 'lonely',
    halt_tired: 'tired',
    toggleDark: 'Toggle dark mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    enableReminders: 'Enable check-in reminders',
    disableReminders: 'Disable check-in reminders',
    'goals.title': 'Goals',
    'goals.daily': 'Daily goal',
    'goals.weekly': 'Weekly goal',
    'goals.progress.today': 'Today Progress',
    'goals.progress.week': 'Week Progress',
    'goals.points': 'Points',
    'goals.afStreak': 'AF Streak',
    'goals.longestStreak': 'Longest AF Streak',
    'history.title': 'History',
    'history.date': 'Date',
    'history.kind': 'Type',
    'history.intention': 'Intention',
    'history.craving': 'Craving',
    'history.halt': 'HALT',
    'history.stdDrinks': 'Std drinks',
    'history.cost': 'Cost',
    'history.actions': 'Actions',
    'history.edit': 'Edit',
    'history.delete': 'Delete',
    'history.undo': 'Undo',
    'history.deleted': 'Entry deleted',
    'toast.undo': 'Undo',
    'reminder.prompt': 'Reminder: log your day?',
    'reminder.log': 'Log now',
  },
  es: {
    appName: 'alchohalt',
    settings: 'Configuración',
    language: 'Idioma',
    clearAllData: 'Borrar todos los datos',
    eraseConfirm: '¿Borrar todos los datos? Esta acción no se puede deshacer.',
    dataCleared: 'Datos borrados',
    totalStdDrinks: 'Total de bebidas estándar',
    disclaimer: 'Todos los datos permanecen en este dispositivo. Esta aplicación no ofrece consejo médico.',
    export: 'Exportar',
    import: 'Importar',
    add: 'Agregar',
    save: 'Guardar',
    cancel: 'Cancelar',
    noDrinks: 'No hay bebidas registradas todavía.',
    edit: 'Editar',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta entrada?',
    drinkDeleted: 'Bebida eliminada',
    undo: 'Deshacer',
    volume: 'Volumen ml',
    abv: '% de alcohol',
    intentionLabel: 'Intención',
    cravingLabel: 'Ansia',
    haltLabel: 'HALT',
    alternative: 'Acción alternativa',
    intention_celebrate: 'celebrar',
    intention_social: 'social',
    intention_taste: 'degustar',
    intention_bored: 'aburrimiento',
    intention_cope: 'afrontar',
    halt_hungry: 'hambriento',
    halt_angry: 'enojado',
    halt_lonely: 'solo',
    halt_tired: 'cansado',
    toggleDark: 'Cambiar modo oscuro',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    enableReminders: 'Activar recordatorios',
    disableReminders: 'Desactivar recordatorios',
    'goals.title': 'Metas',
    'goals.daily': 'Meta diaria',
    'goals.weekly': 'Meta semanal',
    'goals.progress.today': 'Progreso de hoy',
    'goals.progress.week': 'Progreso semanal',
    'goals.points': 'Puntos',
    'goals.afStreak': 'Racha AF',
    'goals.longestStreak': 'Racha AF más larga',
    'history.title': 'Historial',
    'history.date': 'Fecha',
    'history.kind': 'Tipo',
    'history.intention': 'Intención',
    'history.craving': 'Deseo',
    'history.halt': 'HALT',
    'history.stdDrinks': 'Bebidas est.',
    'history.cost': 'Costo',
    'history.actions': 'Acciones',
    'history.edit': 'Editar',
    'history.delete': 'Eliminar',
    'history.undo': 'Deshacer',
    'history.deleted': 'Entrada eliminada',
    'toast.undo': 'Deshacer',
    'reminder.prompt': '¿Registrar tu día?',
    'reminder.log': 'Registrar ahora',
  },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export async function loadInitialLang(): Promise<Lang> {
  const stored = await getJSON<Lang | null>('lang', null);
  if (stored === 'en' || stored === 'es') return stored;
  const nav =
    typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
  return nav === 'es' ? 'es' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    loadInitialLang().then(setLangState);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    setJSON('lang', l);
  }

  const t = (key: string) => dictionaries[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
