import type { Workout } from '../engine';
import { openDb, STORES } from './db';

// Minimal IndexedDB persistence for saved workout templates. Local-first, no
// external APIs — see CLAUDE.md.

/** Save (or overwrite) a workout template under its own `id`. */
export async function saveTemplate(workout: Workout): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.templates, 'readwrite');
    tx.objectStore(STORES.templates).put(workout);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** List all saved workout templates. */
export async function listTemplates(): Promise<Workout[]> {
  const db = await openDb();
  const result = await new Promise<Workout[]>((resolve, reject) => {
    const tx = db.transaction(STORES.templates, 'readonly');
    const req = tx.objectStore(STORES.templates).getAll();
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
    const tx = db.transaction(STORES.templates, 'readwrite');
    tx.objectStore(STORES.templates).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
