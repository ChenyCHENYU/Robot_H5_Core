import type { App, Plugin } from "vue";
import type { AppConfig } from "./config/types";
import type { BridgeAdapter } from "./bridge/types";
import { defineAppConfig } from "./config";
import { extendHook, type HookExtension } from "./hooks/extend";
import { registerAdapter } from "./bridge";

/* ------------------------------------------------------------------ */
/*  类型                                                                */
/* ------------------------------------------------------------------ */

export interface H5PluginConfig extends AppConfig {
  /** Hook 行为扩展（before/after 钩子） */
  extensions?: Record<string, HookExtension>;
  /** 自定义 Bridge 适配器 */
  adapters?: Record<string, BridgeAdapter>;
}

/* ------------------------------------------------------------------ */
/*  辅助函数                                                            */
/* ------------------------------------------------------------------ */

/**
 * 定义 h5-core 配置 — 提供完整的 IDE 智能提示
 *
 * @example
 * ```ts
 * // h5.config.ts
 * import { defineH5Config } from "@robot-h5/core";
 *
 * export default defineH5Config({
 *   upload:   { action: "/api/file/upload" },
 *   image:    { maxSize: 1024, quality: 0.8 },
 *   location: { coordType: "gcj02" },
 * });
 * ```
 */
export function defineH5Config(config: H5PluginConfig): H5PluginConfig {
  return config;
}

/* ------------------------------------------------------------------ */
/*  Vue Plugin                                                         */
/* ------------------------------------------------------------------ */

/**
 * Vue 插件 — 一行代码完成 h5-core 全部初始化
 *
 * @example
 * ```ts
 * import { h5Core } from "@robot-h5/core";
 * import h5Config from "./h5.config";
 *
 * createApp(App).use(h5Core, h5Config).mount("#app");
 * ```
 */
export const h5Core: Plugin<[H5PluginConfig?]> = {
  install(app: App, config?: H5PluginConfig) {
    const { extensions, adapters, ...appConfig } = config ?? {};

    // 1. 注册自定义适配器（优先于 Bridge 初始化）
    if (adapters) {
      for (const [name, adapter] of Object.entries(adapters)) {
        registerAdapter(name, adapter);
      }
    }

    // 2. 初始化配置 + Bridge（同步）
    defineAppConfig(app, appConfig);

    // 3. 注册 Hook 扩展
    if (extensions) {
      for (const [hookName, extension] of Object.entries(extensions)) {
        extendHook(hookName, extension);
      }
    }
  },
};
