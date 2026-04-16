import { describe, it, expect, vi, beforeEach } from "vitest";

import { useOfflineStorage } from "../../src/hooks/useOfflineStorage";

// Mock IndexedDB
function createMockIDB() {
  const store = new Map<string, any>();

  const mockObjectStore = {
    get: vi.fn().mockImplementation((key: string) => ({
      onsuccess: null as any,
      onerror: null as any,
      result: store.get(key) ?? null,
      set onsuccess(fn: any) { setTimeout(() => fn(), 0); },
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
    const { loading, error } = useOfflineStorage();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("IndexedDB 不可用时抛出错误", async () => {
    vi.stubGlobal("indexedDB", undefined);
    const { get, error } = useOfflineStorage();
    await get("key");
    expect(error.value?.message).toContain("IndexedDB 不可用");
  });

  it("支持自定义 dbName 和 storeName", () => {
    createMockIDB();
    const { loading } = useOfflineStorage({
      dbName: "my-db",
      storeName: "my-store",
    });
    expect(loading.value).toBe(false);
  });
});
