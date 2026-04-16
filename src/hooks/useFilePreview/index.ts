import { ref, type Ref } from "vue";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseFilePreviewOptions {
  /** Office 文件预览服务地址（如 LibreOffice Online / OnlyOffice） */
  previewServer?: string;
}

export interface UseFilePreviewReturn {
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  preview: (url: string, name?: string) => Promise<void>;
}

/**
 * 文件预览 Hook — PDF/Office/图片在线预览
 * 支持配置 previewServer 处理 Office 文件
 */
export function useFilePreview(options?: UseFilePreviewOptions): UseFilePreviewReturn {
  const bridge = useBridge();

  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function preview(url: string, name?: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("useFilePreview", [url, name]);

      if (options?.previewServer) {
        const previewUrl = `${options.previewServer}?url=${encodeURIComponent(url)}`;
        await bridge.file.preview(previewUrl, name);
      } else {
        await bridge.file.preview(url, name);
      }

      await runAfterExtensions("useFilePreview", null);
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, preview };
}
