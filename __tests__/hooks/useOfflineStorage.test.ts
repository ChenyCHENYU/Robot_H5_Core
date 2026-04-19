import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSetup } from "./_helpers";

import { useOfflineStorage } from "../../src/hooks/useOfflineStorage";

// Mock IndexedDB
function createMockIDB() {
  const store = new Map<string, any>();

  const mockObjectStore = {
    get: vi.fn().mockImplementation((key: string) => ({
      result: store.get(key) ?? null,
      set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
      set onerror(_fn: any) { /* noop */ },
    })),
    put: vi.fn().mockImplementation((value: any, key: string) => {
      store.set(key, value);
      return {
        set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
        set onerror(fn: any) {},
      };
    }),
    delete: vi.fn().mockImplementation((key: string) => {
      store.delete(key);
      return {
        set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
        set onerror(fn: any) {},
      };
    }),
    clear: vi.fn().mockImplementation(() => {
      store.clear();
      return {
        set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
        set onerror(fn: any) {},
      };
    }),
    getAllKeys: vi.fn().mockImplementation(() => ({
      result: [...store.keys()],
      set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
      set onerror(fn: any) {},
    })),
  };

  const mockTransaction = {
    objectStore: vi.fn().mockReturnValue(mockObjectStore),
  };

  const mockDB = {
    transaction: vi.fn().mockReturnValue(mockTransaction),
    createObjectStore: vi.fn(),
  };

  vi.stubGlobal("indexedDB", {
    open: vi.fn().mockImplementation(() => {
      const request = {
        result: mockDB,
        set onupgradeneeded(fn: any) { fn(); },
        set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
        set onerror(fn: any) {},
      };
      return request;
    }),
  });

  return { store, mockDB, mockObjectStore };
}

describe("useOfflineStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    createMockIDB();
    const { result: { loading, error } } = withSetup(() => useOfflineStorage());
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("IndexedDB 不可用时抛出错误", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const { result: { get, error } } = withSetup(() => useOfflineStorage());
    await get("key");
    expect(error.value?.message).toContain("IndexedDB 不可用");
  });

  it("set 和 get 存取值", async () => {
    createMockIDB();
    const { result: { get, set } } = withSetup(() => useOfflineStorage());
    await set("name", "张三");
    const result = await get("name");
    expect(result).toBe("张三");
  });

  it("get 不存在的 key 返回 null", async () => {
    createMockIDB();
    const { result: { get } } = withSetup(() => useOfflineStorage());
    const result = await get("nonexistent");
    expect(result).toBeNull();
  });

  it("remove 删除键", async () => {
    createMockIDB();
    const { result: { set, remove, get } } = withSetup(() => useOfflineStorage());
    await set("key1", "val1");
    await remove("key1");
    const result = await get("key1");
    expect(result).toBeNull();
  });

  it("clear 清空所有数据", async () => {
    createMockIDB();
    const { result: { set, clear, keys } } = withSetup(() => useOfflineStorage());
    await set("a", 1);
    await set("b", 2);
    await clear();
    const allKeys = await keys();
    expect(allKeys).toEqual([]);
  });

  it("keys 获取所有键名", async () => {
    createMockIDB();
    const { result: { set, keys } } = withSetup(() => useOfflineStorage());
    await set("x", 1);
    await set("y", 2);
    const allKeys = await keys();
    expect(allKeys).toContain("x");
    expect(allKeys).toContain("y");
  });

  it("close 关闭 DB 连接", async () => {
    const { mockDB } = createMockIDB();
    mockDB.close = vi.fn();
    const { result: { get, close } } = withSetup(() => useOfflineStorage());
    // 先触发 getDB 打开连接
    await get("any");
    close();
    expect(mockDB.close).toHaveBeenCalled();
  });

  it("unmount 自动关闭连接", async () => {
    const { mockDB } = createMockIDB();
    mockDB.close = vi.fn();
    const { result: { get }, unmount } = withSetup(() => useOfflineStorage());
    await get("any");
    unmount();
    expect(mockDB.close).toHaveBeenCalled();
  });

  it("支持自定义 dbName 和 storeName", () => {
    createMockIDB();
    const { result: { loading } } = withSetup(() => useOfflineStorage({
      dbName: "my-db",
      storeName: "my-store",
    }));
    expect(loading.value).toBe(false);
  });
});

// ---- Sync queue tests ----

describe("useOfflineStorage sync queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("未配置 sync 时 pendingCount 始终为 0", async () => {
    createMockIDB();
    const { result: { set, pendingCount, syncStatus } } = withSetup(() =>
      useOfflineStorage(),
    );
    await set("key", "val");
    expect(pendingCount.value).toBe(0);
    expect(syncStatus.value).toBe("idle");
  });

  it("配置 sync 后 set 操作自动入队", async () => {
    createMockIDB();
    const { result: { set, pendingCount } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await set("k1", "v1");
    expect(pendingCount.value).toBe(1);
    await set("k2", "v2");
    expect(pendingCount.value).toBe(2);
  });

  it("remove 操作自动入队", async () => {
    createMockIDB();
    const { result: { set, remove, pendingCount } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await set("k1", "v1");
    await remove("k1");
    expect(pendingCount.value).toBe(2); // set + remove
  });

  it("clear 操作自动入队", async () => {
    createMockIDB();
    const { result: { clear, pendingCount } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await clear();
    expect(pendingCount.value).toBe(1);
  });

  it("flush 发送操作并清空队列", async () => {
    createMockIDB();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    const { result: { set, flush, pendingCount, syncStatus } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await set("k1", "v1");
    await set("k2", "v2");
    expect(pendingCount.value).toBe(2);

    await flush();
    expect(mockFetch).toHaveBeenCalledWith("/api/sync", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
    expect(pendingCount.value).toBe(0);
    expect(syncStatus.value).toBe("idle");
  });

  it("flush 失败时 syncStatus 为 error", async () => {
    createMockIDB();
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", mockFetch);

    const { result: { set, flush, syncStatus, pendingCount } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await set("k1", "v1");
    await flush();
    expect(syncStatus.value).toBe("error");
    expect(pendingCount.value).toBe(1); // 未清空
  });

  it("flush 队列为空时不发请求", async () => {
    createMockIDB();
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const { result: { flush } } = withSetup(() =>
      useOfflineStorage({
        sync: { endpoint: "/api/sync" },
      }),
    );
    await flush();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("未配置 sync 时 flush 为空操作", async () => {
    createMockIDB();
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const { result: { flush } } = withSetup(() => useOfflineStorage());
    await flush();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sync headers 支持函数形式", async () => {
    createMockIDB();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    const { result: { set, flush } } = withSetup(() =>
      useOfflineStorage({
        sync: {
          endpoint: "/api/sync",
          headers: () => ({ Authorization: "Bearer test123" }),
        },
      }),
    );
    await set("k1", "v1");
    await flush();
    expect(mockFetch).toHaveBeenCalledWith("/api/sync", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer test123" }),
    }));
  });
});
