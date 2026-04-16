import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCamera } from "../../src/hooks/useCamera";
import { clearExtensions, extendHook } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useCamera", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useCamera());
    expect(result.photo.value).toBeNull();
    expect(result.preview.value).toBe("");
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("capture 调用 bridge 并返回文件", async () => {
    const mockFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const { result } = withSetup(() => useCamera(), {
      camera: { capture: vi.fn().mockResolvedValue(mockFile) },
    });

    const file = await result.capture();
    expect(file).toBeInstanceOf(File);
    expect(result.photo.value).toBeInstanceOf(File);
    expect(result.loading.value).toBe(false);
  });

  it("capture 失败时设置 error", async () => {
    const { result } = withSetup(() => useCamera(), {
      camera: { capture: vi.fn().mockRejectedValue(new Error("相机不可用")) },
    });

    const file = await result.capture();
    expect(file).toBeNull();
    expect(result.error.value?.message).toBe("相机不可用");
  });

  it("clear 清空状态", async () => {
    const mockFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const { result } = withSetup(() => useCamera(), {
      camera: { capture: vi.fn().mockResolvedValue(mockFile) },
    });

    await result.capture();
    expect(result.photo.value).not.toBeNull();

    result.clear();
    expect(result.photo.value).toBeNull();
    expect(result.preview.value).toBe("");
  });

  it("支持 before/after 扩展", async () => {
    const mockFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });

    extendHook("useCamera", {
      before: (opts) => [{ ...opts, quality: 0.5 }],
    });

    let afterCalled = false;
    extendHook("useCamera", {
      after: (file, ctx) => {
        afterCalled = true;
        return file;
      },
    });

    const { result } = withSetup(() => useCamera(), {
      camera: { capture: vi.fn().mockResolvedValue(mockFile) },
    });

    await result.capture();
    expect(afterCalled).toBe(true);
  });
});
