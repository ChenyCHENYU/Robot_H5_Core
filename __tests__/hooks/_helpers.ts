/**
 * 测试辅助：创建 Mock Bridge 和 Mock App Config
 */
import { vi } from "vitest";
import type { BridgeAdapter } from "../../src/bridge/types";

export function createMockBridge(): BridgeAdapter {
  return {
    platform: "browser",
    camera: {
      capture: vi
        .fn()
        .mockResolvedValue(
          new File(["img"], "test.jpg", { type: "image/jpeg" }),
        ),
    },
    scanner: {
      scan: vi.fn().mockResolvedValue("https://example.com"),
    },
    location: {
      getCurrent: vi.fn().mockResolvedValue({
        longitude: 116.4,
        latitude: 39.9,
        accuracy: 10,
        timestamp: Date.now(),
      }),
      watchPosition: vi.fn().mockImplementation((cb) => {
        cb({
          longitude: 116.4,
          latitude: 39.9,
          accuracy: 10,
          timestamp: Date.now(),
        });
        return () => {};
      }),
    },
    nfc: {
      read: vi.fn().mockResolvedValue({
        id: "abc",
        type: "NDEF",
        records: [{ type: "text", data: "hello" }],
      }),
      write: vi.fn().mockResolvedValue(undefined),
    },
    bluetooth: {
      connect: vi.fn().mockResolvedValue({
        id: "dev1",
        name: "Device 1",
        connected: true,
      }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    },
    file: {
      preview: vi.fn().mockResolvedValue(undefined),
    },
    notification: {
      register: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn().mockImplementation(() => () => {}),
    },
  };
}

export function createMockConfig() {
  return {
    bridge: { platform: "auto" as const },
    upload: {
      action: "/api/file/upload",
      chunkSize: 2 * 1024 * 1024,
      headers: {},
    },
    image: { maxSize: 1024, quality: 0.8, maxWidth: 1920, maxHeight: 1920 },
    location: { coordType: "gcj02" as const, timeout: 10000 },
  };
}
