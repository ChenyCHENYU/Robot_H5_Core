import type { BridgeAdapter } from "../types";

/**
 * 钉钉适配器（桩实现）
 * 需引入 dingtalk-jsapi 后补充具体实现
 */
const dingtalkBridge: BridgeAdapter = {
  platform: "dingtalk",

  camera: {
    async capture() {
      throw new Error(
        "[h5-core] DingTalk camera: 请引入 dingtalk-jsapi 后实现",
      );
    },
  },

  scanner: {
    async scan() {
      throw new Error(
        "[h5-core] DingTalk scanner: 请引入 dingtalk-jsapi 后实现",
      );
    },
  },

  location: {
    async getCurrent() {
      throw new Error(
        "[h5-core] DingTalk location: 请引入 dingtalk-jsapi 后实现",
      );
    },
    watchPosition() {
      throw new Error(
        "[h5-core] DingTalk watchPosition: 请引入 dingtalk-jsapi 后实现",
      );
    },
  },

  nfc: {
    async read() {
      throw new Error("[h5-core] DingTalk NFC: 请引入 dingtalk-jsapi 后实现");
    },
    async write() {
      throw new Error("[h5-core] DingTalk NFC: 请引入 dingtalk-jsapi 后实现");
    },
  },

  bluetooth: {
    async connect() {
      throw new Error("[h5-core] DingTalk bluetooth: 暂不支持");
    },
    async disconnect() {
      throw new Error("[h5-core] DingTalk bluetooth: 暂不支持");
    },
  },

  file: {
    async preview() {
      throw new Error(
        "[h5-core] DingTalk file preview: 请引入 dingtalk-jsapi 后实现",
      );
    },
  },

  notification: {
    async register() {
      throw new Error(
        "[h5-core] DingTalk notification: 请引入 dingtalk-jsapi 后实现",
      );
    },
    onMessage() {
      throw new Error(
        "[h5-core] DingTalk notification: 请引入 dingtalk-jsapi 后实现",
      );
    },
  },
};

export default dingtalkBridge;
