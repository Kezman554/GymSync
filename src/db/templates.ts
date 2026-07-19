import type { Workout } from '../engine';

// Minimal IndexedDB persistence for saved workout templates. Local-first, no
// external APIs — see CLAUDE.md.

const DB_NAME = 'gymsync';
const DB_VERSION = 1;
const STORE = 'templates';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save (or overwrite) a workout template under its own `id`. */
export async function saveTemplate(workout: Workout): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(workout);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** List all saved workout templates. */
export async function listTemplates(): Promise<Workout[]> {
  const db = await openDb();
  const result = await new Promise<Workout[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as Workout[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

/** Delete a saved template by id. */
export async function deleteTemplate(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
