import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));

import { useFilePreview } from "../../src/hooks/useFilePreview";

describe("useFilePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { loading, error } = useFilePreview();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("preview 调用 bridge.file.preview", async () => {
    const { preview } = useFilePreview();
    await preview("https://example.com/doc.pdf", "doc.pdf");
    expect(mockBridge.file.preview).toHaveBeenCalledWith(
      "https://example.com/doc.pdf",
      "doc.pdf",
    );
  });

  it("配置 previewServer 时拼接 URL", async () => {
    const { preview } = useFilePreview({
      previewServer: "https://preview.example.com",
    });
    await preview("https://oss.example.com/file.docx");
    expect(mockBridge.file.preview).toHaveBeenCalledWith(
      expect.stringContaining("preview.example.com"),
      undefined,
    );
  });

  it("preview 错误处理", async () => {
    mockBridge.file.preview.mockRejectedValueOnce(new Error("预览失败"));
    const { preview, error } = useFilePreview();
    await preview("https://example.com/fail");
    expect(error.value?.message).toBe("预览失败");
  });
});
