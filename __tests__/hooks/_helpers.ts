/**
 * 测试辅助：在 Vue app context 中执行 composable
 */
import { createApp, defineComponent, h, type App, type InjectionKey } from "vue";
import { defineAppConfig } from "../../src/config";
import { BRIDGE_KEY } from "../../src/bridge";
import type { BridgeAdapter } from "../../src/bridge/types";

/**
 * 创建一个最小化的 mock BridgeAdapter
 */
export function createMockBridge(
  overrides?: Partial<BridgeAdapter>,
): BridgeAdapter {
  return {
    platform: "mock",
    camera: {
      capture: vi.fn().mockResolvedValue(new File(["img"], "photo.jpg", { type: "image/jpeg" })),
      ...overrides?.camera,
    },
    scanner: {
      scan: vi.fn().mockResolvedValue("https://example.com"),
      ...overrides?.scanner,
    },
    location: {
      getCurrent: vi.fn().mockResolvedValue({
        longitude: 116.397,
        latitude: 39.909,
        accuracy: 10,
        timestamp: Date.now(),
      }),
      watchPosition: vi.fn().mockReturnValue(() => {}),
      ...overrides?.location,
    },
    nfc: {
      read: vi.fn().mockResolvedValue({ id: "nfc-1", type: "NDEF", records: [] }),
      write: vi.fn().mockResolvedValue(undefined),
      ...overrides?.nfc,
    },
    bluetooth: {
      connect: vi.fn().mockResolvedValue({ id: "bt-1", name: "Device", connected: true }),
      disconnect: vi.fn().mockResolvedValue(undefined),
      ...overrides?.bluetooth,
    },
    file: {
      preview: vi.fn().mockResolvedValue(undefined),
      ...overrides?.file,
    },
    notification: {
      register: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn().mockReturnValue(() => {}),
      ...overrides?.notification,
    },
  };
}

/**
 * 在带有 app context 的环境中运行 composable
 * 自动提供 config 和 bridge
 */
export function withSetup<T>(
  composable: () => T,
  bridgeOverrides?: Partial<BridgeAdapter>,
): { result: T; app: App } {
  let result!: T;
  const bridge = createMockBridge(bridgeOverrides);

  const app = createApp(
    defineComponent({
      setup() {
        result = composable();
        return () => h("div");
      },
    }),
  );

  // 注入全局配置
  defineAppConfig(app, {
    image: { maxSize: 1024, quality: 0.8 },
    location: { coordType: "gcj02", timeout: 10000 },
    upload: { action: "/api/upload", chunkSize: 2 * 1024 * 1024 },
  });

  // 注入 Bridge
  app.provide(BRIDGE_KEY, bridge);

  app.mount(document.createElement("div"));

  return { result, app };
}
