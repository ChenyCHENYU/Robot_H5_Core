import type { BridgeAdapter } from "./types";
import browserAdapter from "./adapters/browser";
import nativeAdapter from "./adapters/native";
import dingtalkAdapter from "./adapters/dingtalk";
import mbaseAdapter from "./adapters/mbase";
import wechatAdapter from "./adapters/wechat";

type AdapterEntry = BridgeAdapter | (() => BridgeAdapter);

/**
 * 适配器注册表 — 支持内建 + 项目自定义
 */
const adapterRegistry = new Map<string, AdapterEntry>();

// 内建适配器（静态导入 — 各适配器 <300B，无需代码分割）
adapterRegistry.set("browser", browserAdapter);
adapterRegistry.set("native", nativeAdapter);
adapterRegistry.set("dingtalk", dingtalkAdapter);
adapterRegistry.set("mbase", mbaseAdapter);
adapterRegistry.set("wechat", wechatAdapter);

/**
 * 注册自定义适配器（项目侧扩展）
 *
 * @example
 * ```ts
 * registerAdapter('robot-native-v2', myCustomAdapter);
 * ```
 */
export function registerAdapter(
  name: string,
  adapter: BridgeAdapter | (() => BridgeAdapter),
): void {
  adapterRegistry.set(name, adapter);
}

/**
 * 解析适配器实例（同步）
 */
export function resolveAdapter(name: string): BridgeAdapter {
  const entry = adapterRegistry.get(name);
  if (!entry) {
    throw new Error(
      `[h5-core] 未知适配器: "${name}"。可用: ${[...adapterRegistry.keys()].join(", ")}`,
    );
  }
  return typeof entry === "function" ? entry() : entry;
}

/**
 * 获取所有已注册的适配器名称
 */
export function getRegisteredAdapters(): string[] {
  return [...adapterRegistry.keys()];
}
