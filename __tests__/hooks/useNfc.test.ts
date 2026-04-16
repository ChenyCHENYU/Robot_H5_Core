import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNfc } from "../../src/hooks/useNfc";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useNfc", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useNfc());
    expect(result.data.value).toBeNull();
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("read 返回 NFC 数据", async () => {
    const mockData = { id: "nfc-001", type: "NDEF", records: [{ type: "text", data: "hello" }] };
    const { result } = withSetup(() => useNfc(), {
      nfc: {
        read: vi.fn().mockResolvedValue(mockData),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const data = await result.read();
    expect(data).toEqual(mockData);
    expect(result.data.value).toEqual(mockData);
  });

  it("read 失败时设置 error", async () => {
    const { result } = withSetup(() => useNfc(), {
      nfc: {
        read: vi.fn().mockRejectedValue(new Error("NFC 不可用")),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const data = await result.read();
    expect(data).toBeNull();
    expect(result.error.value?.message).toBe("NFC 不可用");
  });

  it("write 成功返回 true", async () => {
    const { result } = withSetup(() => useNfc(), {
      nfc: {
        read: vi.fn().mockResolvedValue(null),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const ok = await result.write({ id: "1", type: "NDEF", records: [] });
    expect(ok).toBe(true);
  });

  it("write 失败返回 false", async () => {
    const { result } = withSetup(() => useNfc(), {
      nfc: {
        read: vi.fn().mockResolvedValue(null),
        write: vi.fn().mockRejectedValue(new Error("写入失败")),
      },
    });

    const ok = await result.write({ id: "1", type: "NDEF", records: [] });
    expect(ok).toBe(false);
    expect(result.error.value?.message).toBe("写入失败");
  });

  it("clear 清空状态", async () => {
    const mockData = { id: "nfc-001", type: "NDEF", records: [] };
    const { result } = withSetup(() => useNfc(), {
      nfc: {
        read: vi.fn().mockResolvedValue(mockData),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    await result.read();
    result.clear();
    expect(result.data.value).toBeNull();
    expect(result.error.value).toBeNull();
  });
});
