import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export type WatermarkPosition =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "center";

export type WatermarkMode = "single" | "tiled";
export type WatermarkFailureMode = "return-null" | "throw";
export type WatermarkErrorCode =
  | "invalid_file"
  | "invalid_options"
  | "decode_failed"
  | "canvas_unavailable"
  | "encode_failed";

export interface UseWatermarkOptions {
  /** 支持单行、换行字符串或多行数组。 */
  text?: string | readonly string[];
  fontSize?: number;
  fontColor?: string;
  position?: WatermarkPosition;
  opacity?: number;
  /**
   * 水印模式：
   * - `single`：在指定位置绘制一组水印
   * - `tiled`：在整张图片上以 -30° 斜角平铺重复水印
   * @default 'single'
   */
  mode?: WatermarkMode;
  /** 平铺模式下相邻水印文字之间的间距系数。 @default 1.5 */
  tileGap?: number;
  /** 是否根据图片尺寸自动缩放字号。 @default true */
  autoScale?: boolean;
  /** 是否绘制文字描边。 @default true */
  stroke?: boolean;
  /** 描边颜色，默认自动取反色。 */
  strokeColor?: string;
  /** 多行水印行高倍数。 @default 1.25 */
  lineHeight?: number;
  /** 最大行数，超出时明确失败，避免不可控文本撑满图片。 @default 6 */
  maxLines?: number;
  /** 单行最大字符数。 @default 120 */
  maxLineLength?: number;
  /** 输出最大宽度，用于限制移动端 Canvas 内存。 @default 4096 */
  maxWidth?: number;
  /** 输出最大高度，用于限制移动端 Canvas 内存。 @default 4096 */
  maxHeight?: number;
  /** 输出最大像素总数。 @default 12000000 */
  maxPixels?: number;
  /** 输出格式；仅允许 jpeg/png/webp，默认保留受支持的原图格式。 */
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  /** 输出质量 0-1。 @default 0.92 */
  quality?: number;
  /** 兼容旧调用默认返回 null；强约束业务可设为 throw 阻止无水印上传。 */
  failureMode?: WatermarkFailureMode;
}

export interface UseWatermarkReturn {
  loading: Ref<boolean>;
  error: Ref<WatermarkError | null>;
  addWatermark: (
    file: File,
    options?: UseWatermarkOptions,
  ) => Promise<File | null>;
}

/** 图片水印处理的稳定错误类型。 */
export class WatermarkError extends Error {
  readonly code: WatermarkErrorCode;
  readonly cause?: unknown;

  constructor(code: WatermarkErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "WatermarkError";
    this.code = code;
    this.cause = cause;
  }
}

interface NormalizedWatermarkOptions {
  text: string[];
  fontSize: number;
  fontColor: string;
  position: WatermarkPosition;
  opacity: number;
  mode: WatermarkMode;
  tileGap: number;
  autoScale: boolean;
  stroke: boolean;
  strokeColor?: string;
  lineHeight: number;
  maxLines: number;
  maxLineLength: number;
  maxWidth: number;
  maxHeight: number;
  maxPixels: number;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
  failureMode: WatermarkFailureMode;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

const DEFAULTS = {
  fontSize: 48,
  fontColor: "#ffffff",
  position: "bottomRight" as WatermarkPosition,
  opacity: 0.8,
  mode: "single" as WatermarkMode,
  tileGap: 1.5,
  autoScale: true,
  stroke: true,
  lineHeight: 1.25,
  maxLines: 6,
  maxLineLength: 120,
  maxWidth: 4096,
  maxHeight: 4096,
  maxPixels: 12_000_000,
  quality: 0.92,
  failureMode: "return-null" as WatermarkFailureMode,
};

const REFERENCE_WIDTH = 750;
const TILE_ANGLE_DEG = -30;
const IMAGE_DECODE_TIMEOUT_MS = 15_000;
const SUPPORTED_OUTPUT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * 图片水印 Hook。
 *
 * 这是拿到真实 File 后的客户端处理能力；钉钉虚拟路径直传场景应使用服务端
 * `watermarkPolicy`，不要尝试在 iframe 中 fetch 虚拟路径。
 */
export function useWatermark(
  options?: UseWatermarkOptions,
): UseWatermarkReturn {
  const baseOptions = { ...options };
  const loading = ref(false);
  const error = ref<WatermarkError | null>(null);
  let activeTasks = 0;

  async function addWatermark(
    file: File,
    overrides?: UseWatermarkOptions,
  ): Promise<File | null> {
    const requested = { ...baseOptions, ...overrides };
    const failureMode = requested.failureMode ?? DEFAULTS.failureMode;
    activeTasks += 1;
    loading.value = true;
    error.value = null;

    let decoded: DecodedImage | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      const extensionArgs = await runBeforeExtensions("useWatermark", [file]);
      const targetFile =
        extensionArgs[0] instanceof File ? extensionArgs[0] : file;
      validateImageFile(targetFile);
      const normalized = normalizeOptions(requested);
      decoded = await decodeImage(targetFile);
      const size = calculateOutputSize(
        decoded.width,
        decoded.height,
        normalized,
      );

      canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new WatermarkError(
          "canvas_unavailable",
          "[h5-core] 当前 WebView 无法创建图片画布",
        );
      }

      ctx.drawImage(decoded.source, 0, 0, size.width, size.height);
      if (normalized.text.length) drawWatermark(ctx, normalized);
      const result = await canvasToFile(canvas, targetFile, normalized);
      return await runAfterExtensions("useWatermark", result);
    } catch (cause) {
      const normalizedError = normalizeWatermarkError(cause);
      error.value = normalizedError;
      if (failureMode === "throw") throw normalizedError;
      return null;
    } finally {
      try {
        decoded?.cleanup();
      } catch {
        // 资源释放失败不得覆盖已经得到的业务结果。
      }
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
      activeTasks = Math.max(0, activeTasks - 1);
      loading.value = activeTasks > 0;
    }
  }

  return { loading, error, addWatermark };
}

function validateImageFile(file: File): void {
  if (!(file instanceof Blob) || file.size <= 0) {
    throw new WatermarkError("invalid_file", "[h5-core] 水印文件为空");
  }
  if (file.type && !file.type.toLowerCase().startsWith("image/")) {
    throw new WatermarkError(
      "invalid_file",
      "[h5-core] 仅支持为图片文件添加水印",
    );
  }
}

function normalizeOptions(
  options: UseWatermarkOptions,
): NormalizedWatermarkOptions {
  const maxLines = integerInRange(
    "maxLines",
    options.maxLines,
    DEFAULTS.maxLines,
    1,
    20,
  );
  const maxLineLength = integerInRange(
    "maxLineLength",
    options.maxLineLength,
    DEFAULTS.maxLineLength,
    1,
    500,
  );
  const text = normalizeText(options.text, maxLines, maxLineLength);
  const outputType = options.outputType
    ? normalizeOutputType(options.outputType, true)
    : undefined;

  return {
    text,
    fontSize: numberInRange(
      "fontSize",
      options.fontSize,
      DEFAULTS.fontSize,
      4,
      512,
    ),
    fontColor: String(options.fontColor || DEFAULTS.fontColor),
    position: enumValue(
      "position",
      options.position,
      DEFAULTS.position,
      ["topLeft", "topRight", "bottomLeft", "bottomRight", "center"],
    ),
    opacity: numberInRange(
      "opacity",
      options.opacity,
      DEFAULTS.opacity,
      0,
      1,
    ),
    mode: enumValue("mode", options.mode, DEFAULTS.mode, ["single", "tiled"]),
    tileGap: numberInRange(
      "tileGap",
      options.tileGap,
      DEFAULTS.tileGap,
      0.25,
      10,
    ),
    autoScale: options.autoScale ?? DEFAULTS.autoScale,
    stroke: options.stroke ?? DEFAULTS.stroke,
    strokeColor: options.strokeColor,
    lineHeight: numberInRange(
      "lineHeight",
      options.lineHeight,
      DEFAULTS.lineHeight,
      1,
      3,
    ),
    maxLines,
    maxLineLength,
    maxWidth: integerInRange(
      "maxWidth",
      options.maxWidth,
      DEFAULTS.maxWidth,
      320,
      8192,
    ),
    maxHeight: integerInRange(
      "maxHeight",
      options.maxHeight,
      DEFAULTS.maxHeight,
      320,
      8192,
    ),
    maxPixels: integerInRange(
      "maxPixels",
      options.maxPixels,
      DEFAULTS.maxPixels,
      100_000,
      32_000_000,
    ),
    outputType,
    quality: numberInRange(
      "quality",
      options.quality,
      DEFAULTS.quality,
      0,
      1,
    ),
    failureMode: enumValue(
      "failureMode",
      options.failureMode,
      DEFAULTS.failureMode,
      ["return-null", "throw"],
    ),
  };
}

function normalizeText(
  text: UseWatermarkOptions["text"],
  maxLines: number,
  maxLineLength: number,
): string[] {
  if (text == null || text === "") return [];
  const source = Array.isArray(text) ? text : [text];
  const lines = source
    .flatMap(value => String(value).split(/\r?\n/))
    .map(value => value.trim())
    .filter(Boolean);
  if (lines.length > maxLines) {
    throw invalidOptions(`水印最多允许 ${maxLines} 行`);
  }
  if (lines.some(line => Array.from(line).length > maxLineLength)) {
    throw invalidOptions(`水印单行最多允许 ${maxLineLength} 个字符`);
  }
  return lines;
}

function numberInRange(
  name: string,
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result < min || result > max) {
    throw invalidOptions(`${name} 必须在 ${min}～${max} 之间`);
  }
  return result;
}

function integerInRange(
  name: string,
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const result = numberInRange(name, value, fallback, min, max);
  if (!Number.isInteger(result)) throw invalidOptions(`${name} 必须为整数`);
  return result;
}

function enumValue<T extends string>(
  name: string,
  value: T | undefined,
  fallback: T,
  allowed: readonly T[],
): T {
  const result = value ?? fallback;
  if (!allowed.includes(result)) {
    throw invalidOptions(`${name} 不是支持的取值`);
  }
  return result;
}

function invalidOptions(message: string): WatermarkError {
  return new WatermarkError("invalid_options", `[h5-core] ${message}`);
}

function calculateOutputSize(
  width: number,
  height: number,
  options: NormalizedWatermarkOptions,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new WatermarkError("decode_failed", "[h5-core] 图片尺寸无效");
  }
  const ratio = Math.min(
    1,
    options.maxWidth / width,
    options.maxHeight / height,
    Math.sqrt(options.maxPixels / (width * height)),
  );
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function decodeImage(file: File): Promise<DecodedImage> {
  let bitmapError: unknown;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch (cause) {
      bitmapError = cause;
    }
  }

  try {
    return await decodeWithImageElement(file);
  } catch (cause) {
    throw new WatermarkError(
      "decode_failed",
      "[h5-core] 图片解码失败，请确认格式或更换图片",
      cause ?? bitmapError,
    );
  }
}

function decodeWithImageElement(file: File): Promise<DecodedImage> {
  if (
    typeof Image === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return Promise.reject(new Error("HTMLImageElement unavailable"));
  }
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const rejectDecode = (cause: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
      reject(cause);
    };
    const timer = setTimeout(
      () => rejectDecode(new Error("image element decode timeout")),
      IMAGE_DECODE_TIMEOUT_MS,
    );
    image.decoding = "async";
    image.onload = () => {
      if (settled) return;
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (!width || !height) {
        rejectDecode(new Error("invalid image dimensions"));
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({
        source: image,
        width,
        height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    image.onerror = () => rejectDecode(new Error("image element decode failed"));
    image.src = objectUrl;
  });
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  options: NormalizedWatermarkOptions,
): void {
  const requestedFontSize = options.autoScale
    ? Math.max(
        4,
        Math.round(options.fontSize * (ctx.canvas.width / REFERENCE_WIDTH)),
      )
    : options.fontSize;
  const fontSize = fitFontSize(ctx, options.text, requestedFontSize, options);

  ctx.globalAlpha = options.opacity;
  setFont(ctx, fontSize);
  ctx.fillStyle = options.fontColor;
  if (options.stroke) {
    ctx.strokeStyle =
      options.strokeColor ||
      (isLightColor(options.fontColor)
        ? "rgba(0,0,0,0.5)"
        : "rgba(255,255,255,0.5)");
    ctx.lineWidth = Math.max(2, Math.round(fontSize / 16));
    ctx.lineJoin = "round";
  }

  if (options.mode === "tiled") {
    drawTiledWatermark(ctx, options.text.join(" · "), fontSize, options);
  } else {
    drawSingleWatermark(ctx, options.text, fontSize, options);
  }
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  requested: number,
  options: NormalizedWatermarkOptions,
): number {
  let fontSize = Math.max(4, requested);
  if (options.mode === "single") {
    const heightUnits = 2.2 + (lines.length - 1) * options.lineHeight;
    const heightBound = Math.floor(ctx.canvas.height / heightUnits);
    if (heightBound < 4) {
      throw invalidOptions("水印行数过多，无法在图片内完整显示");
    }
    fontSize = Math.min(fontSize, heightBound);
  }
  setFont(ctx, fontSize);
  const maxTextWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const padding = fontSize * 1.2;
  const available = Math.max(1, ctx.canvas.width - padding);
  if (maxTextWidth > available) {
    fontSize = Math.max(4, Math.floor(fontSize * (available / maxTextWidth)));
    setFont(ctx, fontSize);
  }
  if (options.mode === "single") {
    const finalWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const lineStep = Math.max(1, Math.round(fontSize * options.lineHeight));
    const blockHeight = fontSize + (lines.length - 1) * lineStep;
    if (finalWidth > ctx.canvas.width - fontSize * 1.2) {
      throw invalidOptions("水印文字过长，无法在图片内完整显示");
    }
    if (blockHeight + fontSize * 1.2 > ctx.canvas.height) {
      throw invalidOptions("水印行数过多，无法在图片内完整显示");
    }
  }
  return fontSize;
}

function setFont(ctx: CanvasRenderingContext2D, fontSize: number): void {
  ctx.font = `bold ${fontSize}px sans-serif`;
}

function drawSingleWatermark(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fontSize: number,
  options: NormalizedWatermarkOptions,
): void {
  const {width} = ctx.canvas;
  const {height} = ctx.canvas;
  const padding = Math.round(fontSize * 0.6);
  const lineStep = Math.max(1, Math.round(fontSize * options.lineHeight));
  const blockHeight = fontSize + (lines.length - 1) * lineStep;
  let firstBaseline = padding + fontSize;

  if (options.position === "bottomLeft" || options.position === "bottomRight") {
    firstBaseline = height - padding - blockHeight + fontSize;
  } else if (options.position === "center") {
    firstBaseline = (height - blockHeight) / 2 + fontSize;
  }

  lines.forEach((line, index) => {
    const textWidth = ctx.measureText(line).width;
    let x = padding;
    if (options.position === "topRight" || options.position === "bottomRight") {
      x = width - textWidth - padding;
    } else if (options.position === "center") {
      x = (width - textWidth) / 2;
    }
    const y = firstBaseline + index * lineStep;
    if (options.stroke) ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
}

function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  options: NormalizedWatermarkOptions,
): void {
  const {width} = ctx.canvas;
  const {height} = ctx.canvas;
  const textWidth = Math.max(1, ctx.measureText(text).width);
  const stepX = Math.max(fontSize * 4, textWidth * (1 + options.tileGap));
  const stepY = Math.max(1, fontSize * 3);
  const diagonal = Math.sqrt(width * width + height * height);
  const halfDiagonal = diagonal / 2;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((TILE_ANGLE_DEG * Math.PI) / 180);
  for (let y = -halfDiagonal; y < halfDiagonal; y += stepY) {
    for (let x = -halfDiagonal; x < halfDiagonal; x += stepX) {
      if (options.stroke) ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}

async function canvasToFile(
  canvas: HTMLCanvasElement,
  original: File,
  options: NormalizedWatermarkOptions,
): Promise<File> {
  const requestedType =
    options.outputType || normalizeOutputType(original.type, false) || "image/jpeg";
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, requestedType, options.quality),
  );
  if (!blob) {
    throw new WatermarkError(
      "encode_failed",
      "[h5-core] 水印图片生成失败，请重试",
    );
  }
  const actualType = normalizeOutputType(blob.type, false) || requestedType;
  const name = resolveOutputName(original.name, original.type, actualType);
  return new File([blob], name, {
    type: actualType,
    lastModified: original.lastModified,
  });
}

function normalizeOutputType(
  value: string,
  strict: boolean,
): "image/jpeg" | "image/png" | "image/webp" | undefined {
  const normalized =
    value.toLowerCase() === "image/jpg" ? "image/jpeg" : value.toLowerCase();
  if (SUPPORTED_OUTPUT_TYPES.has(normalized)) {
    return normalized as "image/jpeg" | "image/png" | "image/webp";
  }
  if (strict) throw invalidOptions(`不支持输出格式 ${value}`);
  return undefined;
}

function resolveOutputName(
  originalName: string,
  originalType: string,
  outputType: string,
): string {
  if (normalizeOutputType(originalType, false) === outputType && originalName) {
    return originalName;
  }
  const extension =
    outputType === "image/png"
      ? ".png"
      : outputType === "image/webp"
        ? ".webp"
        : ".jpg";
  const base = (originalName || "watermarked-image").replace(/\.[^./\\]+$/, "");
  return `${base || "watermarked-image"}${extension}`;
}

function normalizeWatermarkError(cause: unknown): WatermarkError {
  if (cause instanceof WatermarkError) return cause;
  const message =
    cause instanceof Error ? cause.message : String(cause || "未知错误");
  return new WatermarkError(
    "encode_failed",
    `[h5-core] 添加水印失败：${message}`,
    cause,
  );
}

function isLightColor(color: string): boolean {
  const matched = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!matched) return true;
  const hex = matched[1];
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 186;
}
