import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseWatermarkOptions {
  text?: string;
  fontSize?: number;
  fontColor?: string;
  position?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "center";
  opacity?: number;
}

export interface UseWatermarkReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  addWatermark: (
    file: File,
    options?: UseWatermarkOptions,
  ) => Promise<File | null>;
}

const DEFAULTS: UseWatermarkOptions = {
  fontSize: 16,
  fontColor: "#ffffff",
  position: "bottomRight",
  opacity: 0.8,
};

/**
 * 图片水印 Hook — 在图片上叠加文字水印（时间/地点/人员等）
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

      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      // 绘制水印
      ctx.globalAlpha = merged.opacity!;
      ctx.font = `${merged.fontSize!}px sans-serif`;
      ctx.fillStyle = merged.fontColor!;

      const text = merged.text || "";
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = merged.fontSize!;
      const padding = 10;

      let x = padding;
      let y = padding + textHeight;

      switch (merged.position) {
        case "topRight":
          x = canvas.width - textWidth - padding;
          break;
        case "bottomLeft":
          y = canvas.height - padding;
          break;
        case "bottomRight":
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case "center":
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height + textHeight) / 2;
          break;
        default: // topLeft
          break;
      }

      ctx.fillText(text, x, y);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) return null;

      const result = new File([blob], file.name, { type: "image/jpeg" });
      const processed = await runAfterExtensions("useWatermark", result);
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, addWatermark };
}
