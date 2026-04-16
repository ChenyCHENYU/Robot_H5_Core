import type { BridgeAdapter } from "./types";

type AdapterFactory = () => BridgeAdapter | Promise<BridgeAdapter>;

/**
 * 适配器注册表 — 支持内建 + 项目自定义
 */
const adapterRegistry = new Map<string, AdapterFactory>();

// 内建适配器（动态导入，按需加载）
adapterRegistry.set("browser", () =>
  import("./adapters/browser").then((m) => m.default),
);
adapterRegistry.set("native", () =>
  import("./adapters/native").then((m) => m.default),
);
adapterRegistry.set("dingtalk", () =>
  import("./adapters/dingtalk").then((m) => m.default),
);
adapterRegistry.set("wechat", () =>
  import("./adapters/wechat").then((m) => m.default),
);

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
  adapter: BridgeAdapter | AdapterFactory,
): void {
  adapterRegistry.set(
    name,
    typeof adapter === "function" ? (adapter as AdapterFactory) : () => adapter,
  );
}

/**
 * 解析适配器实例
 */
export async function resolveAdapter(name: string): Promise<BridgeAdapter> {
  const factory = adapterRegistry.get(name);
  if (!factory) {
    throw new Error(
      `[h5-core] 未知适配器: "${name}"。可用: ${[...adapterRegistry.keys()].join(", ")}`,
    );
  }
  return factory();
}

/**
 * 获取所有已注册的适配器名称
 */
export function getRegisteredAdapters(): string[] {
  return [...adapterRegistry.keys()];
}
