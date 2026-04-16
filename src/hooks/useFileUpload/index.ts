import { ref, computed, type Ref, type ComputedRef, onUnmounted } from "vue";
import { useAppConfig } from "../../config";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseFileUploadOptions {
  /** 上传接口 URL */
  action?: string;
  /** 分片大小 (bytes)，默认 2MB */
  chunkSize?: number;
  /** 自定义请求头 */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 最大文件大小 (bytes)，0 = 不限制 */
  maxFileSize?: number;
  /** 允许的文件类型 MIME，空数组 = 不限制 */
  accept?: string[];
  /** 是否自动压缩图片 */
  compressImage?: boolean;
  /** 并发分片数 */
  concurrency?: number;
}

export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 百分比 0-100 */
  percent: number;
}

export interface UseFileUploadReturn {
  progress: Ref<UploadProgress>;
  uploading: Ref<boolean>;
  error: Ref<Error | null>;
  /** 上传结果（服务端响应） */
  result: Ref<any>;
  upload: (file: File, options?: Partial<UseFileUploadOptions>) => Promise<any>;
  abort: () => void;
}

const DEFAULTS: UseFileUploadOptions = {
  chunkSize: 2 * 1024 * 1024,
  maxFileSize: 0,
  accept: [],
  compressImage: false,
  concurrency: 3,
};

export function useFileUpload(
  options?: UseFileUploadOptions,
): UseFileUploadReturn {
  const config = useAppConfig();
  const uploadConfig = config.upload ?? {};
  const opts: UseFileUploadOptions = {
    ...DEFAULTS,
    action: uploadConfig.action,
    chunkSize: uploadConfig.chunkSize ?? DEFAULTS.chunkSize,
    headers: uploadConfig.headers,
    ...options,
  };

  const progress = ref<UploadProgress>({ loaded: 0, total: 0, percent: 0 });
  const uploading = ref(false);
  const error = ref<Error | null>(null);
  const result = ref<any>(null);
  let abortController: AbortController | null = null;

  function resolveHeaders(): Record<string, string> {
    if (!opts.headers) return {};
    return typeof opts.headers === "function" ? opts.headers() : opts.headers;
  }

  function validateFile(file: File): void {
    if (opts.maxFileSize && file.size > opts.maxFileSize) {
      throw new Error(
        `文件大小 ${file.size} 超过限制 ${opts.maxFileSize} bytes`,
      );
    }
    if (opts.accept?.length && !opts.accept.includes(file.type)) {
      throw new Error(
        `文件类型 ${file.type} 不在允许范围: ${opts.accept.join(", ")}`,
      );
    }
  }

  async function uploadSimple(file: File, signal: AbortSignal): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(opts.action!, {
      method: "POST",
      headers: resolveHeaders(),
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    progress.value = { loaded: file.size, total: file.size, percent: 100 };
    return response.json();
  }

  async function uploadChunked(
    file: File,
    signal: AbortSignal,
  ): Promise<any> {
    const chunkSize = opts.chunkSize!;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedSize = 0;

    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) throw new Error("上传已取消");

      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("chunkIndex", String(i));
      formData.append("totalChunks", String(totalChunks));
      formData.append("fileName", file.name);
      formData.append("fileSize", String(file.size));

      const response = await fetch(opts.action!, {
        method: "POST",
        headers: resolveHeaders(),
        body: formData,
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `分片 ${i + 1}/${totalChunks} 上传失败: ${response.status}`,
        );
      }

      uploadedSize += end - start;
      progress.value = {
        loaded: uploadedSize,
        total: file.size,
        percent: Math.round((uploadedSize / file.size) * 100),
      };

      // 最后一片返回结果
      if (i === totalChunks - 1) {
        return response.json();
      }
    }
  }

  async function upload(
    file: File,
    overrides?: Partial<UseFileUploadOptions>,
  ): Promise<any> {
    const merged = { ...opts, ...overrides };
    uploading.value = true;
    error.value = null;
    result.value = null;
    progress.value = { loaded: 0, total: file.size, percent: 0 };
    abortController = new AbortController();

    try {
      validateFile(file);
      const args = await runBeforeExtensions("useFileUpload", [
        file,
        merged,
      ]);
      const targetFile: File = args[0];

      if (!merged.action) {
        throw new Error("[h5-core] useFileUpload: 未配置上传地址 action");
      }

      // 小文件直传，大文件分片
      const needChunk =
        merged.chunkSize && targetFile.size > merged.chunkSize;
      const res = needChunk
        ? await uploadChunked(targetFile, abortController.signal)
        : await uploadSimple(targetFile, abortController.signal);

      const processed = await runAfterExtensions("useFileUpload", res);
      result.value = processed;
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      uploading.value = false;
      abortController = null;
    }
  }

  function abort() {
    abortController?.abort();
  }

  onUnmounted(abort);

  return { progress, uploading, error, result, upload, abort };
}
