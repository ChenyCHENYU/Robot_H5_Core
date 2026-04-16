import { createStubAdapter } from "./stub";

/**
 * 微信/企业微信适配器（桩实现）
 * 需引入 weixin-js-sdk 后补充具体实现
 * 注：微信平台不支持 NFC
 */
const adapter = createStubAdapter("wechat", "weixin-js-sdk");

// 微信明确不支持的能力，覆盖提示信息
adapter.nfc = {
  read: () => {
    throw new Error("[h5-core] WeChat NFC: 暂不支持");
  },
  write: () => {
    throw new Error("[h5-core] WeChat NFC: 暂不支持");
  },
};

export default adapter;
