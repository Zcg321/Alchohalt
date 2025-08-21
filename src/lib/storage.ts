import { Preferences } from '@capacitor/preferences';

export async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
export function setJSONDebounced(key: string, value: unknown, delay = 300) {
  const t = timers.get(key);
  if (t) clearTimeout(t);
  const handle = setTimeout(() => {
    setJSON(key, value);
    timers.delete(key);
  }, delay);
  timers.set(key, handle);
}

export async function getVersioned<T>(
  key: string,
  version: number,
  migrate: (data: unknown) => T
): Promise<T> {
  const { value } = await Preferences.get({ key });
  if (!value) return migrate(undefined);
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && parsed.__v === version) {
      return parsed.data as T;
    }
    return migrate(parsed);
  } catch {
    return migrate(undefined);
  }
}

export async function setVersioned(
  key: string,
  version: number,
  data: unknown
): Promise<void> {
  await setJSON(key, { __v: version, data });
}

export function setVersionedDebounced(
  key: string,
  version: number,
  data: unknown,
  delay = 300
) {
  setJSONDebounced(key, { __v: version, data }, delay);
}
