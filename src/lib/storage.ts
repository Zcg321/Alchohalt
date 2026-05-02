import { getPreferences } from "@/shared/capacitor";
import { recordStorageEvent } from "./trust/receipt";

export async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  const { value } = await (await getPreferences()).get({ key });
  recordStorageEvent('get', key, { hit: value != null });
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  recordStorageEvent('set', key, { bytes: serialized.length });
  await (await getPreferences()).set({ key, value: serialized });
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
