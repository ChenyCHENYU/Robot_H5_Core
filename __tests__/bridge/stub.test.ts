import { describe, it, expect } from "vitest";
import { createFallbackAdapter, mergeAdapter } from "../../src/bridge/adapters/stub";
import type { BridgeAdapter } from "../../src/bridge/types";

describe("createFallbackAdapter", () => {
  it("创建的适配器 platform 正确", () => {
    const adapter = createFallbackAdapter("dingtalk");
    expect(adapter.platform).toBe("dingtalk");
  });

  it("未覆盖的能力降级到浏览器实现", () => {
    const adapter = createFallbackAdapter("native");
    expect(adapter.camera).toBeDefined();
    expect(adapter.camera.capture).toBeTypeOf("function");
    expect(adapter.location.getCurrent).toBeTypeOf("function");
    expect(adapter.scanner.scan).toBeTypeOf("function");
  });

  it("传入 overrides 时覆盖对应能力", () => {
    const mockCapture = async () => new File([""], "mock.jpg");
    const adapter = createFallbackAdapter("native", {
      camera: { capture: mockCapture },
    });
    expect(adapter.camera.capture).toBe(mockCapture);
    // 其他能力仍为浏览器降级
    expect(adapter.location.getCurrent).toBeTypeOf("function");
  });
});

describe("mergeAdapter", () => {
  it("覆盖指定能力，保留未覆盖能力", () => {
    const base = createFallbackAdapter("test") as BridgeAdapter;
    const mockScan = async () => "merged-result";
    const merged = mergeAdapter(base, {
      scanner: { scan: mockScan },
    });

    expect(merged.platform).toBe("test");
    expect(merged.scanner.scan).toBe(mockScan);
    expect(merged.camera.capture).toBe(base.camera.capture);
    expect(merged.location).toEqual(base.location);
  });

  it("部分覆盖能力组内的方法", () => {
    const base = createFallbackAdapter("test") as BridgeAdapter;
    const mockGetCurrent = async () => ({
      longitude: 116.4,
      latitude: 39.9,
      accuracy: 10,
      timestamp: Date.now(),
    });
    const merged = mergeAdapter(base, {
      location: { getCurrent: mockGetCurrent },
    });

    expect(merged.location.getCurrent).toBe(mockGetCurrent);
    // watchPosition 保留基础实现
    expect(merged.location.watchPosition).toBe(base.location.watchPosition);
  });

  it("空 overrides 返回原适配器结构", () => {
    const base = createFallbackAdapter("test") as BridgeAdapter;
    const merged = mergeAdapter(base, {});
    expect(merged.platform).toBe("test");
    expect(merged.camera.capture).toBe(base.camera.capture);
  });
});
