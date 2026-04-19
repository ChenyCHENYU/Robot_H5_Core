import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockConfig } from "./_helpers";

vi.mock("../../src/config", () => ({
  useAppConfig: () => createMockConfig(),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { useFileUpload } from "../../src/hooks/useFileUpload";

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, url: "/files/test.txt" }),
    });
  });

  it("初始状态正确", () => {
    const { uploading, error, progress } = useFileUpload();
    expect(uploading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(progress.value.percent).toBe(0);
  });

  it("upload 小文件成功", async () => {
    const { upload, progress } = useFileUpload({
      action: "/api/upload",
      chunkSize: 1024 * 1024,
    });
    const file = new File(["hello"], "test.txt", { type: "text/plain" });
    const result = await upload(file);
    expect(result).toEqual({ code: 200, url: "/files/test.txt" });
    expect(progress.value.percent).toBe(100);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("未配置 action 返回错误", async () => {
    const { upload, error } = useFileUpload({ action: "" });
    const result = await upload(new File(["x"], "x.txt"));
    expect(result).toBeNull();
    expect(error.value?.message).toContain("action");
  });

  it("abort 取消上传", async () => {
    const { upload, abort } = useFileUpload({ action: "/api/upload" });
    mockFetch.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new DOMException("Aborted", "AbortError")),
            50,
          );
        }),
    );
    const promise = upload(new File(["x"], "x.txt"));
    abort();
    const result = await promise;
    expect(result).toBeNull();
  });

  it("HTTP 错误时设置 error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const { upload, error } = useFileUpload({
      action: "/api/upload",
      maxRetries: 0,
    });
    await upload(new File(["x"], "x.txt"));
    expect(error.value?.message).toContain("500");
  });

  it("headers 支持函数形式", async () => {
    const { upload } = useFileUpload({
      action: "/api/upload",
      headers: () => ({ Authorization: "Bearer token123" }),
    });
    await upload(new File(["x"], "x.txt"));
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/upload",
      expect.objectContaining({
        headers: { Authorization: "Bearer token123" },
      }),
    );
  });
});

describe("useFileUpload resumable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, url: "/files/test.txt" }),
    });
  });

  it("resumable 模式完成后清除 localStorage 记录", async () => {
    const { upload } = useFileUpload({
      action: "/api/upload",
      chunkSize: 1024 * 1024,
      resumable: true,
    });
    const file = new File(["hello"], "test.txt", { type: "text/plain" });
    await upload(file);

    // 上传完成后 localStorage 应该被清除
    const keys = Object.keys(localStorage);
    const uploadKeys = keys.filter((k) => k.startsWith("h5_upload_"));
    expect(uploadKeys).toHaveLength(0);
  });

  it("resumable 模式跳过已上传分片", async () => {
    // 创建一个多分片文件（10 bytes，每片 3 bytes → 4 片）
    const content = "0123456789";
    const file = new File([content], "big.txt", { type: "text/plain" });
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;

    // 预设前 2 个分片已上传
    localStorage.setItem(`h5_upload_${fileId}`, JSON.stringify([0, 1]));

    const { upload, progress } = useFileUpload({
      action: "/api/upload",
      chunkSize: 3,
      resumable: true,
    });

    await upload(file);

    // 只应该上传分片 2 和 3（跳过 0 和 1）
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(progress.value.percent).toBe(100);
  });

  it("非 resumable 模式不使用 localStorage", async () => {
    const { upload } = useFileUpload({
      action: "/api/upload",
      chunkSize: 1024 * 1024,
      resumable: false,
    });
    const file = new File(["hello"], "test.txt", { type: "text/plain" });
    await upload(file);

    const keys = Object.keys(localStorage);
    const uploadKeys = keys.filter((k) => k.startsWith("h5_upload_"));
    expect(uploadKeys).toHaveLength(0);
  });
});
