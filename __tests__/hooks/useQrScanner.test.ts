import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQrScanner } from "../../src/hooks/useQrScanner";
import { clearExtensions, extendHook } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useQrScanner", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useQrScanner());
    expect(result.result.value).toBe("");
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("scan 返回扫描结果", async () => {
    const { result } = withSetup(() => useQrScanner(), {
      scanner: { scan: vi.fn().mockResolvedValue("QR_CODE_123") },
    });

    const code = await result.scan();
    expect(code).toBe("QR_CODE_123");
    expect(result.result.value).toBe("QR_CODE_123");
  });

  it("scan 失败时设置 error", async () => {
    const { result } = withSetup(() => useQrScanner(), {
      scanner: { scan: vi.fn().mockRejectedValue(new Error("扫码失败")) },
    });

    const code = await result.scan();
    expect(code).toBeNull();
    expect(result.error.value?.message).toBe("扫码失败");
  });

  it("clear 清空结果", async () => {
    const { result } = withSetup(() => useQrScanner(), {
      scanner: { scan: vi.fn().mockResolvedValue("CODE") },
    });

    await result.scan();
    result.clear();
    expect(result.result.value).toBe("");
    expect(result.error.value).toBeNull();
  });

  it("支持扩展", async () => {
    let processed = false;
    extendHook("useQrScanner", {
      after: (code) => {
        processed = true;
        return code;
      },
    });

    const { result } = withSetup(() => useQrScanner(), {
      scanner: { scan: vi.fn().mockResolvedValue("CODE") },
    });

    await result.scan();
    expect(processed).toBe(true);
  });
});
