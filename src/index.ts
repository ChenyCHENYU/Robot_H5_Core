// @robot/h5-core 顶层入口
export { defineAppConfig, useAppConfig } from "./config";
export { createBridge, useBridge, registerAdapter } from "./bridge";
export { extendHook } from "./hooks/extend";

// Hooks
export {
  useCamera,
  useLocation,
  useQrScanner,
  useNfc,
  useFileUpload,
  useFilePreview,
  useSignature,
  useAudioRecorder,
  useVideoRecorder,
  useBluetooth,
  useOfflineStorage,
  usePushNotification,
  useWatermark,
  usePermission,
} from "./hooks";

// Re-export sub-modules for convenience
export * from "./utils";
export type * from "./types";
