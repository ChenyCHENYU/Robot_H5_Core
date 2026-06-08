import { createFallbackAdapter } from "./stub";
import { isEmbedded } from "../detector";
import type { Coordinates, ScanOptions } from "../types";

/**
 * mbase 基座桥接适配器
 *
 * 适用场景：本应用作为「子应用」以 iframe 形式嵌入移动端门户基座(mbase)，
 * 且运行在钉钉客户端内。钉钉 WebView 安全策略禁止 iframe 子页面直接调用
 * 摄像头 / 定位 JSAPI，只有基座（钉钉入口页）能调用。因此子应用通过
 * postMessage 请求基座代为调用，基座完成 dd.config 鉴权后执行并回传结果。
 *
 * 非嵌入场景（独立浏览器 / 微信 web-view）不会解析到本适配器（见 detector.ts
 * 的 detectPlatform），自动使用 browser / wechat 适配器的原生能力，互不影响。
 *
 * 与基座约定的协议（与 mbase webview 容器一致，禁止改动字段名）：
 *   请求：{ source:'mbase-bridge', type:'capability:invoke', id, api, payload }
 *   响应：{ source:'mbase-bridge', type:'capability:result', id, ok, data?, error?, reason? }
 *
 * 仅 camera / scanner / location 走桥接；nfc / bluetooth / file / notification
 * 沿用 browser 降级实现（基座未代理这些能力）。
 */

/** 桥接消息来源标识，必须与基座保持一致 */
const BRIDGE_SOURCE = "mbase-bridge";

/** 桥接请求默认超时（拍照需用户操作，给足时间） */
const BRIDGE_TIMEOUT_MS = 60_000;

/** 生成桥接请求唯一 id */
function genId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 安全解析 postMessage 数据（对象直接用，字符串尝试 JSON） */
function parseData(data: unknown): Record<string, any> | null {
  if (data && typeof data === "object") return data as Record<string, any>;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 向基座发起一次能力调用，返回 Promise。
 * 未嵌入基座（顶层窗口）时立即拒绝，避免向自身 postMessage 后无限等待。
 */
function invokeBridge<T>(
  api: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!isEmbedded() || typeof window === "undefined" || !window.parent) {
      reject(new Error("[h5-core] 未嵌入基座(mbase)，无法通过桥接调用原生能力"));
      return;
    }

    const id = genId();
    let done = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };

    const onMessage = (event: MessageEvent) => {
      const msg = parseData(event.data);
      if (
        !msg ||
        msg.source !== BRIDGE_SOURCE ||
        msg.type !== "capability:result" ||
        msg.id !== id
      ) {
        return;
      }
      done = true;
      cleanup();
      if (msg.ok) {
        resolve(msg.data as T);
      } else {
        const err = new Error(
          msg.reason || msg.error || "[h5-core] 基座能力调用失败",
        ) as Error & { code?: string };
        err.code = msg.error;
        reject(err);
      }
    };

    const timer = setTimeout(() => {
      if (done) return;
      cleanup();
      const err = new Error(
        "[h5-core] 基座未响应（请确认在门户内打开）",
      ) as Error & { code?: string };
      err.code = "timeout";
      reject(err);
    }, BRIDGE_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { source: BRIDGE_SOURCE, type: "capability:invoke", id, api, payload: payload || {} },
      "*",
    );
  });
}

/**
 * 规整钉钉返回的 base64：
 * 钉钉 biz.util.uploadImageFromCamera 返回的 base64 常带 MIME 换行/空白，
 * 部分版本用 URL-safe 字符(-、_)或缺少 = 填充，标准 atob 会直接抛错，统一规整。
 */
function sanitizeBase64(raw: string): string {
  let b = raw
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = b.length % 4;
  if (pad) b += "=".repeat(4 - pad);
  return b;
}

/** base64 / dataURI → File（钉钉 iframe 沙箱可能拦截 fetch(data:)，故直接 atob） */
function base64ToFile(src: string, filename: string): File {
  const mimeMatch = /^data:([^;]+);base64,/.exec(src);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const rawB64 = mimeMatch ? src.slice(mimeMatch[0].length) : src;
  const b64 = sanitizeBase64(rawB64);
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    throw new Error("[h5-core] 图片解码失败，请重试");
  }
}

/** core 扫码类型 → 钉钉 scan 类型 */
function toDingTalkScanType(type?: ScanOptions["type"]): string {
  if (type === "barcode") return "barCode";
  if (type === "all") return "all";
  return "qrCode";
}

/** 基座 getLocation 返回结构（字段以基座协议为准） */
interface BridgeLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  coordinate?: number;
}

/** 经基座桥接获取一次定位并映射为统一 Coordinates */
async function getCurrentLocation(): Promise<Coordinates> {
  const loc = await invokeBridge<BridgeLocation>("getLocation");
  return {
    longitude: loc.longitude,
    latitude: loc.latitude,
    accuracy: loc.accuracy ?? 0,
    timestamp: Date.now(),
  };
}

export default createFallbackAdapter("mbase", {
  camera: {
    async capture(): Promise<File> {
      const data = await invokeBridge<{ images?: string[] }>("takePhoto", {
        max: 1,
      });
      const images = data?.images || [];
      if (!images.length) {
        throw new Error("[h5-core] 基座未返回拍照结果");
      }
      return base64ToFile(images[0], `mbase_photo_${Date.now()}.jpg`);
    },
  },

  scanner: {
    async scan(options?: ScanOptions): Promise<string> {
      const data = await invokeBridge<{ text?: string }>("scan", {
        type: toDingTalkScanType(options?.type),
      });
      return data?.text || "";
    },
  },

  location: {
    getCurrent(): Promise<Coordinates> {
      return getCurrentLocation();
    },

    /**
     * 基座桥接协议为单次定位，不支持持续监听。
     * 此处降级为「单次取点后回调一次」，返回的取消函数为 no-op，
     * 避免子应用调用 watchPosition 时报错或永久挂起。
     */
    watchPosition(callback: (pos: Coordinates) => void): () => void {
      let cancelled = false;
      getCurrentLocation()
        .then((pos) => {
          if (!cancelled) callback(pos);
        })
        .catch(() => {
          /* 单次定位失败，静默；调用方可通过 getCurrent 自行处理错误 */
        });
      return () => {
        cancelled = true;
      };
    },
  },
});
