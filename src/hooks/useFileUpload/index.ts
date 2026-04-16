import { ref, type Ref } from "vue";
import { useAppConfig, type UploadConfig } from "../../config";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseFileUploadOptions {
  action?: string;
  chunkSize?: number;
  headers?: Record<string, string> | (() => Record<string, string>);
  withCredentials?: boolean;
  /** 单片上传失败最大重试次数，默认 3 */
  maxRetries?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UseFileUploadReturn {
  progress: Ref<UploadProgress>;
  uploading: Ref<boolean>;
  error: Ref<Error | null>;
  upload: (file: File) => Promise<any>;
  abort: () => void;
}

const DEFAULTS: UseFileUploadOptions = {
  chunkSize: 2 * 1024 * 1024,
  withCredentials: false,
  maxRetries: 3,
};

/**
 * 分片上传 Hook — 支持进度跟踪和取消
 */
export function useFileUpload(
  options?: UseFileUploadOptions,
): UseFileUploadReturn {
  const config = useAppConfig();
  const uploadConfig = (config.upload ?? {}) as Partial<UploadConfig>;
  const opts = { ...DEFAULTS, ...uploadConfig, ...options };

  const progress = ref<UploadProgress>({ loaded: 0, total: 0, percent: 0 });
  const uploading = ref(false);
  const error = ref<Error | null>(null);
  let abortController: AbortController | null = null;

  function resolveHeaders(): Record<string, string> {
    if (typeof opts.headers === "function") return opts.headers();
    return opts.headers ?? {};
  }

  async function upload(file: File): Promise<any> {
    const action = opts.action;
    if (!action) {
      error.value = new Error("[h5-core] 未配置上传地址 action");
      return null;
    }

    uploading.value = true;
    error.value = null;
    progress.value = { loaded: 0, total: file.size, percent: 0 };
    abortController = new AbortController();

    try {
      const args = await runBeforeExtensions("useFileUpload", [file, opts]);
      const targetFile: File = args[0];
      const { chunkSize: rawChunkSize } = opts;
      const chunkSize = rawChunkSize!;
      const totalChunks = Math.ceil(targetFile.size / chunkSize);
      let result: any = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, targetFile.size);
        const chunk = targetFile.slice(start, end);

        const formData = new FormData();
        formData.append("file", chunk, targetFile.name);
        formData.append("chunk", String(i));
        formData.append("chunks", String(totalChunks));
        formData.append("filename", targetFile.name);

        // 单片重试逻辑
        const maxRetries = opts.maxRetries!;
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(action, {
              method: "POST",
              headers: resolveHeaders(),
              body: formData,
              signal: abortController.signal,
              credentials: opts.withCredentials ? "include" : "same-origin",
            });

            if (!response.ok) {
              throw new Error(`上传失败: HTTP ${response.status}`);
            }

            result = await response.json();
            lastError = null;
            break;
          } catch (e) {
            lastError = e as Error;
            if ((e as Error).name === "AbortError") throw e;
          }
        }
        if (lastError) throw lastError;

        const loaded = Math.min(end, targetFile.size);
        progress.value = {
          loaded,
          total: targetFile.size,
          percent: Math.round((loaded / targetFile.size) * 100),
        };
      }

      const processed = await runAfterExtensions("useFileUpload", result);
      return processed;
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        error.value = new Error("上传已取消");
      } else {
        error.value = e as Error;
      }
      return null;
    } finally {
      uploading.value = false;
      abortController = null;
    }
  }

  function abort() {
    abortController?.abort();
  }

  return { progress, uploading, error, upload, abort };
}
