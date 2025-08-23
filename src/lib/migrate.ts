import type { DB } from '../store/db';

export function migrateDB(
  persisted: DB | undefined,
  from: number | undefined,
  to: number
): DB | undefined {
  if (!persisted) return undefined;
  const db: DB = { ...persisted };
  if ((from ?? 0) < 1) {
    db.version = 1;
    if (db.settings) db.settings.version = 1;
  }
  db.version = to;
  if (db.settings) db.settings.version = to;
  return db;
}
