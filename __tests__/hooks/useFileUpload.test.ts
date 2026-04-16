import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFileUpload } from "../../src/hooks/useFileUpload";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useFileUpload", () => {
  beforeEach(() => {
    clearExtensions();
    vi.restoreAllMocks();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useFileUpload());
    expect(result.uploading.value).toBe(false);
    expect(result.error.value).toBeNull();
    expect(result.result.value).toBeNull();
    expect(result.progress.value.percent).toBe(0);
  });

  it("upload 小文件直传", async () => {
    const mockResponse = { code: 200, url: "/files/test.jpg" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = withSetup(() =>
      useFileUpload({ action: "/api/upload" }),
    );

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const res = await result.upload(file);
    expect(res).toEqual(mockResponse);
    expect(result.result.value).toEqual(mockResponse);
    expect(result.progress.value.percent).toBe(100);
  });

  it("upload 验证文件大小", async () => {
    const { result } = withSetup(() =>
      useFileUpload({ action: "/api/upload", maxFileSize: 10 }),
    );

    const bigFile = new File(["a".repeat(100)], "big.jpg", { type: "image/jpeg" });
    const res = await result.upload(bigFile);
    expect(res).toBeNull();
    expect(result.error.value?.message).toContain("超过限制");
  });

  it("upload 验证文件类型", async () => {
    const { result } = withSetup(() =>
      useFileUpload({
        action: "/api/upload",
        accept: ["image/jpeg", "image/png"],
      }),
    );

    const file = new File(["content"], "doc.pdf", {
      type: "application/pdf",
    });
    const res = await result.upload(file);
    expect(res).toBeNull();
    expect(result.error.value?.message).toContain("不在允许范围");
  });

  it("upload 无 action 时报错", async () => {
    const { result } = withSetup(() => useFileUpload({ action: "" }));

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const res = await result.upload(file);
    expect(res).toBeNull();
    expect(result.error.value?.message).toContain("未配置上传地址");
  });

  it("upload 失败时设置 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    const { result } = withSetup(() =>
      useFileUpload({ action: "/api/upload" }),
    );

    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    const res = await result.upload(file);
    expect(res).toBeNull();
    expect(result.error.value?.message).toContain("上传失败");
  });

  it("abort 取消上传", () => {
    const { result } = withSetup(() =>
      useFileUpload({ action: "/api/upload" }),
    );
    // 应该不抛错
    result.abort();
  });
});
