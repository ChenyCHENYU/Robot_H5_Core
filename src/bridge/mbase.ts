import { detectMbaseHost } from "./detector";
import {
  MBASE_APP_RESULT_EVENT,
  MBASE_BRIDGE_PROTOCOL,
  MBASE_BRIDGE_SOURCE,
  MbaseBridgeError,
  postMbaseRequest,
  resolveMbaseOrigin,
  type MbaseBridgeOptions,
  type MbaseBridgeRequest,
} from "./transports/mbase";

const DEFAULT_TIMEOUT_MS = 60_000;

export interface MbaseCapabilityOptions extends MbaseBridgeOptions {
  /** 单次能力调用超时；涉及用户选择时建议保留 60 秒以上。 */
  timeoutMs?: number;
}

interface CapabilityResult<T> {
  source: typeof MBASE_BRIDGE_SOURCE;
  type: "capability:result";
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
  reason?: string;
  _debug?: unknown;
}

function parseMessage<T>(value: unknown): CapabilityResult<T> | null {
  if (value && typeof value === "object") return value as CapabilityResult<T>;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as CapabilityResult<T>;
  } catch {
    return null;
  }
}

/** 调用 wl-mbase v1 能力；适用于 Core Hook 尚未封装的相册等扩展能力。 */
export function invokeMbaseCapability<T = Record<string, unknown>>(
  api: string,
  payload: Record<string, unknown> = {},
  options: MbaseCapabilityOptions = {},
): Promise<T> {
  const host = detectMbaseHost();
  if (!host || typeof window === "undefined") {
    return Promise.reject(
      new MbaseBridgeError(
        "unsupported",
        "[h5-core] 当前页面未嵌入基座(mbase)，无法调用宿主能力",
        { api },
      ),
    );
  }

  let expectedOrigin = "";
  if (host === "iframe") {
    try {
      expectedOrigin = resolveMbaseOrigin(options);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  const id = `core:${api}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const cleanup = () => {
      window.removeEventListener("message", onWindowMessage);
      window.removeEventListener(MBASE_APP_RESULT_EVENT, onAppResult as EventListener);
      clearTimeout(timer);
    };
    const finish = (callback: (value: any) => void, value: any) => {
      if (finished) return;
      finished = true;
      cleanup();
      callback(value);
    };
    const handleResult = (raw: unknown) => {
      const message = parseMessage<T>(raw);
      if (
        !message ||
        message.source !== MBASE_BRIDGE_SOURCE ||
        message.type !== "capability:result" ||
        message.id !== id
      ) return;

      if (message.ok) {
        finish(resolve, message.data as T);
        return;
      }
      finish(
        reject,
        new MbaseBridgeError(
          message.error || "invoke_failed",
          message.reason || "[h5-core] 基座能力调用失败",
          { api, id, host, response: message._debug },
        ),
      );
    };
    const onWindowMessage = (event: MessageEvent) => {
      if (
        host !== "iframe" ||
        event.source !== window.parent ||
        event.origin !== expectedOrigin
      ) return;
      handleResult(event.data);
    };
    const onAppResult = (event: Event) => {
      if (host === "app") handleResult((event as CustomEvent<unknown>).detail);
    };

    window.addEventListener("message", onWindowMessage);
    window.addEventListener(MBASE_APP_RESULT_EVENT, onAppResult as EventListener);
    const timer = setTimeout(() => {
      finish(
        reject,
        new MbaseBridgeError(
          "timeout",
          `[h5-core] 基座 ${timeoutMs / 1000} 秒内未响应`,
          { api, id, host },
        ),
      );
    }, timeoutMs);

    const request: MbaseBridgeRequest = {
      source: MBASE_BRIDGE_SOURCE,
      type: "capability:invoke",
      id,
      api,
      payload,
      protocol: MBASE_BRIDGE_PROTOCOL,
      host,
    };
    void postMbaseRequest(host, request, options).catch(error => finish(reject, error));
  });
}
