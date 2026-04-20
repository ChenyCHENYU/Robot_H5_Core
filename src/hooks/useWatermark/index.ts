import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseWatermarkOptions {
  text?: string;
  fontSize?: number;
  fontColor?: string;
  position?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";
  opacity?: number;
  /**
   * 水印模式：
   * - `single`：在指定位置绘制单条水印
   * - `tiled`：在整张图片上以 -30° 斜角平铺重复水印
   * @default 'single'
   */
  mode?: "single" | "tiled";
  /**
   * 平铺模式下相邻水印文字之间的间距系数（相对于文字宽度）。
   * @default 1.5
   */
  tileGap?: number;
  /**
   * 是否根据图片尺寸自动缩放字号。
   * 开启后 fontSize 作为 750px 视口下的参考值，实际字号按图片宽度等比缩放。
   * @default true
   */
  autoScale?: boolean;
  /**
   * 是否绘制文字描边（提升在各种底色上的可读性）。
   * @default true
   */
  stroke?: boolean;
  /** 描边颜色，默认自动取反色 */
  strokeColor?: string;
  /** 输出格式，默认保留原图格式 */
  outputType?: string;
  /** 输出质量 0-1，默认 0.92 */
  quality?: number;
}

export interface UseWatermarkReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  addWatermark: (
    file: File,
    options?: UseWatermarkOptions,
  ) => Promise<File | null>;
}

const DEFAULTS: Required<
  Pick<
    UseWatermarkOptions,
    | "fontSize"
    | "fontColor"
    | "position"
    | "opacity"
    | "autoScale"
    | "stroke"
    | "quality"
    | "mode"
    | "tileGap"
  >
> = {
  fontSize: 48,
  fontColor: "#ffffff",
  position: "bottomRight",
  opacity: 0.8,
  autoScale: true,
  stroke: true,
  quality: 0.92,
  mode: "single",
  tileGap: 1.5,
};

/** 自动缩放参考视口宽度（px） */
const REFERENCE_WIDTH = 750;
/** 平铺水印旋转角度 */
const TILE_ANGLE_DEG = -30;

/**
 * 图片水印 Hook — 在图片上叠加文字水印（时间/地点/人员等）
 *
 * 默认行为：
 * - 字号自动按图片实际宽度等比缩放，确保高分辨率照片上水印仍然清晰可见
 * - 文字带描边，在任意底色上都具备可读性
 * - `mode: 'tiled'` 时在整张图片上平铺重复水印
 */
export function useWatermark(
  options?: UseWatermarkOptions,
): UseWatermarkReturn {
  const opts = { ...DEFAULTS, ...options };

  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function addWatermark(
    file: File,
    overrides?: UseWatermarkOptions,
  ): Promise<File | null> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("useWatermark", [file]);
      const merged = { ...opts, ...overrides };

      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;

      // 绘制原图
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const text = merged.text || "";
      if (!text) {
        return await blobToFile(canvas, file, merged);
      }

      // ─── 计算实际字号 ─────────────────────────
      const baseFontSize = merged.fontSize ?? DEFAULTS.fontSize;
      const shouldScale = merged.autoScale ?? DEFAULTS.autoScale;
      const actualFontSize = shouldScale
        ? Math.round(baseFontSize * (canvas.width / REFERENCE_WIDTH))
        : baseFontSize;

      // ─── 公共绘制属性 ─────────────────────────
      ctx.globalAlpha = merged.opacity ?? DEFAULTS.opacity;
      ctx.font = `bold ${actualFontSize}px sans-serif`;
      ctx.fillStyle = merged.fontColor ?? DEFAULTS.fontColor;

      const shouldStroke = merged.stroke ?? DEFAULTS.stroke;
      if (shouldStroke) {
        ctx.strokeStyle =
          merged.strokeColor ||
          (isLightColor(merged.fontColor ?? DEFAULTS.fontColor)
            ? "rgba(0,0,0,0.5)"
            : "rgba(255,255,255,0.5)");
        ctx.lineWidth = Math.max(2, Math.round(actualFontSize / 16));
        ctx.lineJoin = "round";
      }

      const mode = merged.mode ?? DEFAULTS.mode;

      if (mode === "tiled") {
        drawTiledWatermark(ctx, text, actualFontSize, shouldStroke, merged);
      } else {
        drawSingleWatermark(ctx, text, actualFontSize, shouldStroke, merged);
      }

      return await blobToFile(canvas, file, merged);
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, addWatermark };
}

/** 单条水印 */
function drawSingleWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  stroke: boolean,
  opts: UseWatermarkOptions,
) {
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const padding = Math.round(fontSize * 0.6);
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  let x = padding;
  let y = padding + fontSize;

  switch (opts.position ?? DEFAULTS.position) {
    case "topRight":
      x = w - textWidth - padding;
      break;
    case "bottomLeft":
      y = h - padding;
      break;
    case "bottomRight":
      x = w - textWidth - padding;
      y = h - padding;
      break;
    case "center":
      x = (w - textWidth) / 2;
      y = (h + fontSize) / 2;
      break;
    default: // topLeft
      break;
  }

  if (stroke) ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/** 整篇平铺水印 — 以 -30° 角重复铺满整张图片 */
function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  stroke: boolean,
  opts: UseWatermarkOptions,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const gap = (opts.tileGap ?? DEFAULTS.tileGap) * textWidth;
  const stepX = textWidth + gap;
  const stepY = fontSize * 3;
  const angle = (TILE_ANGLE_DEG * Math.PI) / 180;
  // 对角线长度，确保旋转后仍能覆盖所有角落
  const diagonal = Math.sqrt(w * w + h * h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);

  const halfDiag = diagonal / 2;
  for (let y = -halfDiag; y < halfDiag; y += stepY) {
    for (let x = -halfDiag; x < halfDiag; x += stepX) {
      if (stroke) ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

/** Canvas → File */
async function blobToFile(
  canvas: HTMLCanvasElement,
  original: File,
  opts: UseWatermarkOptions,
): Promise<File | null> {
  const outputType = opts.outputType || original.type || "image/jpeg";
  const quality = opts.quality ?? DEFAULTS.quality;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, quality),
  );
  if (!blob) return null;
  const result = new File([blob], original.name, { type: outputType });
  return await runAfterExtensions("useWatermark", result);
}

/** 简单判断颜色是否偏亮 */
function isLightColor(color: string): boolean {
  const c = color.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 186;
}
