import type { BridgeAdapter } from "../types";

/**
 * 创建桩适配器 — 未实现的方法统一抛出提示性错误
 * @param platform 平台标识
 * @param sdkHint 需引入的 SDK 名称（如 "dingtalk-jsapi"），留空表示"暂不支持"
 */
export function createStubAdapter(
  platform: string,
  sdkHint?: string,
): BridgeAdapter {
  const notSupported = (capability: string) => () => {
    const hint = sdkHint
      ? `请引入 ${sdkHint} 后实现`
      : "暂不支持";
    throw new Error(`[h5-core] ${platform} ${capability}: ${hint}`);
  };

  return {
    platform,
    camera: { capture: notSupported("camera") },
    scanner: { scan: notSupported("scanner") },
    location: {
      getCurrent: notSupported("location"),
      watchPosition: notSupported("watchPosition"),
    },
    nfc: { read: notSupported("NFC"), write: notSupported("NFC") },
    bluetooth: {
      connect: notSupported("bluetooth"),
      disconnect: notSupported("bluetooth"),
    },
    file: { preview: notSupported("file preview") },
    notification: {
      register: notSupported("notification"),
      onMessage: notSupported("notification"),
    },
  };
}
