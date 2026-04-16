export { useCamera } from "./useCamera";
export { useLocation } from "./useLocation";
export { useQrScanner } from "./useQrScanner";
export { useNfc } from "./useNfc";
export { useFileUpload } from "./useFileUpload";
export { useFilePreview } from "./useFilePreview";
export { useSignature } from "./useSignature";
export { useAudioRecorder } from "./useAudioRecorder";
export { useVideoRecorder } from "./useVideoRecorder";
export { useBluetooth } from "./useBluetooth";
export { useOfflineStorage } from "./useOfflineStorage";
export { usePushNotification } from "./usePushNotification";
export { useWatermark } from "./useWatermark";
export { usePermission } from "./usePermission";
export { extendHook, clearExtensions } from "./extend";

// Types re-export
export type { UseCameraOptions, UseCameraReturn, UseAsyncReturn } from "./types";
export type { UseLocationOptions, UseLocationReturn } from "./useLocation";
export type { UseQrScannerOptions, UseQrScannerReturn } from "./useQrScanner";
export type { UseNfcOptions, UseNfcReturn } from "./useNfc";
export type {
  UseFileUploadOptions,
  UseFileUploadReturn,
  UploadProgress,
} from "./useFileUpload";
export type { UseFilePreviewOptions, UseFilePreviewReturn } from "./useFilePreview";
export type { UseSignatureOptions, UseSignatureReturn } from "./useSignature";
export type {
  UseAudioRecorderOptions,
  UseAudioRecorderReturn,
} from "./useAudioRecorder";
export type {
  UseVideoRecorderOptions,
  UseVideoRecorderReturn,
} from "./useVideoRecorder";
export type { UseBluetoothOptions, UseBluetoothReturn } from "./useBluetooth";
export type {
  UseOfflineStorageOptions,
  UseOfflineStorageReturn,
} from "./useOfflineStorage";
export type {
  UsePushNotificationOptions,
  UsePushNotificationReturn,
} from "./usePushNotification";
export type { UseWatermarkOptions, UseWatermarkReturn } from "./useWatermark";
export type {
  UsePermissionOptions,
  UsePermissionReturn,
  PermissionName,
  PermissionStatus,
} from "./usePermission";
