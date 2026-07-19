import { openDb, STORES } from './db';

/** The user's profile for MET-based calorie estimation. */
export interface Profile {
  age: number;
  sex: 'male' | 'female';
  weightKg: number;
}

const PROFILE_KEY = 'profile';

/** Save (overwrite) the single local profile record. */
export async function saveProfile(profile: Profile): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.profile, 'readwrite');
    tx.objectStore(STORES.profile).put({ key: PROFILE_KEY, ...profile });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Load the saved profile, or null if none has been saved yet. */
export async function loadProfile(): Promise<Profile | null> {
  const db = await openDb();
  const record = await new Promise<(Profile & { key: string }) | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(STORES.profile, 'readonly');
      const req = tx.objectStore(STORES.profile).get(PROFILE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    },
  );
  db.close();
  if (!record) return null;
  const { age, sex, weightKg } = record;
  return { age, sex, weightKg };
}
