import type { BridgeAdapter, BridgeAdapterOverrides } from "../types";
import browserBridge from "./browser";

/**
 * 创建降级适配器 — 未覆盖的能力自动降级到浏览器实现
 * @param platform 平台标识
 * @param overrides 项目侧 SDK 实现覆盖
 */
export function createFallbackAdapter(
  platform: string,
  overrides?: BridgeAdapterOverrides,
): BridgeAdapter {
  const base: BridgeAdapter = { ...browserBridge, platform };
  if (!overrides) return base;
  return mergeAdapter(base, overrides);
}

/**
 * 合并适配器覆盖 — 将项目侧实现合并到基础适配器上
 */
export function mergeAdapter(
  base: BridgeAdapter,
  overrides: BridgeAdapterOverrides,
): BridgeAdapter {
  return {
    platform: base.platform,
    camera: { ...base.camera, ...overrides.camera },
    scanner: { ...base.scanner, ...overrides.scanner },
    location: { ...base.location, ...overrides.location },
    nfc: { ...base.nfc, ...overrides.nfc },
    bluetooth: { ...base.bluetooth, ...overrides.bluetooth },
    file: { ...base.file, ...overrides.file },
    notification: { ...base.notification, ...overrides.notification },
  };
}
