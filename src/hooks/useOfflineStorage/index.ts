import { ref, type Ref } from "vue";

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

  async function get<T = any>(key: string): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, "readonly");
        const store = tx.objectStore(opts.storeName!);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function set(key: string, value: any): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, "readwrite");
        const store = tx.objectStore(opts.storeName!);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  async function remove(key: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, "readwrite");
        const store = tx.objectStore(opts.storeName!);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  async function clear(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, "readwrite");
        const store = tx.objectStore(opts.storeName!);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  async function keys(): Promise<string[]> {
    loading.value = true;
    error.value = null;
    try {
      const database = await getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(opts.storeName!, "readonly");
        const store = tx.objectStore(opts.storeName!);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      error.value = e as Error;
      return [];
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, get, set, remove, clear, keys };
}
