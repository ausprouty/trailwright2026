import * as ContentKeys from 'src/utils/ContentKeyBuilder';
import type { OutputData } from '@editorjs/editorjs';
import type { IWillItem } from 'src/types/content/IWillItem';

type PlainObject = Record<string, unknown>;

type SaveItemOptions = {
  allowEmpty?: boolean;
  deleteOnEmpty?: boolean;
};

type GetItemOptions = {
  deleteIfEmpty?: boolean;
};

const DB_NAME = 'MyBibleApp';
const DB_VERSION = 5;
const IDB_TX_MAX_RETRIES = 2;
const IDB_TX_RETRY_DELAY_MS = 25;

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;
let deletingDb = false;

const IS_DEV = Boolean(import.meta.env?.DEV);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function primitiveText(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  return '';
}
function keyText(key: IDBValidKey | null): string {
  if (key == null) {
    return '';
  }

  if (typeof key === 'string' || typeof key === 'number') {
    return String(key);
  }

  if (key instanceof Date) {
    return key.toISOString();
  }

  if (Array.isArray(key)) {
    return key.map((part) => keyText(part)).join('|');
  }

  return '[non-primitive-key]';
}

function isPlainObject(value: unknown): value is PlainObject {
  return (
    value != null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
  );
}

function isMeaningful(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isPlainObject(value)) {
    if ('error' in value) {
      const errVal = value.error;
      const errText = typeof errVal === 'string' ? errVal.trim() : '';
      const hasRealError = (typeof errVal === 'string' && errText.length > 0) || Boolean(errVal);

      if (hasRealError) {
        return false;
      }
    }

    const keys = Object.keys(value);

    if (keys.length === 0) {
      return false;
    }

    if (keys.length === 1 && keys[0] === 'error') {
      return false;
    }

    return true;
  }

  return true;
}

function previewVal(value: unknown): string {
  if (value == null) {
    return String(value);
  }

  if (typeof value === 'string') {
    const preview = value.slice(0, 120);
    return `"${preview}"${value.length > 120 ? `…(${value.length})` : ''}`;
  }

  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (value instanceof Blob) {
    return `Blob ${value.type} ${value.size}B`;
  }

  if (value instanceof ArrayBuffer) {
    return `ArrayBuffer ${value.byteLength}B`;
  }

  if (isPlainObject(value)) {
    return `Object keys=${Object.keys(value).length}`;
  }

  return primitiveText(value);
}

function isClosingError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.name === 'InvalidStateError' &&
    err.message.toLowerCase().indexOf('connection is closing') !== -1
  );
}

export function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    console.warn('IndexedDB not available — skipping IndexedDB caching');
    return Promise.resolve(null);
  }

  if (deletingDb) {
    if (IS_DEV) {
      console.debug('[IDB] openDatabase blocked: delete in progress');
    }
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error('IndexedDB open failed'));
    };

    request.onblocked = () => {
      console.warn(`[IDB] open blocked for "${DB_NAME}" (another tab open?)`);
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onclose = () => {
        if (IS_DEV) {
          console.debug('[IDB] connection closed');
        }
        dbInstance = null;
      };

      db.onversionchange = () => {
        if (IS_DEV) {
          console.debug('[IDB] versionchange → closing connection');
        }
        try {
          db.close();
        } catch {
          // ignore
        }
        dbInstance = null;
      };

      db.onerror = (event) => {
        if (IS_DEV) {
          console.debug('[IDB] connection error', event);
        }
        dbInstance = null;
      };

      dbInstance = db;
      dbPromise = null;
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('lessonContent')) {
        db.createObjectStore('lessonContent');
      }

      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes');
      }

      if (!db.objectStoreNames.contains('i_will_items')) {
        db.createObjectStore('i_will_items');
      }
      if (!db.objectStoreNames.contains('study_progress')) {
        db.createObjectStore('study_progress');
      }
    };
  });

  return dbPromise;
}

async function withTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (
    tx: IDBTransaction | null,
    store: IDBObjectStore | null,
    db: IDBDatabase | null,
  ) => Promise<T> | T,
  attempt = 0,
): Promise<T> {
  const db = await openDatabase();

  if (!db) {
    return fn(null, null, null);
  }

  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    return await fn(tx, store, db);
  } catch (err) {
    if (isClosingError(err) && attempt < IDB_TX_MAX_RETRIES) {
      if (IS_DEV) {
        console.debug(`[IDB] tx failed (closing) → retry ${attempt + 1}/${IDB_TX_MAX_RETRIES}`);
      }

      dbInstance = null;
      dbPromise = null;

      if (IDB_TX_RETRY_DELAY_MS > 0) {
        await sleep(IDB_TX_RETRY_DELAY_MS);
      }

      return withTx(storeName, mode, fn, attempt + 1);
    }

    throw err;
  }
}

async function saveItem<T>(
  storeName: string,
  key: IDBValidKey | null,
  value: T,
  opts: SaveItemOptions = {},
): Promise<boolean> {
  const { allowEmpty = false, deleteOnEmpty = true } = opts;

  if (key == null) {
    console.warn(`Refusing to save to "${storeName}" because key is null.`);
    return false;
  }

  if (isPlainObject(value) && 'error' in value) {
    const errVal = value.error;
    const errText = typeof errVal === 'string' ? errVal.trim() : '';
    const hasRealError = (typeof errVal === 'string' && errText.length > 0) || Boolean(errVal);

    if (hasRealError) {
      console.warn(
        `Skipping save for key "${keyText(key)}" due to error: ` + primitiveText(errVal),
      );
      return false;
    }
  }

  if (!allowEmpty && !isMeaningful(value)) {
    if (IS_DEV) {
      console.debug(`Empty/meaningless value for "${keyText(key)}" — not saving.`);
      console.debug(value);
    }

    if (deleteOnEmpty) {
      return withTx<boolean>(storeName, 'readwrite', (_tx, store) => {
        if (!store) {
          return Promise.resolve(false);
        }

        return new Promise<boolean>((resolve, reject) => {
          const req = store.delete(key);

          req.onsuccess = () => {
            resolve(true);
          };

          req.onerror = () => {
            reject(
              req.error ?? new Error(`IndexedDB request saveItem failed in store "${storeName}"`),
            );
          };
        });
      });
    }

    return false;
  }

  return withTx<boolean>(storeName, 'readwrite', (_tx, store) => {
    if (!store) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve, reject) => {
      const req = store.put(value, key);

      req.onsuccess = () => {
        resolve(true);
      };

      req.onerror = () => {
        reject(req.error ?? new Error(`IndexedDB request withTX failed in store "${storeName}"`));
      };
    });
  });
}

async function getItem<T>(
  storeName: string,
  key: IDBValidKey | null,
  opts: GetItemOptions = {},
): Promise<T | null> {
  const { deleteIfEmpty = true } = opts;

  if (key == null) {
    console.warn(`Refusing to get from "${storeName}" because key is null.`);
    return null;
  }

  return withTx<T | null>(storeName, deleteIfEmpty ? 'readwrite' : 'readonly', (tx, store) => {
    if (!store) {
      return Promise.resolve(null);
    }

    return new Promise<T | null>((resolve, reject) => {
      const req = store.get(key);

      req.onsuccess = () => {
        const value = req.result as T | undefined;

        if (value === undefined) {
          resolve(null);
          return;
        }

        if (!isMeaningful(value)) {
          console.warn('[IDB] meaningless value at', keyText(key), '→', value);

          if (IS_DEV) {
            console.groupCollapsed(`Purge candidate ${keyText(key)}`);
            console.log('preview:', previewVal(value));
            console.dir(value);
            console.groupEnd();
          }

          if (deleteIfEmpty && tx && tx.mode === 'readwrite') {
            try {
              store.delete(key);
            } catch {
              // ignore
            }
          }

          resolve(null);
          return;
        }

        resolve(value);
      };

      req.onerror = () => {
        reject(req.error ?? new Error(`IndexedDB request getItem failed in store "${storeName}"`));
      };
    });
  });
}

async function getAllItems<T>(storeName: string): Promise<T[]> {
  return withTx<T[]>(storeName, 'readonly', (_tx, store) => {
    if (!store) {
      return Promise.resolve([]);
    }

    return new Promise<T[]>((resolve, reject) => {
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result as T[]) || []);
      };

      req.onerror = () => {
        reject(
          req.error ?? new Error(`IndexedDB getAllItems request failed in store "${storeName}"`),
        );
      };
    });
  });
}

async function deleteItem(storeName: string, key: IDBValidKey | null): Promise<boolean> {
  if (key == null) {
    console.warn(`Refusing to delete from "${storeName}" because key is null.`);
    return false;
  }

  return withTx<boolean>(storeName, 'readwrite', (_tx, store) => {
    if (!store) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve, reject) => {
      const req = store.delete(key);

      req.onsuccess = () => {
        resolve(true);
      };

      req.onerror = () => {
        reject(
          req.error ?? new Error(`IndexedDB deleteItem request failed in store "${storeName}"`),
        );
      };
    });
  });
}

export async function getLessonContentFromDB(
  study: string,
  languageCodeHL: string,
  languageCodeJF: string,
  lesson: number,
): Promise<OutputData | null> {
  const key = ContentKeys.buildLessonContentKey(study, languageCodeHL, languageCodeJF, lesson);

  return getItem<OutputData>('lessonContent', key);
}

export async function saveLessonContentToDB(
  study: string,
  languageCodeHL: string,
  languageCodeJF: string,
  lesson: number,
  content: OutputData,
): Promise<boolean> {
  const key = ContentKeys.buildLessonContentKey(study, languageCodeHL, languageCodeJF, lesson);

  return saveItem<OutputData>('lessonContent', key, content);
}

export async function getNoteFromDB(
  study: string,
  lesson: number,
  position: string,
): Promise<string | null> {
  const key = ContentKeys.buildNotesKey(study, lesson, position);
  return getItem<string>('notes', key);
}

export async function saveNoteToDB(
  study: string,
  lesson: number,
  position: string,
  content: string,
): Promise<boolean> {
  const key = ContentKeys.buildNotesKey(study, lesson, position);
  return saveItem<string>('notes', key, content);
}

export async function deleteNoteFromDB(
  study: string,
  lesson: number,
  position: string,
): Promise<boolean> {
  const key = ContentKeys.buildNotesKey(study, lesson, position);
  return deleteItem('notes', key);
}

export async function getIWillItemFromDB(
  study: string,
  lesson: number,
  position: number,
): Promise<IWillItem | null> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);

  return getItem<IWillItem>('i_will_items', key, {
    deleteIfEmpty: false,
  });
}

export async function saveIWillItemToDB(
  study: string,
  lesson: number,
  position: number,
  statement: string,
): Promise<boolean> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);

  if (!key) {
    return false;
  }

  const existing = await getItem<IWillItem>('i_will_items', key, {
    deleteIfEmpty: false,
  });

  const now = new Date().toISOString();

  const record: IWillItem = {
    id: key,
    study,
    lesson,
    position,
    statement,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    status: existing?.status || 'active',
    completedAt: existing?.completedAt || null,
    abandonedAt: existing?.abandonedAt || null,
  };

  return saveItem<IWillItem>('i_will_items', key, record, {
    allowEmpty: false,
    deleteOnEmpty: false,
  });
}

export async function getAllIWillItemsFromDB(): Promise<IWillItem[]> {
  const items = await getAllItems<IWillItem>('i_will_items');

  return items.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return bTime - aTime;
  });
}

export async function completeIWillItemInDB(
  study: string,
  lesson: number,
  position: number,
): Promise<boolean> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);

  if (!key) {
    return false;
  }

  const existing = await getItem<IWillItem>('i_will_items', key, {
    deleteIfEmpty: false,
  });

  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();

  return saveItem<IWillItem>('i_will_items', key, {
    ...existing,
    status: 'completed',
    updatedAt: now,
    completedAt: now,
    abandonedAt: null,
  });
}

export async function abandonIWillItemInDB(
  study: string,
  lesson: number,
  position: number,
): Promise<boolean> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);

  if (!key) {
    return false;
  }

  const existing = await getItem<IWillItem>('i_will_items', key, {
    deleteIfEmpty: false,
  });

  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();

  return saveItem<IWillItem>('i_will_items', key, {
    ...existing,
    status: 'abandoned',
    updatedAt: now,
    abandonedAt: now,
    completedAt: null,
  });
}

export async function reopenIWillItemInDB(
  study: string,
  lesson: number,
  position: number,
): Promise<boolean> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);

  if (!key) {
    return false;
  }

  const existing = await getItem<IWillItem>('i_will_items', key, {
    deleteIfEmpty: false,
  });

  if (!existing) {
    return false;
  }

  const now = new Date().toISOString();

  return saveItem<IWillItem>('i_will_items', key, {
    ...existing,
    status: 'active',
    updatedAt: now,
    completedAt: null,
    abandonedAt: null,
  });
}

export async function deleteIWillItemFromDB(
  study: string,
  lesson: number,
  position: number,
): Promise<boolean> {
  const key = ContentKeys.buildIWillKey(study, lesson, position);
  return deleteItem('i_will_items', key);
}

export async function clearTable(tableName: string): Promise<boolean> {
  return withTx<boolean>(tableName, 'readwrite', (_tx, store, db) => {
    if (!db || !store) {
      return Promise.resolve(false);
    }

    if (!db.objectStoreNames.contains(tableName)) {
      return Promise.reject(new Error(`Table "${tableName}" not found in database.`));
    }

    return new Promise<boolean>((resolve, reject) => {
      const req = store.clear();

      req.onsuccess = () => {
        resolve(true);
      };

      req.onerror = () => {
        reject(req.error ?? new Error('IndexedDB ClearTable request failed'));
      };
    });
  });
}
export async function getStudyProgress(
  study: string,
): Promise<{ completedLessons: number[]; lastCompletedLesson: number | null }> {
  const key = ContentKeys.buildStudyProgressKey(study);

  const data = await getItem<{
    completedLessons: number[];
    lastCompletedLesson: number | null;
  }>('study_progress', key);

  return (
    data || {
      completedLessons: [],
      lastCompletedLesson: null,
    }
  );
}

export async function saveStudyProgress(
  study: string,
  progress: {
    completedLessons: number[];
    lastCompletedLesson: number | null;
  },
): Promise<boolean> {
  const safeProgress = {
    completedLessons: Array.isArray(progress.completedLessons)
      ? [...progress.completedLessons]
      : [],
    lastCompletedLesson:
      typeof progress.lastCompletedLesson === 'number' ? progress.lastCompletedLesson : null,
  };

  const key = ContentKeys.buildStudyProgressKey(study);

  return saveItem('study_progress', key, safeProgress);
}

export function clearDatabase(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    console.warn('IndexedDB not available — cannot clear MyBibleApp.');
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve, reject) => {
    deletingDb = true;
    dbPromise = null;

    try {
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
    } catch (err) {
      console.warn('Error closing existing IDB instance before delete:', err);
    }

    const req = indexedDB.deleteDatabase(DB_NAME);

    req.onsuccess = () => {
      console.log(`IndexedDB database "${DB_NAME}" deleted.`);
      deletingDb = false;
      resolve(true);
    };

    req.onerror = () => {
      reject(req.error ?? new Error('IndexedDB ClearDatabase request failed'));
    };

    req.onblocked = () => {
      console.warn(
        `Delete for IndexedDB database "${DB_NAME}" is blocked ` + '(another tab open?).',
      );
    };
  });
}
