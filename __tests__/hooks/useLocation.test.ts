import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge, createMockConfig, withSetup } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));
vi.mock("../../src/config", () => ({
  useAppConfig: () => createMockConfig(),
}));

import { useLocation } from "../../src/hooks/useLocation";

describe("useLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { result: { position, loading, error } } = withSetup(() => useLocation());
    expect(position.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("getCurrentPosition 返回坐标", async () => {
    const { result: { getCurrentPosition, position } } = withSetup(() => useLocation());
    const pos = await getCurrentPosition();
    expect(pos).toBeDefined();
    expect(pos!.longitude).toBe(116.4);
    expect(pos!.latitude).toBe(39.9);
    expect(position.value).toEqual(pos);
  });

  it("getCurrentPosition 错误处理", async () => {
    mockBridge.location.getCurrent.mockRejectedValueOnce(new Error("定位失败"));
    const { result: { getCurrentPosition, error } } = withSetup(() => useLocation());
    const pos = await getCurrentPosition();
    expect(pos).toBeNull();
    expect(error.value?.message).toBe("定位失败");
  });

  it("watchPosition 和 stopWatch", () => {
    const { result: { watchPosition, stopWatch } } = withSetup(() => useLocation());
    watchPosition();
    expect(mockBridge.location.watchPosition).toHaveBeenCalledOnce();
    stopWatch();
  });
});
