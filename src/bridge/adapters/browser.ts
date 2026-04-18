import type {
  BridgeAdapter,
  CameraOptions,
  Coordinates,
  NFCData,
  BluetoothDeviceInfo,
  ScanOptions,
  LocationQueryOptions,
} from "../types";

/**
 * 浏览器降级适配器
 * 不在 APP / 钉钉 / 微信 中时，使用 Web 标准 API 尽可能提供能力
 */
const notSupported = (name: string) => () => {
  throw new Error(`[h5-core] 当前浏览器不支持 ${name}`);
};

const browserBridge: BridgeAdapter = {
  platform: "browser",

  camera: {
    capture(options?: CameraOptions): Promise<File> {
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        if (options?.source === "camera") {
          input.setAttribute("capture", "environment");
        }

        input.onchange = () => {
          const file = input.files?.[0];
          if (file) resolve(file);
          else reject(new Error("未选择文件"));
        };

        // 用户取消选择时拒绝 Promise，避免永远 pending
        input.oncancel = () => reject(new Error("用户取消选择"));

        input.click();
      });
    },
  },

  scanner: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scan(_options?: ScanOptions): Promise<string> {
      // 浏览器无原生扫码能力，需接入第三方库（如 jsQR）
      return Promise.reject(
        new Error("[h5-core] 浏览器环境请接入 jsQR 库实现扫码"),
      );
    },
  },

  location: {
    getCurrent(options?: LocationQueryOptions): Promise<Coordinates> {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error("[h5-core] 浏览器不支持 Geolocation"));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              longitude: pos.coords.longitude,
              latitude: pos.coords.latitude,
              altitude: pos.coords.altitude ?? undefined,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            }),
          (err) => reject(new Error(`[h5-core] 定位失败: ${err.message}`)),
          {
            enableHighAccuracy: options?.enableHighAccuracy ?? true,
            timeout: options?.timeout ?? 10000,
          },
        );
      });
    },

    watchPosition(
      callback: (pos: Coordinates) => void,
      options?: LocationQueryOptions,
    ): () => void {
      const id = navigator.geolocation.watchPosition(
        (pos) =>
          callback({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            altitude: pos.coords.altitude ?? undefined,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }),
        undefined,
        { enableHighAccuracy: options?.enableHighAccuracy ?? true },
      );
      return () => navigator.geolocation.clearWatch(id);
    },
  },

  nfc: {
    read: notSupported("NFC") as () => Promise<NFCData>,
    write: notSupported("NFC") as () => Promise<void>,
  },

  bluetooth: {
    connect: notSupported("Bluetooth") as () => Promise<BluetoothDeviceInfo>,
    disconnect: notSupported("Bluetooth") as () => Promise<void>,
  },

  file: {
    async preview(url: string): Promise<void> {
      window.open(url, "_blank");
    },
  },

  notification: {
    register: notSupported("Push Notification") as () => Promise<void>,
    onMessage: notSupported("Push Notification") as () => () => void,
  },
};

export default browserBridge;
