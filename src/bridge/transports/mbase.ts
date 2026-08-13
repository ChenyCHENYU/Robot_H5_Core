import { detectMbaseHost, type MbaseHostType } from "../detector";

export const MBASE_BRIDGE_SOURCE = "mbase-bridge";
export const MBASE_BRIDGE_PROTOCOL = 1;
export const MBASE_APP_RESULT_EVENT = "mbase:bridge-result";

export interface MbaseBridgeOptions {
  /** 门户精确 origin，例如 https://portal.example.com；禁止使用 *。 */
  origin?: string;
  /** App/PDA 原生桥默认等待时间。 */
  appBridgeTimeoutMs?: number;
}

export interface MbaseBridgeRequest {
  source: typeof MBASE_BRIDGE_SOURCE;
  type: "capability:invoke";
  id: string;
  api: string;
  payload: Record<string, unknown>;
  protocol: typeof MBASE_BRIDGE_PROTOCOL;
  host: MbaseHostType;
}

interface UniWebViewBridge {
  postMessage(options: { data: unknown }): void;
}

type BridgeWindow = Window & {
  uni?: UniWebViewBridge;
  plus?: unknown;
  UniAppJSBridge?: unknown;
  __dcloud_weex_postMessage?: unknown;
  __dcloud_weex_?: unknown;
};

const DEFAULT_APP_BRIDGE_TIMEOUT_MS = 6_000;
let configuredOptions: MbaseBridgeOptions = {};

/**
 *
 */
export class MbaseBridgeError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "MbaseBridgeError";
    this.code = code;
    this.details = details;
  }
}

function transportError(
  code: string,
  message: string,
  details?: unknown,
): MbaseBridgeError {
  return new MbaseBridgeError(code, message, details);
}

/**
 *
 */
export function configureMbaseBridge(options?: MbaseBridgeOptions): void {
  const origin = String(options?.origin || "").trim();
  if (origin === "*") {
    throw transportError(
      "mbase_origin_invalid",
      "[h5-core] mbase origin 禁止配置为 *",
    );
  }
  configuredOptions = {
    ...(origin ? { origin } : {}),
    ...(options?.appBridgeTimeoutMs
      ? { appBridgeTimeoutMs: options.appBridgeTimeoutMs }
      : {}),
  };
}

/**
 *
 */
export function getMbaseBridgeOptions(): Readonly<MbaseBridgeOptions> {
  return { ...configuredOptions };
}

function getUniWebViewBridge(): UniWebViewBridge | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as BridgeWindow).uni;
  return typeof candidate?.postMessage === "function" ? candidate : null;
}

function hasNativeBridge(): boolean {
  if (typeof window === "undefined") return false;
  const bridgeWindow = window as BridgeWindow;
  return Boolean(
    bridgeWindow.plus ||
    bridgeWindow.UniAppJSBridge ||
    bridgeWindow.__dcloud_weex_postMessage ||
    bridgeWindow.__dcloud_weex_,
  );
}

function waitForNativeBridgeReady(timeoutMs: number): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (hasNativeBridge()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      document.removeEventListener("UniAppJSBridgeReady", probe);
      document.removeEventListener("plusready", probe);
      if (timer) clearTimeout(timer);
    };
    const probe = () => {
      if (hasNativeBridge()) {
        cleanup();
        resolve();
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        cleanup();
        reject(
          transportError(
            "app_bridge_not_ready",
            "[h5-core] App WebView 原生桥接未就绪，请稍后重试",
            getMbaseTransportStatus(),
          ),
        );
        return;
      }
      timer = setTimeout(probe, 80);
    };

    document.addEventListener("UniAppJSBridgeReady", probe);
    document.addEventListener("plusready", probe);
    probe();
  });
}

/** 懒加载随包发布的官方 uni.webview SDK，其他宿主不会执行。 */
async function ensureUniWebViewBridge(
  timeoutMs: number,
): Promise<UniWebViewBridge> {
  const existing = getUniWebViewBridge();
  // 宿主已注入可调用 SDK 时直接复用；兼容不暴露 plus 等全局对象的定制 WebView。
  if (existing) return existing;

  let importedBridge: UniWebViewBridge | null = null;
  try {
    const imported = await import("../../vendor/uni.webview.1.5.8.mjs");
    const candidate = (imported as { default?: UniWebViewBridge }).default;
    importedBridge = typeof candidate?.postMessage === "function" ? candidate : null;
    await waitForNativeBridgeReady(timeoutMs);
  } catch (cause) {
    if (cause instanceof MbaseBridgeError) throw cause;
    throw transportError(
      "app_bridge_load_failed",
      "[h5-core] App WebView 桥接组件加载失败",
      cause,
    );
  }

  const loaded = getUniWebViewBridge() || importedBridge;
  if (!loaded) {
    throw transportError(
      "app_bridge_unavailable",
      "[h5-core] 当前 WebView 不支持 uni.postMessage",
    );
  }
  return loaded;
}

/**
 *
 */
function getOriginCandidate(options?: MbaseBridgeOptions): string {
  if (options?.origin) return String(options.origin).trim();
  if (configuredOptions.origin) return String(configuredOptions.origin).trim();
  if (typeof document !== "undefined" && document.referrer) {
    return document.referrer.trim();
  }
  return "";
}

/**
 *
 */
export function resolveMbaseOrigin(options?: MbaseBridgeOptions): string {
  if (typeof window === "undefined") {
    throw transportError("bridge_unavailable", "[h5-core] 当前环境不支持 WebView 桥接");
  }
  const candidate = getOriginCandidate(options);
  if (!candidate || candidate === "*") {
    throw transportError(
      "mbase_origin_missing",
      "[h5-core] 缺少可信门户 origin，已阻止不安全的 iframe 消息发送",
    );
  }
  try {
    const {origin} = new URL(candidate, window.location.origin);
    if (!origin || origin === "null") throw new Error("opaque origin");
    return origin;
  } catch (cause) {
    throw transportError(
      "mbase_origin_invalid",
      "[h5-core] mbase origin 不是有效地址",
      cause,
    );
  }
}

/**
 *
 */
export async function waitForMbaseAppBridge(
  timeoutMs = configuredOptions.appBridgeTimeoutMs || DEFAULT_APP_BRIDGE_TIMEOUT_MS,
): Promise<void> {
  if (typeof window === "undefined") {
    throw transportError("bridge_unavailable", "[h5-core] 当前环境不支持 WebView 桥接");
  }
  await ensureUniWebViewBridge(timeoutMs);
}

/** 按宿主类型发送能力请求，两条传输路径保持同一协议载荷。 */
export async function postMbaseRequest(
  host: MbaseHostType,
  request: MbaseBridgeRequest,
  options?: MbaseBridgeOptions,
): Promise<void> {
  if (typeof window === "undefined") {
    throw transportError("bridge_unavailable", "[h5-core] 当前环境不支持基座桥接");
  }
  if (host === "app") {
    const bridge = await ensureUniWebViewBridge(
      options?.appBridgeTimeoutMs ||
      configuredOptions.appBridgeTimeoutMs ||
      DEFAULT_APP_BRIDGE_TIMEOUT_MS,
    );
    bridge.postMessage({ data: request });
    return;
  }
  if (!window.parent || window.parent === window.self) {
    throw transportError(
      "bridge_unavailable",
      "[h5-core] 未嵌入基座(mbase)，无法调用宿主能力",
    );
  }
  window.parent.postMessage(request, resolveMbaseOrigin(options));
}

/** 发送标题、导航、登出等非能力协议消息。 */
export async function postMbaseMessage(
  message: Record<string, unknown>,
  options?: MbaseBridgeOptions,
): Promise<void> {
  const host = detectMbaseHost();
  if (!host) {
    throw transportError("bridge_unavailable", "[h5-core] 当前页面未运行在 wl-mbase 宿主中");
  }
  if (host === "app") {
    const bridge = await ensureUniWebViewBridge(
      options?.appBridgeTimeoutMs ||
      configuredOptions.appBridgeTimeoutMs ||
      DEFAULT_APP_BRIDGE_TIMEOUT_MS,
    );
    bridge.postMessage({ data: message });
    return;
  }
  if (!window.parent || window.parent === window.self) {
    throw transportError("bridge_unavailable", "[h5-core] 当前页面未嵌入 wl-mbase");
  }
  window.parent.postMessage(message, resolveMbaseOrigin(options));
}

/**
 *
 */
export function getMbaseTransportStatus(options?: MbaseBridgeOptions) {
  let portalOrigin = "";
  try {
    portalOrigin = resolveMbaseOrigin(options);
  } catch {
    portalOrigin = "";
  }
  return {
    host: detectMbaseHost(),
    sdkPostMessage: typeof window !== "undefined" && Boolean(getUniWebViewBridge()),
    nativeBridge: hasNativeBridge(),
    portalOrigin,
  };
}
