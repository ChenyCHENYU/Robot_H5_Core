// @robot/h5-core 顶层入口
export { defineAppConfig, useAppConfig } from "./config";
export {
  createBridge,
  useBridge,
  resetBridge,
  registerAdapter,
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

// Re-export sub-modules for convenience
export * from "./utils";
export type * from "./types";
