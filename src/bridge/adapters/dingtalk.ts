import { createFallbackAdapter } from "./stub";

/**
 * 钉钉适配器 — 基于浏览器降级
 * 项目侧通过 defineAppConfig({ bridge: { overrides } }) 注入 dingtalk-jsapi 实现
 * 未覆盖的能力自动使用浏览器降级方案
 */
export default createFallbackAdapter("dingtalk");
