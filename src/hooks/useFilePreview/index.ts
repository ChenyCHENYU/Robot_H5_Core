import { ref, type Ref } from "vue";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseFilePreviewOptions {
  /** 预览方式：bridge 调用宿主 / iframe 内嵌 / window 新窗口 */
  mode?: "bridge" | "iframe" | "window";
  /** 预览服务地址（用于 Office 等需转换的文件） */
  previewServer?: string;
}

export interface UseFilePreviewReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  preview: (
    url: string,
    name?: string,
    options?: Partial<UseFilePreviewOptions>,
  ) => Promise<boolean>;
}

const DEFAULTS: UseFilePreviewOptions = {
  mode: "bridge",
};

/** 图片类型可直接预览 */
const DIRECT_PREVIEW_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".pdf",
];

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export function useFilePreview(
  options?: UseFilePreviewOptions,
): UseFilePreviewReturn {
  const opts = { ...DEFAULTS, ...options };
  const bridge = useBridge();

  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function preview(
    url: string,
    name?: string,
    overrides?: Partial<UseFilePreviewOptions>,
  ): Promise<boolean> {
    const merged = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useFilePreview", [
        url,
        name,
        merged,
      ]);
      const targetUrl: string = args[0];
      const targetName: string | undefined = args[1];

      if (merged.mode === "bridge") {
        await bridge.file.preview(targetUrl, targetName);
      } else if (merged.mode === "iframe") {
        // 对 Office 文件，拼接预览服务地址
        const ext = getExtension(targetName ?? targetUrl);
        const previewUrl =
          merged.previewServer && !DIRECT_PREVIEW_TYPES.includes(ext)
            ? `${merged.previewServer}?url=${encodeURIComponent(targetUrl)}`
            : targetUrl;
        window.open(previewUrl, "_blank");
      } else {
        window.open(targetUrl, "_blank");
      }

      await runAfterExtensions("useFilePreview", { url: targetUrl, name: targetName });
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, preview };
}
