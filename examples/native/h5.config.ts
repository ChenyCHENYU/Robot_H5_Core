/**
 * APP WebView 原生桥接 h5.config.ts 参考配置
 *
 * 假设原生 APP 在 window 上挂载了 NativeBridge 对象
 * 实际接口名以项目 APP 文档为准
 */
import { defineH5Config } from "@robot-h5/core";

// 声明原生桥接类型（根据实际 APP 协议定义）
declare global {
  interface Window {
    NativeBridge?: {
      camera: {
        capture(): Promise<{ base64: string; fileName: string }>;
      };
      scanner: {
        scan(): Promise<{ text: string }>;
      };
      location: {
        getCurrent(): Promise<{
          lng: number;
          lat: number;
          accuracy: number;
        }>;
      };
      nfc: {
        read(): Promise<{ id: string; type: string; data: string }>;
        write(data: string): Promise<void>;
      };
    };
  }
}

function getNativeBridge() {
  if (!window.NativeBridge) {
    throw new Error("[h5-core] 原生桥接不可用，请在 APP WebView 中运行");
  }
  return window.NativeBridge;
}

export default defineH5Config({
  bridge: {
    platform: "native",
    nativeUA: "MyApp", // UA 中包含此字符串时自动检测为原生环境
    overrides: {
      // 拍照 — 调用原生能力
      camera: {
        capture: async () => {
          const bridge = getNativeBridge();
          const { base64, fileName } = await bridge.camera.capture();
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "image/jpeg" });
          return new File([blob], fileName, { type: "image/jpeg" });
        },
      },

      // 扫码 — 调用原生能力
      scanner: {
        scan: async () => {
          const bridge = getNativeBridge();
          const { text } = await bridge.scanner.scan();
          return text;
        },
      },

      // 定位 — 调用原生能力
      location: {
        getCurrent: async () => {
          const bridge = getNativeBridge();
          const pos = await bridge.location.getCurrent();
          return {
            longitude: pos.lng,
            latitude: pos.lat,
            accuracy: pos.accuracy,
            timestamp: Date.now(),
          };
        },
        watchPosition: (callback) => {
          // 轮询模拟持续定位
          const timer = setInterval(async () => {
            try {
              const bridge = getNativeBridge();
              const pos = await bridge.location.getCurrent();
              callback({
                longitude: pos.lng,
                latitude: pos.lat,
                accuracy: pos.accuracy,
                timestamp: Date.now(),
              });
            } catch {
              // 静默忽略单次失败
            }
          }, 3000);
          return () => clearInterval(timer);
        },
      },

      // NFC — 调用原生能力
      nfc: {
        read: async () => {
          const bridge = getNativeBridge();
          const result = await bridge.nfc.read();
          return {
            id: result.id,
            type: result.type,
            records: [{ type: "text", data: result.data }],
          };
        },
        write: async (data) => {
          const bridge = getNativeBridge();
          await bridge.nfc.write(JSON.stringify(data));
        },
      },
    },
  },

  upload: {
    action: "/api/file/upload",
    headers: () => ({
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    }),
  },

  image: { maxSize: 1024, quality: 0.8 },
  location: { coordType: "gcj02", timeout: 10000 },
});
