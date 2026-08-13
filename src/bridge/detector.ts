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
/** 门户写入子应用 URL 的显式来源标记。 */
export const MBASE_PORTAL_FROM_PARAM = "from";
export const MBASE_PORTAL_FROM_VALUE = "portal";
export const MBASE_PORTAL_SESSION_KEY = "h5_login_from";

let cachedMbaseHost: MbaseHostType | null = null;

function readUrlParam(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    const search = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.split("?")[1] || "";
    return search.get(name) || new URLSearchParams(hashQuery).get(name) || "";
  } catch {
    return "";
  }
}

function hasPortalMarker(): boolean {
  if (readUrlParam(MBASE_PORTAL_FROM_PARAM) === MBASE_PORTAL_FROM_VALUE) {
    return true;
  }
  try {
    return sessionStorage.getItem(MBASE_PORTAL_SESSION_KEY) === MBASE_PORTAL_FROM_VALUE;
  } catch {
    return false;
  }
}

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

  return readUrlParam(MBASE_APP_HOST_PARAM) === "app";
}

/** 返回当前 mbase 承载方式；非基座环境返回 null。 */
export function detectMbaseHost(): MbaseHostType | null {
  if (cachedMbaseHost) return cachedMbaseHost;
  if (isMbaseAppWebView()) {
    cachedMbaseHost = "app";
    return cachedMbaseHost;
  }
  if (!isEmbedded()) return null;

  const userAgent = typeof navigator === "undefined"
    ? ""
    : navigator.userAgent.toLowerCase();
  // from=portal/session 标记覆盖普通 H5；钉钉 iframe 保留 1.1.x 兼容行为。
  if (hasPortalMarker() || userAgent.includes("dingtalk")) {
    cachedMbaseHost = "iframe";
    return cachedMbaseHost;
  }
  return null;
}

/** 测试、HMR 或同页宿主切换时清理检测缓存。业务代码通常无需调用。 */
export function resetMbaseHostCache(): void {
  cachedMbaseHost = null;
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
  if (detectMbaseHost()) return "mbase";
  if (ua.includes("dingtalk")) return "dingtalk";
  if (ua.includes("micromessenger") || ua.includes("wxwork")) return "wechat";
  if (nativeUA && ua.includes(nativeUA.toLowerCase())) return "native";
  if (typeof (window as any).NativeCallJs !== "undefined") return "native";

  return "browser";
}
