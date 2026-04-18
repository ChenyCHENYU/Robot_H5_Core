export type {
  Coordinates,
  NFCData,
  BluetoothDeviceInfo,
  PushMessage,
  BridgeAdapter,
  BridgeAdapterOverrides,
  CameraOptions,
  ScanOptions,
  LocationQueryOptions,
} from "../bridge/types";
export type {
  AppConfig,
  BridgeConfig,
  UploadConfig,
  ImageConfig,
  LocationConfig,
} from "../config/types";
export type {
  UseCameraOptions,
  UseCameraReturn,
} from "../hooks/types";
export type { UseLocationOptions } from "../hooks/useLocation";
export type { HookExtension, ExtensionContext } from "../hooks/extend";
export type { DeviceInfo } from "../utils/device";
export type { CompressOptions } from "../utils/image";

// Hook return types
export type { UseQrScannerOptions, UseQrScannerReturn } from "../hooks/useQrScanner";
export type { UseNfcReturn } from "../hooks/useNfc";
export type {
  UseFileUploadOptions,
  UseFileUploadReturn,
  UploadProgress,
} from "../hooks/useFileUpload";
export type {
  UseFilePreviewOptions,
  UseFilePreviewReturn,
} from "../hooks/useFilePreview";
export type {
  UseSignatureOptions,
  UseSignatureReturn,
} from "../hooks/useSignature";
export type {
  UseAudioRecorderOptions,
  UseAudioRecorderReturn,
} from "../hooks/useAudioRecorder";
export type {
  UseVideoRecorderOptions,
  UseVideoRecorderReturn,
} from "../hooks/useVideoRecorder";
export type { UseBluetoothReturn } from "../hooks/useBluetooth";
export type {
  UseOfflineStorageOptions,
  UseOfflineStorageReturn,
} from "../hooks/useOfflineStorage";
export type { UsePushNotificationReturn } from "../hooks/usePushNotification";
export type {
  UseWatermarkOptions,
  UseWatermarkReturn,
} from "../hooks/useWatermark";
export type {
  UsePermissionReturn,
  PermissionName,
} from "../hooks/usePermission";
