// Shared IndexedDB connection for local-first persistence (workouts, profile).
// See CLAUDE.md: local-first, no external APIs.

const DB_NAME = 'gymsync';
const DB_VERSION = 2;

export const STORES = {
  templates: 'templates',
  profile: 'profile',
} as const;

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.templates)) {
        db.createObjectStore(STORES.templates, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.profile)) {
        db.createObjectStore(STORES.profile, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
