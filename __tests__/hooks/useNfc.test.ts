import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));

import { useNfc } from "../../src/hooks/useNfc";

describe("useNfc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { data, loading, error } = useNfc();
    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("read 返回 NFC 数据", async () => {
    const { read, data } = useNfc();
    const result = await read();
    expect(result).toBeDefined();
    expect(result!.id).toBe("abc");
    expect(result!.type).toBe("NDEF");
    expect(data.value).toEqual(result);
  });

  it("read 错误处理", async () => {
    mockBridge.nfc.read.mockRejectedValueOnce(new Error("NFC 不可用"));
    const { read, error } = useNfc();
    const result = await read();
    expect(result).toBeNull();
    expect(error.value?.message).toBe("NFC 不可用");
  });

  it("write 成功", async () => {
    const { write } = useNfc();
    const nfcData = {
      id: "123",
      type: "NDEF",
      records: [{ type: "text", data: "test" }],
    };
    const result = await write(nfcData);
    expect(result).toBe(true);
    expect(mockBridge.nfc.write).toHaveBeenCalledWith(nfcData);
  });

  it("write 错误处理", async () => {
    mockBridge.nfc.write.mockRejectedValueOnce(new Error("写入失败"));
    const { write, error } = useNfc();
    const result = await write({ id: "x", type: "NDEF", records: [] });
    expect(result).toBe(false);
    expect(error.value?.message).toBe("写入失败");
  });
});
