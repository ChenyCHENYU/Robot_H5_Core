/** 服务端水印策略在 multipart/form-data 中的统一字段名。 */
export const WATERMARK_POLICY_FORM_FIELD = "watermarkPolicy";

export type WatermarkImageSource = "camera" | "album" | "existing";
export type WatermarkContextValue = string | number | boolean | null;

export interface ServerWatermarkLocation {
  longitude: number;
  latitude: number;
  accuracy?: number;
  address?: string;
}

export interface ServerWatermarkPolicy {
  /** false 或不传策略时完全沿用旧上传链路。 */
  enabled: boolean;
  /** true 时服务端处理失败必须让本次业务上传失败，禁止静默返回原图。 */
  required?: boolean;
  /** 服务端维护的模板标识，客户端不得直接拼接最终可信水印文字。 */
  templateId?: string;
  /** 图片来源；existing 表示对系统内既有原图生成衍生水印图。 */
  source?: WatermarkImageSource;
  /** 客户端声称的拍摄/选择时间，仅供参考，服务端仍以服务器时间为准。 */
  clientCapturedAt?: string | Date;
  /** 客户端定位数据，仅供业务模板使用，服务端应保留精度和可信来源标记。 */
  location?: ServerWatermarkLocation;
  /** 模板占位上下文；用户、公司和服务端时间不得由这里覆盖。 */
  context?: Record<string, WatermarkContextValue>;
}

export interface NormalizedServerWatermarkPolicy {
  enabled: true;
  required: boolean;
  templateId: string;
  source?: WatermarkImageSource;
  clientCapturedAt?: string;
  location?: ServerWatermarkLocation;
  context?: Record<string, WatermarkContextValue>;
}

export type WatermarkPolicyErrorCode =
  | "reserved_field_conflict"
  | "template_required"
  | "invalid_template"
  | "invalid_source"
  | "invalid_capture_time"
  | "invalid_location"
  | "invalid_context";

/** 服务端水印策略校验错误。 */
export class WatermarkPolicyError extends Error {
  readonly code: WatermarkPolicyErrorCode;

  constructor(code: WatermarkPolicyErrorCode, message: string) {
    super(message);
    this.name = "WatermarkPolicyError";
    this.code = code;
  }
}

const TEMPLATE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CONTEXT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const MAX_CONTEXT_ENTRIES = 20;
const MAX_CONTEXT_STRING_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 300;

/**
 * 将可选水印策略安全地加入上传 formData。
 *
 * - 未传策略或 enabled=false：返回 baseFormData 的浅拷贝，不增加任何字段。
 * - enabled=true：校验并序列化为 `watermarkPolicy` JSON 字符串。
 * - 不修改调用方传入对象，避免复用表单时出现隐式污染。
 */
export function buildWatermarkFormData(
  baseFormData: Record<string, unknown> = {},
  policy?: ServerWatermarkPolicy | null,
): Record<string, unknown> {
  const result = { ...baseFormData };
  if (Object.prototype.hasOwnProperty.call(result, WATERMARK_POLICY_FORM_FIELD)) {
    throw new WatermarkPolicyError(
      "reserved_field_conflict",
      `[h5-core] ${WATERMARK_POLICY_FORM_FIELD} 是 Core 保留字段，请通过 policy 参数传入`,
    );
  }
  if (!policy?.enabled) return result;
  result[WATERMARK_POLICY_FORM_FIELD] = JSON.stringify(
    normalizeServerWatermarkPolicy(policy),
  );
  return result;
}

/** 校验并标准化服务端水印策略，便于调试或自定义上传组件复用。 */
export function normalizeServerWatermarkPolicy(
  policy: ServerWatermarkPolicy,
): NormalizedServerWatermarkPolicy {
  const templateId = String(policy.templateId || "").trim();
  if (!templateId) {
    throw new WatermarkPolicyError(
      "template_required",
      "[h5-core] 开启服务端水印时 templateId 不能为空",
    );
  }
  if (!TEMPLATE_PATTERN.test(templateId)) {
    throw new WatermarkPolicyError(
      "invalid_template",
      "[h5-core] templateId 仅允许 1～64 位字母、数字、点、下划线和短横线",
    );
  }

  const source = normalizeSource(policy.source);
  const clientCapturedAt = normalizeCaptureTime(policy.clientCapturedAt);
  const location = normalizeLocation(policy.location);
  const context = normalizeContext(policy.context);

  return removeUndefined({
    enabled: true as const,
    required: policy.required !== false,
    templateId,
    source,
    clientCapturedAt,
    location,
    context,
  });
}

function normalizeSource(
  source: ServerWatermarkPolicy["source"],
): WatermarkImageSource | undefined {
  if (source == null) return undefined;
  if (source === "camera" || source === "album" || source === "existing") {
    return source;
  }
  throw new WatermarkPolicyError(
    "invalid_source",
    "[h5-core] 水印图片来源必须为 camera、album 或 existing",
  );
}

function normalizeCaptureTime(
  value: ServerWatermarkPolicy["clientCapturedAt"],
): string | undefined {
  if (value == null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new WatermarkPolicyError(
      "invalid_capture_time",
      "[h5-core] clientCapturedAt 必须是有效日期",
    );
  }
  return date.toISOString();
}

function normalizeLocation(
  location: ServerWatermarkPolicy["location"],
): ServerWatermarkLocation | undefined {
  if (!location) return undefined;
  const { longitude, latitude, accuracy } = location;
  assertCoordinate("longitude", longitude, -180, 180);
  assertCoordinate("latitude", latitude, -90, 90);
  if (accuracy != null) assertCoordinate("accuracy", accuracy, 0, Infinity);
  const address = normalizeAddress(location.address);
  return removeUndefined({ longitude, latitude, accuracy, address });
}

function assertCoordinate(
  name: string,
  value: number,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new WatermarkPolicyError(
      "invalid_location",
      `[h5-core] 水印定位 ${name} 无效`,
    );
  }
}

function normalizeAddress(value: string | undefined): string | undefined {
  const address = value?.trim();
  if (!address) return undefined;
  if (Array.from(address).length > MAX_ADDRESS_LENGTH) {
    throw new WatermarkPolicyError(
      "invalid_location",
      `[h5-core] 水印地址最多允许 ${MAX_ADDRESS_LENGTH} 个字符`,
    );
  }
  return address;
}

function normalizeContext(
  context: ServerWatermarkPolicy["context"],
): Record<string, WatermarkContextValue> | undefined {
  if (!context) return undefined;
  const entries = Object.entries(context);
  if (entries.length > MAX_CONTEXT_ENTRIES) {
    throw new WatermarkPolicyError(
      "invalid_context",
      `[h5-core] 水印上下文最多允许 ${MAX_CONTEXT_ENTRIES} 项`,
    );
  }
  const normalized: Record<string, WatermarkContextValue> = {};
  for (const [key, value] of entries) {
    normalized[key] = normalizeContextEntry(key, value);
  }
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeContextEntry(
  key: string,
  value: WatermarkContextValue,
): WatermarkContextValue {
  if (!CONTEXT_KEY_PATTERN.test(key)) {
    throw new WatermarkPolicyError(
      "invalid_context",
      `[h5-core] 水印上下文字段名不合法：${key}`,
    );
  }
  if (!isContextValue(value)) {
    throw new WatermarkPolicyError(
      "invalid_context",
      `[h5-core] 水印上下文仅允许字符串、数字、布尔值或 null：${key}`,
    );
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new WatermarkPolicyError(
      "invalid_context",
      `[h5-core] 水印上下文数字必须为有限值：${key}`,
    );
  }
  if (
    typeof value === "string" &&
    Array.from(value).length > MAX_CONTEXT_STRING_LENGTH
  ) {
    throw new WatermarkPolicyError(
      "invalid_context",
      `[h5-core] 水印上下文 ${key} 最多允许 ${MAX_CONTEXT_STRING_LENGTH} 个字符`,
    );
  }
  return value;
}

function isContextValue(value: unknown): value is WatermarkContextValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function removeUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}
