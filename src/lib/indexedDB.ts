import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ConceptPulseDB extends DBSchema {
  notes: {
    key: string;
    value: any;
  };
  questions: {
    key: string;
    value: any;
  };
  timetable: {
    key: string;
    value: any;
  };
  revisions: {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<ConceptPulseDB>;

async function initDB() {
  if (db) return db;

  db = await openDB<ConceptPulseDB>('ConceptPulseDB', 1, {
    upgrade(db) {
      db.createObjectStore('notes');
      db.createObjectStore('questions');
      db.createObjectStore('timetable');
      db.createObjectStore('revisions');
    },
  });

  return db;
}

export async function getFromDB(storeName: keyof ConceptPulseDB, key: string) {
  const db = await initDB();
  return db.get(storeName as any, key);
}

export async function setToDB(storeName: keyof ConceptPulseDB, key: string, value: any) {
  const db = await initDB();
  return db.put(storeName as any, value, key);
}
