import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));

import { useQrScanner } from "../../src/hooks/useQrScanner";

describe("useQrScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { result, loading, error } = useQrScanner();
    expect(result.value).toBe("");
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("scan 返回扫码结果", async () => {
    const { scan, result } = useQrScanner();
    const text = await scan();
    expect(text).toBe("https://example.com");
    expect(result.value).toBe("https://example.com");
    expect(mockBridge.scanner.scan).toHaveBeenCalledOnce();
  });

  it("scan 错误时设置 error", async () => {
    mockBridge.scanner.scan.mockRejectedValueOnce(new Error("扫码失败"));
    const { scan, error } = useQrScanner();
    const text = await scan();
    expect(text).toBeNull();
    expect(error.value?.message).toBe("扫码失败");
  });

  it("支持 type 选项", async () => {
    const { scan } = useQrScanner({ type: "barcode" });
    await scan();
    expect(mockBridge.scanner.scan).toHaveBeenCalled();
  });

  it("scan overrides 合并", async () => {
    const { scan } = useQrScanner({ type: "qrcode" });
    await scan({ type: "barcode" });
    expect(mockBridge.scanner.scan).toHaveBeenCalledWith(
      expect.objectContaining({ type: "barcode" }),
    );
  });
});
