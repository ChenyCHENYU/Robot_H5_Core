/**
 * 运行环境自动检测
 */
export type PlatformType = "native" | "dingtalk" | "wechat" | "browser";

/**
 * 检测当前运行平台（钉钉/微信/原生/浏览器）
 */
export function detectPlatform(nativeUA?: string): PlatformType {
  if (typeof navigator === "undefined") return "browser";

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("dingtalk")) return "dingtalk";
  if (ua.includes("micromessenger") || ua.includes("wxwork")) return "wechat";
  if (nativeUA && ua.includes(nativeUA.toLowerCase())) return "native";
  if (typeof (window as any).NativeCallJs !== "undefined") return "native";

  return "browser";
}
