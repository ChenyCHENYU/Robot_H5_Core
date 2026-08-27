export { compressImage, fileToBase64, base64ToBlob } from "./image";
export type { CompressOptions } from "./image";

export { gcj02ToWgs84, wgs84ToGcj02 } from "./coord";

export { getDeviceInfo, isAndroid, isIOS } from "./device";
export type { DeviceInfo } from "./device";

export { getFileType, formatFileSize } from "./file";

export { isPhone, isIdCard, isEmail, isCreditCode } from "./validate";

export { formatDate, formatMoney } from "./format";

export {
  WATERMARK_POLICY_FORM_FIELD,
  WatermarkPolicyError,
  buildWatermarkFormData,
  normalizeServerWatermarkPolicy,
} from "./watermark";
export type {
  NormalizedServerWatermarkPolicy,
  ServerWatermarkLocation,
  ServerWatermarkPolicy,
  WatermarkContextValue,
  WatermarkImageSource,
  WatermarkPolicyErrorCode,
} from "./watermark";
