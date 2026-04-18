import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge, createMockConfig, withSetup } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));
vi.mock("../../src/config", () => ({
  useAppConfig: () => createMockConfig(),
}));

import { useCamera } from "../../src/hooks/useCamera";

describe("useCamera", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { result: { photo, preview, loading, error } } = withSetup(() => useCamera());
    expect(photo.value).toBeNull();
    expect(preview.value).toBe("");
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("capture 调用 bridge 并返回 File", async () => {
    const { result: { capture, photo, loading } } = withSetup(() => useCamera());
    const result = await capture();
    expect(result).toBeInstanceOf(File);
    expect(photo.value).toBeInstanceOf(File);
    expect(mockBridge.camera.capture).toHaveBeenCalledOnce();
    expect(loading.value).toBe(false);
  });

  it("capture 错误时设置 error", async () => {
    mockBridge.camera.capture.mockRejectedValueOnce(new Error("denied"));
    const { result: { capture, error } } = withSetup(() => useCamera());
    const result = await capture();
    expect(result).toBeNull();
    expect(error.value?.message).toBe("denied");
  });

  it("clear 清除状态", async () => {
    const { result: { capture, clear, photo, preview } } = withSetup(() => useCamera());
    await capture();
    clear();
    expect(photo.value).toBeNull();
    expect(preview.value).toBe("");
  });

  it("支持 options 合并", () => {
    const { result: { capture } } = withSetup(() => useCamera({ maxSize: 500, quality: 0.5 }));
    expect(capture).toBeTypeOf("function");
  });
});
