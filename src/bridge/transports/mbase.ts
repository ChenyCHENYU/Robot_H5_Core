import type { MbaseHostType } from "../detector";

export const MBASE_BRIDGE_SOURCE = "mbase-bridge";
export const MBASE_BRIDGE_PROTOCOL = 1;
export const MBASE_APP_RESULT_EVENT = "mbase:bridge-result";

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
};

function transportError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function getUniWebViewBridge(): UniWebViewBridge | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as BridgeWindow).uni;
  return typeof candidate?.postMessage === "function" ? candidate : null;
}

function waitForUniAppBridgeReady(timeoutMs = 5_000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const bridgeWindow = window as BridgeWindow;
  if (bridgeWindow.plus || bridgeWindow.UniAppJSBridge) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      document.removeEventListener("UniAppJSBridgeReady", onReady);
      if (timer) clearTimeout(timer);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };

    document.addEventListener("UniAppJSBridgeReady", onReady, { once: true });
    timer = setTimeout(() => {
      cleanup();
      reject(
        transportError(
          "app_bridge_not_ready",
          "[h5-core] App WebView 桥接未就绪，请稍后重试",
        ),
      );
    }, timeoutMs);
  });
}

/** 懒加载官方 uni.webview SDK，普通 H5、钉钉和微信环境不会执行。 */
async function ensureUniWebViewBridge(): Promise<UniWebViewBridge> {
  const existing = getUniWebViewBridge();
  if (existing) return existing;

  let importedBridge: UniWebViewBridge | null = null;
  try {
    const imported = await import("../../vendor/uni.webview.1.5.8.mjs");
    const candidate = (imported as { default?: UniWebViewBridge }).default;
    importedBridge =
      typeof candidate?.postMessage === "function" ? candidate : null;
    await waitForUniAppBridgeReady();
  } catch (cause) {
    if ((cause as { code?: string })?.code) throw cause;
    throw transportError(
      "app_bridge_load_failed",
      "[h5-core] App WebView 桥接组件加载失败",
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

function getParentOrigin(): string {
  if (typeof document === "undefined" || !document.referrer) return "*";
  try {
    return new URL(document.referrer).origin;
  } catch {
    return "*";
  }
}

/** 按宿主类型发送桥接请求，协议载荷在两条传输路径中保持完全一致。 */
export async function postMbaseRequest(
  host: MbaseHostType,
  request: MbaseBridgeRequest,
): Promise<void> {
  if (typeof window === "undefined") {
    throw transportError(
      "bridge_unavailable",
      "[h5-core] 当前环境不支持基座桥接",
    );
  }

  if (host === "app") {
    const bridge = await ensureUniWebViewBridge();
    bridge.postMessage({ data: request });
    return;
  }

  if (!window.parent || window.parent === window.self) {
    throw transportError(
      "bridge_unavailable",
      "[h5-core] 未嵌入基座(mbase)，无法调用宿主能力",
    );
  }
  window.parent.postMessage(request, getParentOrigin());
}
