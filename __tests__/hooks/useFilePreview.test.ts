import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFilePreview } from "../../src/hooks/useFilePreview";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useFilePreview", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useFilePreview());
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("preview 调用 bridge.file.preview", async () => {
    const previewMock = vi.fn().mockResolvedValue(undefined);
    const { result } = withSetup(() => useFilePreview(), {
      file: { preview: previewMock },
    });

    const ok = await result.preview("https://example.com/doc.pdf", "doc.pdf");
    expect(ok).toBe(true);
    expect(previewMock).toHaveBeenCalledWith(
      "https://example.com/doc.pdf",
      "doc.pdf",
    );
  });

  it("preview window 模式打开新窗口", async () => {
    const openMock = vi.fn();
    vi.stubGlobal("open", openMock);

    const { result } = withSetup(() =>
      useFilePreview({ mode: "window" }),
    );

    await result.preview("https://example.com/doc.pdf");
    expect(openMock).toHaveBeenCalledWith(
      "https://example.com/doc.pdf",
      "_blank",
    );

    vi.unstubAllGlobals();
  });

  it("preview 失败时设置 error", async () => {
    const { result } = withSetup(() => useFilePreview(), {
      file: { preview: vi.fn().mockRejectedValue(new Error("预览失败")) },
    });

    const ok = await result.preview("https://example.com/doc.pdf");
    expect(ok).toBe(false);
    expect(result.error.value?.message).toBe("预览失败");
  });
});
