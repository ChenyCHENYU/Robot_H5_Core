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
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { upload, error } = useFileUpload({ action: "/api/upload" });
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
