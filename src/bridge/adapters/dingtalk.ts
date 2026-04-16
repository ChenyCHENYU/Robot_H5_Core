import { createStubAdapter } from "./stub";

/**
 * 钉钉适配器（桩实现）
 * 需引入 dingtalk-jsapi 后补充具体实现
 * 注：钉钉平台不支持蓝牙和 NFC
 */
const adapter = createStubAdapter("dingtalk", "dingtalk-jsapi");

// 钉钉明确不支持的能力，覆盖提示信息
adapter.bluetooth = {
  connect: () => {
    throw new Error("[h5-core] DingTalk bluetooth: 暂不支持");
  },
  disconnect: () => {
    throw new Error("[h5-core] DingTalk bluetooth: 暂不支持");
  },
};

export default adapter;
