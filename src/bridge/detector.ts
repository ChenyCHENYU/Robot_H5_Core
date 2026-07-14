/**
 * 运行环境自动检测
 */
export type PlatformType =
  | "native"
  | "dingtalk"
  | "mbase"
  | "wechat"
  | "browser";

export type MbaseHostType = "iframe" | "app";

/** App 基座写入子应用 URL 的显式宿主标记。 */
export const MBASE_APP_HOST_PARAM = "mbase_host";

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
 * 当前页面是否由 mbase App WebView 承载。
 *
 * App WebView 不是 iframe，无法依赖 window.parent 判断。基座会在启动 URL 中
 * 注入 `mbase_host=app`；全局标记仅用于原生宿主提前注入及自动化测试。
 */
export function isMbaseAppWebView(): boolean {
  if (typeof window === "undefined") return false;

  const explicitHost = (window as Window & {
    __MBASE_BRIDGE_HOST__?: string;
  }).__MBASE_BRIDGE_HOST__;
  if (explicitHost === "app") return true;

  try {
    return new URLSearchParams(window.location.search).get(
      MBASE_APP_HOST_PARAM,
    ) === "app";
  } catch {
    return false;
  }
}

/** 返回当前 mbase 承载方式；非基座环境返回 null。 */
export function detectMbaseHost(): MbaseHostType | null {
  if (isMbaseAppWebView()) return "app";
  if (isEmbedded()) return "iframe";
  return null;
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

  // App WebView 没有 iframe 层级关系，必须优先识别基座显式标记。
  if (isMbaseAppWebView()) return "mbase";
  if (ua.includes("dingtalk")) return isEmbedded() ? "mbase" : "dingtalk";
  if (ua.includes("micromessenger") || ua.includes("wxwork")) return "wechat";
  if (nativeUA && ua.includes(nativeUA.toLowerCase())) return "native";
  if (typeof (window as any).NativeCallJs !== "undefined") return "native";

  return "browser";
}
