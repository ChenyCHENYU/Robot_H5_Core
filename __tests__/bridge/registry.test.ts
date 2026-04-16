import { describe, it, expect } from "vitest";
import {
  registerAdapter,
  resolveAdapter,
  getRegisteredAdapters,
} from "../../src/bridge/registry";
import type { BridgeAdapter } from "../../src/bridge/types";

describe("bridge registry", () => {
  it("内建适配器列表包含 4 个", () => {
    const names = getRegisteredAdapters();
    expect(names).toContain("browser");
    expect(names).toContain("native");
    expect(names).toContain("dingtalk");
    expect(names).toContain("wechat");
  });

  it("resolveAdapter 可加载 browser 适配器", async () => {
    const adapter = await resolveAdapter("browser");
    expect(adapter.platform).toBe("browser");
  });

  it("resolveAdapter 未知适配器抛错", async () => {
    await expect(resolveAdapter("unknown-platform")).rejects.toThrow(
      "未知适配器",
    );
  });

  it("registerAdapter 注册自定义适配器", async () => {
    const custom: BridgeAdapter = {
      platform: "custom",
      camera: { capture: async () => new File([], "test") },
      scanner: { scan: async () => "code" },
      location: {
        getCurrent: async () => ({
          longitude: 0,
          latitude: 0,
          accuracy: 0,
          timestamp: 0,
        }),
        watchPosition: () => () => {},
      },
      nfc: {
        read: async () => ({ id: "", type: "", records: [] }),
        write: async () => {},
      },
      bluetooth: {
        connect: async () => ({ id: "", name: "", connected: false }),
        disconnect: async () => {},
      },
      file: { preview: async () => {} },
      notification: { register: async () => {}, onMessage: () => () => {} },
    };

    registerAdapter("custom-test", custom);
    const resolved = await resolveAdapter("custom-test");
    expect(resolved.platform).toBe("custom");
  });
});
