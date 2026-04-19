import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseFileDownloadOptions {
  /** 自定义请求头（支持函数动态生成） */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 是否携带 cookie */
  withCredentials?: boolean;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UseFileDownloadReturn {
  progress: Ref<DownloadProgress>;
  downloading: Ref<boolean>;
  error: Ref<Error | null>;
  download: (url: string, filename?: string) => Promise<File | null>;
  abort: () => void;
}

/**
 * 文件下载 Hook — 支持进度跟踪、取消、自动触发浏览器保存
 */
export function useFileDownload(
  options?: UseFileDownloadOptions,
): UseFileDownloadReturn {
  const opts = { withCredentials: false, ...options };

  const progress = ref<DownloadProgress>({ loaded: 0, total: 0, percent: 0 });
  const downloading = ref(false);
  const error = ref<Error | null>(null);
  let abortController: AbortController | null = null;

  function resolveHeaders(): Record<string, string> {
    if (typeof opts.headers === "function") return opts.headers();
    return opts.headers ?? {};
  }

  /**
   * 从 Content-Disposition 或 URL 推断文件名
   */
  function resolveFilename(
    response: Response,
    url: string,
    userFilename?: string,
  ): string {
    if (userFilename) return userFilename;

    // 尝试从 Content-Disposition 获取
    const disposition = response.headers.get("content-disposition");
    if (disposition) {
      // filename*=UTF-8''xxx 优先
      const utf8Match = disposition.match(
        /filename\*=(?:UTF-8|utf-8)''(.+?)(?:;|$)/,
      );
      if (utf8Match) return decodeURIComponent(utf8Match[1]);

      // filename="xxx" 或 filename=xxx
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      if (match) return match[1].trim();
    }

    // 从 URL 路径推断
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const last = decodeURIComponent(segments[segments.length - 1]);
        if (last.includes(".")) return last;
      }
    } catch {
      // URL 解析失败，忽略
    }

    return `download-${Date.now()}`;
  }

  /**
   * 触发浏览器保存文件
   */
  function triggerSave(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // 延迟清理，确保下载已触发
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    }, 100);
  }

  async function download(
    url: string,
    filename?: string,
  ): Promise<File | null> {
    downloading.value = true;
    error.value = null;
    progress.value = { loaded: 0, total: 0, percent: 0 };
    abortController = new AbortController();

    try {
      await runBeforeExtensions("useFileDownload", [url, filename]);

      const response = await fetch(url, {
        headers: resolveHeaders(),
        credentials: opts.withCredentials ? "include" : "same-origin",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `[h5-core] 下载失败: HTTP ${response.status} ${response.statusText}`,
        );
      }

      const contentLength = Number(
        response.headers.get("content-length") || 0,
      );
      progress.value.total = contentLength;

      const resolvedName = resolveFilename(response, url, filename);
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      // 流式读取（支持进度）
      if (response.body && contentLength > 0) {
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let loaded = 0;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          progress.value = {
            loaded,
            total: contentLength,
            percent: Math.round((loaded / contentLength) * 100),
          };
        }

        // 合并 chunks
        const blob = new Blob(chunks, { type: contentType });
        const file = new File([blob], resolvedName, { type: contentType });

        triggerSave(blob, resolvedName);
        progress.value.percent = 100;

        const result = await runAfterExtensions("useFileDownload", file);
        return result;
      }

      // 降级：无 body 或无 content-length 时直接读 blob
      const blob = await response.blob();
      const file = new File([blob], resolvedName, { type: contentType });

      triggerSave(blob, resolvedName);
      progress.value = {
        loaded: blob.size,
        total: blob.size,
        percent: 100,
      };

      const result = await runAfterExtensions("useFileDownload", file);
      return result;
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        error.value = e as Error;
      }
      return null;
    } finally {
      downloading.value = false;
      abortController = null;
    }
  }

  function abort() {
    abortController?.abort();
  }

  return { progress, downloading, error, download, abort };
}
