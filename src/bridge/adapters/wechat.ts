import { createFallbackAdapter } from "./stub";

/**
 * 微信/企业微信适配器 — 基于浏览器降级
 * 项目侧通过 defineAppConfig({ bridge: { overrides } }) 注入 weixin-js-sdk 实现
 * 未覆盖的能力自动使用浏览器降级方案
 */
export default createFallbackAdapter("wechat");
