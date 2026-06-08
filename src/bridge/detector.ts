/**
 * 运行环境自动检测
 */
export type PlatformType =
  | "native"
  | "dingtalk"
  | "mbase"
  | "wechat"
  | "browser";

/**
 * 当前页面是否被嵌入到父级框架（iframe）中。
 * 跨域访问 window.parent 抛错时，说明确实处于跨域 iframe 内，判定为已嵌入。
 */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.parent && window.parent !== window.self;
  } catch {
    return true;
  }
}

/**
 * 检测当前运行平台（钉钉/mbase/微信/原生/浏览器）
 *
 * 钉钉环境下，若页面以 iframe 形式嵌入基座(mbase)，钉钉 WebView 禁止子页面
 * 直接调用拍照/定位 JSAPI，需经基座桥接，故返回 "mbase"；钉钉内顶层页面
 * （非嵌入）仍返回 "dingtalk"，行为保持不变。
 */
export function detectPlatform(nativeUA?: string): PlatformType {
  if (typeof navigator === "undefined") return "browser";

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("dingtalk")) return isEmbedded() ? "mbase" : "dingtalk";
  if (ua.includes("micromessenger") || ua.includes("wxwork")) return "wechat";
  if (nativeUA && ua.includes(nativeUA.toLowerCase())) return "native";
  if (typeof (window as any).NativeCallJs !== "undefined") return "native";

  return "browser";
}
