// @robot-h5/core 顶层入口

// ===== Plugin（推荐方式）=====
export { h5Core, defineH5Config } from "./plugin";
export type { H5PluginConfig } from "./plugin";

// ===== 配置 / Bridge（底层 API）=====
export { defineAppConfig, useAppConfig } from "./config";
export {
  createBridge,
  useBridge,
  resetBridge,
  registerAdapter,
  mergeAdapter,
} from "./bridge";
export { extendHook } from "./hooks/extend";

// Hooks
export { useCamera } from "./hooks/useCamera";
export { useLocation } from "./hooks/useLocation";
export { useQrScanner } from "./hooks/useQrScanner";
export { useNfc } from "./hooks/useNfc";
export { useFileUpload } from "./hooks/useFileUpload";
export { useFilePreview } from "./hooks/useFilePreview";
export { useSignature } from "./hooks/useSignature";
export { useAudioRecorder } from "./hooks/useAudioRecorder";
export { useVideoRecorder } from "./hooks/useVideoRecorder";
export { useBluetooth } from "./hooks/useBluetooth";
export { useOfflineStorage } from "./hooks/useOfflineStorage";
export { usePushNotification } from "./hooks/usePushNotification";
export { useWatermark } from "./hooks/useWatermark";
export { usePermission } from "./hooks/usePermission";
export { useFileDownload } from "./hooks/useFileDownload";

// Re-export sub-modules for convenience
export * from "./utils";
export type * from "./types";
