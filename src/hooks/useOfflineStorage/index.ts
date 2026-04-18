import { ref, type Ref, onUnmounted } from "vue";

export interface UseOfflineStorageOptions {
  dbName?: string;
  storeName?: string;
}

export interface UseOfflineStorageReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  get: <T = any>(key: string) => Promise<T | null>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
  close: () => void;
}

const DEFAULTS: UseOfflineStorageOptions = {
  dbName: "h5-core-storage",
  storeName: "kv-store",
};

/**
 * 离线存储 Hook — 基于 IndexedDB 的 KV 存储
 * Safari 隐私模式下有 50MB 限制且可能被清理
 */
export function useOfflineStorage(
  options?: UseOfflineStorageOptions,
): UseOfflineStorageReturn {
  const opts = { ...DEFAULTS, ...options };

  const loading = ref(false);
  const error = ref<Error | null>(null);
  let db: IDBDatabase | null = null;

  async function getDB(): Promise<IDBDatabase> {
    if (db) return db;
    if (typeof indexedDB === "undefined") {
      throw new Error(
        "[h5-core] IndexedDB 不可用（可能处于隐私模式或 SSR 环境）",
      );
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(opts.dbName!, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(opts.storeName!);
      };
      request.onsuccess = () => {
        db = request.result;
        resolve(db!);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function withTransaction<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest,
    fallback?: T,
  ): Promise<T> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise<T>((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, mode);
        const store = tx.objectStore(opts.storeName!);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result ?? fallback as T);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
      return fallback as T;
    } finally {
      loading.value = false;
    }
  }

  async function get<T = any>(key: string): Promise<T | null> {
    return withTransaction<T | null>("readonly", (store) => store.get(key), null);
  }

  async function set(key: string, value: any): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.put(value, key));
  }

  async function remove(key: string): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.delete(key));
  }

  async function clear(): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.clear());
  }

  async function keys(): Promise<string[]> {
    return withTransaction<string[]>("readonly", (store) => store.getAllKeys() as IDBRequest<string[]>, []);
  }

  function close(): void {
    if (db) {
      db.close();
      db = null;
    }
  }

  onUnmounted(close);

  return { loading, error, get, set, remove, clear, keys, close };
}
