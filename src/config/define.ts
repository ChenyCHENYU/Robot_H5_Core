import { inject, type App, type InjectionKey } from "vue";
import { defaults } from "./defaults";
import type { AppConfig } from "./types";
import { createBridge, BRIDGE_KEY } from "../bridge";

const CONFIG_KEY: InjectionKey<AppConfig> = Symbol("robot-h5-config");

/**
 * 深合并两个对象（仅合并普通对象，不合并数组或函数）
 */
function deepMerge<T extends Record<string, any>>(
  base: T,
  ...sources: Array<Partial<T> | undefined>
): T {
  const result = { ...base };
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source) as Array<keyof T>) {
      const val = source[key];
      if (
        val !== undefined &&
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        typeof result[key] === "object"
      ) {
        result[key] = deepMerge(result[key] as any, val as any);
      } else if (val !== undefined) {
        result[key] = val as T[keyof T];
      }
    }
  }
  return result;
}

/**
 * 在 app 初始化时调用，注入全局配置
 *
 * @example
 * ```ts
 * defineAppConfig(app, {
 *   bridge: { platform: 'auto' },
 *   image: { maxSize: 500 },
 * });
 * ```
 */
export async function defineAppConfig(
  app: App,
  config: AppConfig = {},
): Promise<void> {
  const merged = deepMerge(defaults, config);
  app.provide(CONFIG_KEY, merged);

  const bridge = await createBridge(
    merged.bridge?.platform,
    merged.bridge?.nativeUA,
    merged.bridge?.overrides,
  );
  app.provide(BRIDGE_KEY, bridge);
}

/**
 * 在 Composition API 中获取全局配置
 * 如果未调用 defineAppConfig，返回默认值
 */
export function useAppConfig(): AppConfig {
  return inject(CONFIG_KEY, defaults);
}

export { deepMerge };
