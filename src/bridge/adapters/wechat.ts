import type { BridgeAdapter } from "../types";

/**
 * 微信/企业微信适配器（桩实现）
 * 需引入 weixin-js-sdk 后补充具体实现
 */
const wechatBridge: BridgeAdapter = {
  platform: "wechat",

  camera: {
    async capture() {
      throw new Error("[h5-core] WeChat camera: 请引入 weixin-js-sdk 后实现");
    },
  },

  scanner: {
    async scan() {
      throw new Error("[h5-core] WeChat scanner: 请引入 weixin-js-sdk 后实现");
    },
  },

  location: {
    async getCurrent() {
      throw new Error("[h5-core] WeChat location: 请引入 weixin-js-sdk 后实现");
    },
    watchPosition() {
      throw new Error(
        "[h5-core] WeChat watchPosition: 请引入 weixin-js-sdk 后实现",
      );
    },
  },

  nfc: {
    async read() {
      throw new Error("[h5-core] WeChat NFC: 暂不支持");
    },
    async write() {
      throw new Error("[h5-core] WeChat NFC: 暂不支持");
    },
  },

  bluetooth: {
    async connect() {
      throw new Error(
        "[h5-core] WeChat bluetooth: 请引入 weixin-js-sdk 后实现",
      );
    },
    async disconnect() {
      throw new Error(
        "[h5-core] WeChat bluetooth: 请引入 weixin-js-sdk 后实现",
      );
    },
  },

  file: {
    async preview() {
      throw new Error(
        "[h5-core] WeChat file preview: 请引入 weixin-js-sdk 后实现",
      );
    },
  },

  notification: {
    async register() {
      throw new Error(
        "[h5-core] WeChat notification: 请引入 weixin-js-sdk 后实现",
      );
    },
    onMessage() {
      throw new Error(
        "[h5-core] WeChat notification: 请引入 weixin-js-sdk 后实现",
      );
    },
  },
};

export default wechatBridge;
