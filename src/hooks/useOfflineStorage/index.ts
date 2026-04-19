import { ref, type Ref, onUnmounted } from "vue";

export interface SyncConfig {
  /** 同步接口 URL */
  endpoint: string;
  /** 请求头（支持函数动态生成） */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 网络恢复后自动同步，默认 true */
  autoSync?: boolean;
}

export interface SyncOperation {
  op: "set" | "remove" | "clear";
  key?: string;
  value?: any;
  timestamp: number;
}

export interface UseOfflineStorageOptions {
  dbName?: string;
  storeName?: string;
  /** 在线同步配置 — 启用后写操作自动入队，网络恢复批量推送 */
  sync?: SyncConfig;
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
  /** 待同步操作数量（未配置 sync 时始终为 0） */
  pendingCount: Ref<number>;
  /** 同步状态（未配置 sync 时始终为 'idle'） */
  syncStatus: Ref<"idle" | "syncing" | "error">;
  /** 立即将待同步队列推送到服务端（未配置 sync 时为空操作） */
  flush: () => Promise<void>;
}

const DEFAULTS: UseOfflineStorageOptions = {
  dbName: "h5-core-storage",
  storeName: "kv-store",
};

/**
 * 离线存储 Hook — 基于 IndexedDB 的 KV 存储
 * 可选在线同步队列：写操作自动入队，网络恢复后批量推送
 *
 * Safari 隐私模式下有 50MB 限制且可能被清理
 */
export function useOfflineStorage(
  options?: UseOfflineStorageOptions,
): UseOfflineStorageReturn {
  const opts = { ...DEFAULTS, ...options };
  const syncConfig = opts.sync;

  const loading = ref(false);
  const error = ref<Error | null>(null);
  const pendingCount = ref(0);
  const syncStatus = ref<"idle" | "syncing" | "error">("idle");
  let db: IDBDatabase | null = null;
  let onlineHandler: (() => void) | null = null;
  const syncQueueKey = `${opts.dbName}-sync-queue`;

  // ---- IDB helpers ----

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

  // ---- Sync queue (localStorage) ----

  function getSyncQueue(): SyncOperation[] {
    if (!syncConfig || typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(syncQueueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setSyncQueue(queue: SyncOperation[]): void {
    if (!syncConfig || typeof localStorage === "undefined") return;
    localStorage.setItem(syncQueueKey, JSON.stringify(queue));
    pendingCount.value = queue.length;
  }

  function enqueue(op: SyncOperation): void {
    if (!syncConfig) return;
    const queue = getSyncQueue();
    queue.push(op);
    setSyncQueue(queue);
  }

  // ---- Core CRUD ----

  async function get<T = any>(key: string): Promise<T | null> {
    return withTransaction<T | null>("readonly", (store) => store.get(key), null);
  }

  async function set(key: string, value: any): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.put(value, key));
    enqueue({ op: "set", key, value, timestamp: Date.now() });
  }

  async function remove(key: string): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.delete(key));
    enqueue({ op: "remove", key, timestamp: Date.now() });
  }

  async function clear(): Promise<void> {
    await withTransaction<void>("readwrite", (store) => store.clear());
    enqueue({ op: "clear", timestamp: Date.now() });
  }

  async function keys(): Promise<string[]> {
    return withTransaction<string[]>("readonly", (store) => store.getAllKeys() as IDBRequest<string[]>, []);
  }

  // ---- Sync flush ----

  async function flush(): Promise<void> {
    if (!syncConfig) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    syncStatus.value = "syncing";
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(typeof syncConfig.headers === "function"
          ? syncConfig.headers()
          : (syncConfig.headers ?? {})),
      };

      const response = await fetch(syncConfig.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ operations: queue }),
      });

      if (!response.ok) {
        throw new Error(`同步失败: HTTP ${response.status}`);
      }

      setSyncQueue([]);
      syncStatus.value = "idle";
    } catch (e) {
      syncStatus.value = "error";
      error.value = e as Error;
    }
  }

  // ---- Auto sync on online ----

  if (syncConfig && syncConfig.autoSync !== false && typeof window !== "undefined") {
    onlineHandler = () => { flush(); };
    window.addEventListener("online", onlineHandler);
    pendingCount.value = getSyncQueue().length;
  }

  function close(): void {
    if (db) {
      db.close();
      db = null;
    }
    if (onlineHandler && typeof window !== "undefined") {
      window.removeEventListener("online", onlineHandler);
      onlineHandler = null;
    }
  }

  onUnmounted(close);

  return {
    loading, error, get, set, remove, clear, keys, close,
    pendingCount, syncStatus, flush,
  };
}
