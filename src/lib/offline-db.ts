import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  notes: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      created_at: string;
    };
  };
  topics: {
    key: string;
    value: {
      id: string;
      name: string;
      subject: string;
      subtopics: string[];
    };
  };
  questions: {
    key: string;
    value: {
      id: string;
      question_text: string;
      options: any;
      correct_answer: string;
    };
  };
  timetable: {
    key: string;
    value: {
      id: string;
      day_of_week: number;
      time_slot: string;
      activity: string;
    };
  };
  revisions: {
    key: string;
    value: {
      id: string;
      topic_id: string;
      scheduled_date: string;
      day_number: number;
    };
  };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export async function initOfflineDB() {
  if (db) return db;
  
  db = await openDB<OfflineDB>('conceptpulse-offline', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('topics')) {
        db.createObjectStore('topics', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('questions')) {
        db.createObjectStore('questions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('timetable')) {
        db.createObjectStore('timetable', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('revisions')) {
        db.createObjectStore('revisions', { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

export async function saveToOffline<T extends keyof OfflineDB>(
  store: T,
  data: OfflineDB[T]['value'][]
) {
  const database = await initOfflineDB();
  const tx = database.transaction(store as any, 'readwrite');
  
  await Promise.all([
    ...data.map((item) => tx.store.put(item as any)),
    tx.done,
  ]);
}

export async function getFromOffline<T extends keyof OfflineDB>(
  store: T
): Promise<OfflineDB[T]['value'][]> {
  const database = await initOfflineDB();
  return await database.getAll(store as any);
}
