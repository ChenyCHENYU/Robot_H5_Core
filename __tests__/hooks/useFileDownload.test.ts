import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useFileDownload } from "../../src/hooks/useFileDownload";

/**
 * 构造一个带 ReadableStream body 的 mock Response
 */
function createMockResponse(
  body: Uint8Array,
  opts: {
    status?: number;
    ok?: boolean;
    contentType?: string;
    contentDisposition?: string;
    contentLength?: number;
  } = {},
) {
  const {
    status = 200,
    ok = true,
    contentType = "application/octet-stream",
    contentDisposition,
    contentLength = body.byteLength,
  } = opts;

  const headers = new Headers({
    "content-type": contentType,
    "content-length": String(contentLength),
  });
  if (contentDisposition) {
    headers.set("content-disposition", contentDisposition);
  }

  // 模拟 ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(body);
      controller.close();
    },
  });

  return {
    ok,
    status,
    statusText: ok ? "OK" : "Server Error",
    headers,
    body: stream,
    blob: () => Promise.resolve(new Blob([body], { type: contentType })),
  };
}

describe("useFileDownload", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL / revokeObjectURL（保留 URL 构造函数）
    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    // Mock document.createElement for <a> tag
    const mockAnchor = {
      href: "",
      download: "",
      style: { display: "" },
      click: vi.fn(),
    };
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
    vi.spyOn(document.body, "removeChild").mockImplementation((n) => n);
  });

  it("初始状态正确", () => {
    const { downloading, error, progress } = useFileDownload();
    expect(downloading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(progress.value.percent).toBe(0);
  });

  it("下载文件成功 + 流式进度", async () => {
    const content = new TextEncoder().encode("hello world");
    mockFetch.mockResolvedValue(createMockResponse(content));

    const { download, progress } = useFileDownload();
    const result = await download(
      "https://example.com/files/report.pdf",
      "report.pdf",
    );

    expect(result).toBeInstanceOf(File);
    expect(result!.name).toBe("report.pdf");
    expect(progress.value.percent).toBe(100);
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it("从 Content-Disposition 推断文件名", async () => {
    const content = new TextEncoder().encode("data");
    mockFetch.mockResolvedValue(
      createMockResponse(content, {
        contentDisposition: 'attachment; filename="exported.xlsx"',
      }),
    );

    const { download } = useFileDownload();
    const result = await download("https://example.com/api/export");
    expect(result!.name).toBe("exported.xlsx");
  });

  it("从 Content-Disposition filename* UTF-8 推断文件名", async () => {
    const content = new TextEncoder().encode("data");
    mockFetch.mockResolvedValue(
      createMockResponse(content, {
        contentDisposition:
          "attachment; filename*=UTF-8''%E6%8A%A5%E8%A1%A8.pdf",
      }),
    );

    const { download } = useFileDownload();
    const result = await download("https://example.com/api/export");
    expect(result!.name).toBe("报表.pdf");
  });

  it("从 URL 路径推断文件名", async () => {
    const content = new TextEncoder().encode("data");
    mockFetch.mockResolvedValue(createMockResponse(content));

    const { download } = useFileDownload();
    const result = await download("https://example.com/files/contract.pdf");
    expect(result!.name).toBe("contract.pdf");
  });

  it("HTTP 错误时设置 error", async () => {
    mockFetch.mockResolvedValue(
      createMockResponse(new Uint8Array(), {
        status: 404,
        ok: false,
      }),
    );

    const { download, error } = useFileDownload();
    const result = await download("https://example.com/not-found");
    expect(result).toBeNull();
    expect(error.value?.message).toContain("404");
  });

  it("abort 取消下载", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new DOMException("Aborted", "AbortError")),
            50,
          );
        }),
    );

    const { download, abort, error } = useFileDownload();
    const promise = download("https://example.com/large-file.zip");
    abort();
    const result = await promise;
    expect(result).toBeNull();
    // AbortError 不应设置 error
    expect(error.value).toBeNull();
  });

  it("headers 支持函数形式", async () => {
    const content = new TextEncoder().encode("ok");
    mockFetch.mockResolvedValue(createMockResponse(content));

    const { download } = useFileDownload({
      headers: () => ({ Authorization: "Bearer token123" }),
    });
    await download("https://example.com/files/a.txt", "a.txt");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/files/a.txt",
      expect.objectContaining({
        headers: { Authorization: "Bearer token123" },
      }),
    );
  });

  it("withCredentials 传递 credentials: include", async () => {
    const content = new TextEncoder().encode("ok");
    mockFetch.mockResolvedValue(createMockResponse(content));

    const { download } = useFileDownload({ withCredentials: true });
    await download("https://example.com/files/a.txt", "a.txt");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/files/a.txt",
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("无 body 时降级到 blob()", async () => {
    const content = new TextEncoder().encode("fallback");
    mockFetch.mockResolvedValue(
      createMockResponse(content, { contentLength: 0 }),
    );

    const { download, progress } = useFileDownload();
    const result = await download("https://example.com/files/doc.pdf");
    expect(result).toBeInstanceOf(File);
    expect(progress.value.percent).toBe(100);
  });
});
