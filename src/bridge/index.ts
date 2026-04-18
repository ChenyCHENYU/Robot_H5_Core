import { inject, type InjectionKey } from "vue";
import { detectPlatform } from "./detector";
import { resolveAdapter } from "./registry";
import { mergeAdapter } from "./adapters/stub";
import type { BridgeAdapter, BridgeAdapterOverrides } from "./types";

export { registerAdapter, getRegisteredAdapters } from "./registry";
export { detectPlatform } from "./detector";
export { mergeAdapter } from "./adapters/stub";
export type {
  BridgeAdapter,
  BridgeAdapterOverrides,
  CameraOptions,
  ScanOptions,
  LocationQueryOptions,
  Coordinates,
  NFCData,
  BluetoothDeviceInfo,
  PushMessage,
} from "./types";

const BRIDGE_KEY: InjectionKey<BridgeAdapter> = Symbol("robot-h5-bridge");

let bridgeInstance: BridgeAdapter | null = null;

/**
 * 创建 Bridge 实例（单例）
 * 自动检测宿主环境，加载对应适配器
 */
export async function createBridge(
  platform?: string,
  nativeUA?: string,
  overrides?: BridgeAdapterOverrides,
): Promise<BridgeAdapter> {
  if (bridgeInstance) return bridgeInstance;

  const resolved =
    !platform || platform === "auto" ? detectPlatform(nativeUA) : platform;

  const base = await resolveAdapter(resolved);
  bridgeInstance = overrides ? mergeAdapter(base, overrides) : base;
  return bridgeInstance;
}

/**
 * 重置 Bridge 实例（热更新 / 测试切换平台时使用）
 */
export function resetBridge(): void {
  bridgeInstance = null;
}

/**
 * 在 Composition API 中获取 Bridge 实例
 *
 * @example
 * ```ts
 * const bridge = useBridge();
 * const file = await bridge.camera.capture();
 * ```
 */
export function useBridge(): BridgeAdapter {
  const bridge = inject(BRIDGE_KEY);
  if (!bridge) {
    throw new Error(
      "[h5-core] Bridge 未初始化。请在 main.ts 中调用 defineAppConfig()",
    );
  }
  return bridge;
}

/**
 * 供 defineAppConfig 内部使用：提供 Bridge 到 Vue 应用
 */
export { BRIDGE_KEY };
