import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import { detectMbaseHost } from "../../bridge/detector";
import { invokeMbaseCapability } from "../../bridge/mbase";

export interface UseFileDownloadOptions {
  /** 自定义请求头（支持函数动态生成） */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 是否携带 cookie */
  withCredentials?: boolean;
  /**
   * 优先使用基座下载（wl-mbase App 容器）。
   * 开启后 download() 委托基座下载并用系统查看器呈现（分享/存储菜单可另存），
   * 此时无法返回浏览器 File 对象，成功后返回 null 且进度直接置 100。
   * 非基座环境自动回退浏览器下载，行为不变。默认 false。
   */
  useHostBridge?: boolean;
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
      const {pathname} = new URL(url);
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
    // 点击已同步触发下载，节点可立即移除；Blob URL 稍后释放。
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);
  }

  /** 基座下载模式：委托基座下载并用系统查看器呈现；无浏览器 File 可返回。 */
  async function downloadViaHostBridge(
    url: string,
    filename?: string,
  ): Promise<File | null> {
    await invokeMbaseCapability("fileDownload", { url, fileName: filename });
    progress.value = { loaded: 1, total: 1, percent: 100 };
    return null;
  }

  /** 浏览器模式：流式下载 + 进度 + 触发保存。 */
  async function downloadViaFetch(
    url: string,
    filename?: string,
  ): Promise<File | null> {
    const response = await fetch(url, {
      headers: resolveHeaders(),
      credentials: opts.withCredentials ? "include" : "same-origin",
      signal: abortController!.signal,
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

      return file;
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

    return file;
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

      const file =
        opts.useHostBridge && detectMbaseHost() === "app"
          ? await downloadViaHostBridge(url, filename)
          : await downloadViaFetch(url, filename);
      if (!file) return null;

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
