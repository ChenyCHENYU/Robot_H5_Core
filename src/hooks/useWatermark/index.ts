import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import { formatDate } from "../../utils/format";

export interface UseWatermarkOptions {
  /** 文字内容数组（每行一条） */
  texts?: string[];
  /** 是否包含时间 */
  showTime?: boolean;
  /** 时间格式 */
  timeFormat?: string;
  /** 是否包含位置信息 */
  showLocation?: boolean;
  /** 字体大小(px) */
  fontSize?: number;
  /** 字体颜色 */
  fontColor?: string;
  /** 文字位置 */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** 文字背景色（半透明） */
  backgroundColor?: string;
  /** 内边距 */
  padding?: number;
}

export interface UseWatermarkReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  /** 给图片添加水印，返回新 File */
  addWatermark: (
    file: File,
    options?: Partial<UseWatermarkOptions>,
  ) => Promise<File | null>;
  /** 创建页面水印层（防截屏水印） */
  createPageWatermark: (
    container: HTMLElement,
    options?: Partial<UseWatermarkOptions>,
  ) => () => void;
}

const DEFAULTS: UseWatermarkOptions = {
  texts: [],
  showTime: true,
  timeFormat: "YYYY-MM-DD HH:mm:ss",
  showLocation: false,
  fontSize: 14,
  fontColor: "#ffffff",
  position: "bottom-left",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  padding: 10,
};

export function useWatermark(
  options?: UseWatermarkOptions,
): UseWatermarkReturn {
  const opts = { ...DEFAULTS, ...options };

  const loading = ref(false);
  const error = ref<Error | null>(null);
  let cleanupFns: Array<() => void> = [];

  function buildTexts(merged: UseWatermarkOptions): string[] {
    const lines = [...(merged.texts ?? [])];
    if (merged.showTime) {
      lines.push(formatDate(new Date(), merged.timeFormat));
    }
    return lines;
  }

  async function addWatermark(
    file: File,
    overrides?: Partial<UseWatermarkOptions>,
  ): Promise<File | null> {
    const merged = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useWatermark", [file, merged]);
      const targetFile: File = args[0];
      const targetOpts: UseWatermarkOptions = args[1] ?? merged;

      const bitmap = await createImageBitmap(targetFile);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d")!;

      // 绘制原图
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      // 绘制水印文字
      const lines = buildTexts(targetOpts);
      const fontSize = targetOpts.fontSize!;
      const padding = targetOpts.padding!;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = targetOpts.fontColor!;

      // 计算文字区域
      const lineHeight = fontSize * 1.4;
      const textWidth = Math.max(
        ...lines.map((l) => ctx.measureText(l).width),
      );
      const blockHeight = lines.length * lineHeight + padding * 2;
      const blockWidth = textWidth + padding * 2;

      // 计算位置
      let x = padding;
      let y = padding;

      switch (targetOpts.position) {
        case "top-right":
          x = canvas.width - blockWidth - padding;
          break;
        case "bottom-left":
          y = canvas.height - blockHeight - padding;
          break;
        case "bottom-right":
          x = canvas.width - blockWidth - padding;
          y = canvas.height - blockHeight - padding;
          break;
        // top-left: 默认
      }

      // 背景
      ctx.fillStyle = targetOpts.backgroundColor!;
      ctx.fillRect(x, y, blockWidth, blockHeight);

      // 文字
      ctx.fillStyle = targetOpts.fontColor!;
      ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        ctx.fillText(line, x + padding, y + padding + i * lineHeight);
      });

      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.92,
      });
      const result = new File([blob], targetFile.name, {
        type: "image/jpeg",
      });

      const processed = await runAfterExtensions("useWatermark", result);
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function createPageWatermark(
    container: HTMLElement,
    overrides?: Partial<UseWatermarkOptions>,
  ): () => void {
    const merged = { ...opts, ...overrides };
    const lines = buildTexts(merged);
    const text = lines.join(" ");

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.rotate((-25 * Math.PI) / 180);
      ctx.font = `${merged.fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(180, 180, 180, 0.2)";
      ctx.textAlign = "center";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    const div = document.createElement("div");
    div.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background-image: url(${canvas.toDataURL()});
      background-repeat: repeat;
    `;
    container.style.position = "relative";
    container.appendChild(div);

    // 防删除：MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === div) {
            container.appendChild(div);
          }
        }
      }
    });
    observer.observe(container, { childList: true });

    const cleanup = () => {
      observer.disconnect();
      div.remove();
    };
    cleanupFns.push(cleanup);
    return cleanup;
  }

  onUnmounted(() => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  });

  return { loading, error, addWatermark, createPageWatermark };
}
