import type { BridgeAdapter } from "../types";

/**
 * APP WebView 原生适配器（桩实现）
 * 需与原生端约定 JSBridge 协议后补充具体实现
 */
const nativeBridge: BridgeAdapter = {
  platform: "native",

  camera: {
    async capture() {
      throw new Error("[h5-core] Native camera: 请实现原生 JSBridge 调用");
    },
  },

  scanner: {
    async scan() {
      throw new Error("[h5-core] Native scanner: 请实现原生 JSBridge 调用");
    },
  },

  location: {
    async getCurrent() {
      throw new Error("[h5-core] Native location: 请实现原生 JSBridge 调用");
    },
    watchPosition() {
      throw new Error(
        "[h5-core] Native watchPosition: 请实现原生 JSBridge 调用",
      );
    },
  },

  nfc: {
    async read() {
      throw new Error("[h5-core] Native NFC: 请实现原生 JSBridge 调用");
    },
    async write() {
      throw new Error("[h5-core] Native NFC: 请实现原生 JSBridge 调用");
    },
  },

  bluetooth: {
    async connect() {
      throw new Error("[h5-core] Native bluetooth: 请实现原生 JSBridge 调用");
    },
    async disconnect() {
      throw new Error("[h5-core] Native bluetooth: 请实现原生 JSBridge 调用");
    },
  },

  file: {
    async preview() {
      throw new Error(
        "[h5-core] Native file preview: 请实现原生 JSBridge 调用",
      );
    },
  },

  notification: {
    async register() {
      throw new Error(
        "[h5-core] Native notification: 请实现原生 JSBridge 调用",
      );
    },
    onMessage() {
      throw new Error(
        "[h5-core] Native notification: 请实现原生 JSBridge 调用",
      );
    },
  },
};

export default nativeBridge;
