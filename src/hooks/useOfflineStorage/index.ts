import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseOfflineStorageOptions {
  /** IndexedDB 数据库名 */
  dbName?: string;
  /** 存储表名 */
  storeName?: string;
  /** 数据库版本 */
  version?: number;
  /** 是否在上线时自动同步 */
  autoSync?: boolean;
  /** 同步接口地址 */
  syncAction?: string;
  /** 同步请求头 */
  syncHeaders?: Record<string, string> | (() => Record<string, string>);
}

export interface UseOfflineStorageReturn {
  /** 是否在线 */
  online: Ref<boolean>;
  /** 待同步数量 */
  pendingCount: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  /** 存储数据 */
  save: (key: string, data: any) => Promise<boolean>;
  /** 读取数据 */
  get: <T = any>(key: string) => Promise<T | null>;
  /** 删除数据 */
  remove: (key: string) => Promise<boolean>;
  /** 获取所有 key */
  keys: () => Promise<string[]>;
  /** 手动触发同步 */
  sync: () => Promise<boolean>;
  /** 清空存储 */
  clear: () => Promise<void>;
}

const DEFAULTS: UseOfflineStorageOptions = {
  dbName: "h5-core-offline",
  storeName: "data",
  version: 1,
  autoSync: true,
};

function openDB(
  dbName: string,
  storeName: string,
  version: number,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
      // 同步队列存储
      if (!db.objectStoreNames.contains("_sync_queue")) {
        db.createObjectStore("_sync_queue", { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbOperation<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useOfflineStorage(
  options?: UseOfflineStorageOptions,
): UseOfflineStorageReturn {
  const opts = { ...DEFAULTS, ...options };

  const online = ref(navigator.onLine);
  const pendingCount = ref(0);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  let db: IDBDatabase | null = null;

  async function getDB(): Promise<IDBDatabase> {
    if (!db) {
      db = await openDB(opts.dbName!, opts.storeName!, opts.version!);
    }
    return db;
  }

  async function save(key: string, data: any): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useOfflineStorage", [
        key,
        data,
      ]);
      const database = await getDB();
      await dbOperation(database, opts.storeName!, "readwrite", (store) =>
        store.put(args[1], args[0]),
      );

      // 记录到同步队列
      if (opts.syncAction) {
        await dbOperation(database, "_sync_queue", "readwrite", (store) =>
          store.add({ key: args[0], data: args[1], timestamp: Date.now() }),
        );
        await updatePendingCount();
      }

      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function get<T = any>(key: string): Promise<T | null> {
    try {
      const database = await getDB();
      const result = await dbOperation(
        database,
        opts.storeName!,
        "readonly",
        (store) => store.get(key),
      );
      return (result as T) ?? null;
    } catch (e) {
      error.value = e as Error;
      return null;
    }
  }

  async function remove(key: string): Promise<boolean> {
    try {
      const database = await getDB();
      await dbOperation(database, opts.storeName!, "readwrite", (store) =>
        store.delete(key),
      );
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    }
  }

  async function keys(): Promise<string[]> {
    try {
      const database = await getDB();
      const result = await dbOperation(
        database,
        opts.storeName!,
        "readonly",
        (store) => store.getAllKeys(),
      );
      return result as string[];
    } catch (e) {
      error.value = e as Error;
      return [];
    }
  }

  async function updatePendingCount(): Promise<void> {
    try {
      const database = await getDB();
      const result = await dbOperation(
        database,
        "_sync_queue",
        "readonly",
        (store) => store.count(),
      );
      pendingCount.value = result;
    } catch {
      // 静默失败
    }
  }

  function resolveHeaders(): Record<string, string> {
    if (!opts.syncHeaders) return {};
    return typeof opts.syncHeaders === "function"
      ? opts.syncHeaders()
      : opts.syncHeaders;
  }

  async function sync(): Promise<boolean> {
    if (!opts.syncAction) return false;
    loading.value = true;
    error.value = null;

    try {
      const database = await getDB();
      const items = await dbOperation(
        database,
        "_sync_queue",
        "readonly",
        (store) => store.getAll(),
      );

      if (!items || items.length === 0) return true;

      const response = await fetch(opts.syncAction, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...resolveHeaders(),
        },
        body: JSON.stringify(items),
      });

      if (!response.ok) {
        throw new Error(`同步失败: ${response.status}`);
      }

      // 清空同步队列
      await dbOperation(database, "_sync_queue", "readwrite", (store) =>
        store.clear(),
      );
      pendingCount.value = 0;

      await runAfterExtensions("useOfflineStorage", { synced: items.length });
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function clear(): Promise<void> {
    const database = await getDB();
    await dbOperation(database, opts.storeName!, "readwrite", (store) =>
      store.clear(),
    );
    await dbOperation(database, "_sync_queue", "readwrite", (store) =>
      store.clear(),
    );
    pendingCount.value = 0;
  }

  // 监听在线状态
  function onOnline() {
    online.value = true;
    if (opts.autoSync) sync();
  }

  function onOffline() {
    online.value = false;
  }

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  onUnmounted(() => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    db?.close();
    db = null;
  });

  // 初始化时检查待同步数量
  updatePendingCount();

  return {
    online,
    pendingCount,
    loading,
    error,
    save,
    get,
    remove,
    keys,
    sync,
    clear,
  };
}
