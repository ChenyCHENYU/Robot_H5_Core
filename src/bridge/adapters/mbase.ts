import { createFallbackAdapter } from "./stub";
import { invokeMbaseCapability } from "../mbase";
import type {
  Coordinates,
  LocationQueryOptions,
  ScanOptions,
} from "../types";

/**
 * mbase 基座桥接适配器
 *
 * 适用场景：子应用运行在钉钉 iframe 或 mbase App WebView 中。两种宿主共用
 * 能力协议，由 transport 分别通过 window.postMessage 或 uni.postMessage 发起，
 * 基座完成平台鉴权和原生能力调用后回传结果。
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
  altitude?: number;
  address?: string;
  coordinate?: number;
  coordinateSystem?: Coordinates["coordinateSystem"];
  rawCoordinateSystem?: Coordinates["rawCoordinateSystem"];
  converted?: boolean;
  provider?: string;
  sourceApi?: string;
  platform?: string;
  sampleCount?: number;
  timestamp?: number;
  locatedAt?: number;
}

/** 经基座桥接获取一次定位并映射为统一 Coordinates */
async function getCurrentLocation(
  options?: LocationQueryOptions,
): Promise<Coordinates> {
  const loc = await invokeMbaseCapability<BridgeLocation>("getLocation", {
    timeout: options?.timeout,
    enableHighAccuracy: options?.enableHighAccuracy,
    coordinateSystem: options?.coordinateSystem,
  });
  return {
    longitude: loc.longitude,
    latitude: loc.latitude,
    altitude: loc.altitude,
    accuracy: loc.accuracy ?? 0,
    timestamp: loc.locatedAt ?? loc.timestamp ?? Date.now(),
    coordinateSystem: loc.coordinateSystem,
    rawCoordinateSystem: loc.rawCoordinateSystem,
    converted: loc.converted,
    provider: loc.provider,
    sourceApi: loc.sourceApi,
    platform: loc.platform,
    sampleCount: loc.sampleCount,
  };
}

export default createFallbackAdapter("mbase", {
  camera: {
    async capture(): Promise<File> {
      const data = await invokeMbaseCapability<{ images?: string[] }>("takePhoto", {
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
      const data = await invokeMbaseCapability<{ text?: string }>("scan", {
        type: toDingTalkScanType(options?.type),
      });
      return data?.text || "";
    },
  },

  location: {
    getCurrent(options?: LocationQueryOptions): Promise<Coordinates> {
      return getCurrentLocation(options);
    },

    /**
     * 基座桥接协议为单次定位，不支持持续监听。
     * 此处降级为「单次取点后回调一次」，返回的取消函数为 no-op，
     * 避免子应用调用 watchPosition 时报错或永久挂起。
     */
    watchPosition(
      callback: (pos: Coordinates) => void,
      options?: LocationQueryOptions,
    ): () => void {
      let cancelled = false;
      getCurrentLocation(options)
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
