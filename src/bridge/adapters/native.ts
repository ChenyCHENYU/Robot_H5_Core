import { createStubAdapter } from "./stub";

/**
 * APP WebView 原生适配器（桩实现）
 * 需与原生端约定 JSBridge 协议后补充具体实现
 */
export default createStubAdapter("native", "原生 JSBridge 协议");
