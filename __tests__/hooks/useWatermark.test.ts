import { describe, it, expect, vi, beforeEach } from "vitest";

import { useWatermark } from "../../src/hooks/useWatermark";

// Mock createImageBitmap
vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
  width: 800,
  height: 600,
  close: vi.fn(),
}));

describe("useWatermark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { loading, error } = useWatermark();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("addWatermark 成功时返回 File", async () => {
    // Mock canvas
    const mockCtx = {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      globalAlpha: 1,
      font: "",
      fillStyle: "",
    };
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(["watermarked"]))),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as any);

    const { addWatermark } = useWatermark({ text: "测试水印" });
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const result = await addWatermark(file);
    expect(result).toBeInstanceOf(File);
    expect(result!.name).toBe("photo.jpg");
  });

  it("addWatermark 错误处理", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockRejectedValue(new Error("解码失败")),
    );
    const { addWatermark, error } = useWatermark({ text: "test" });
    const file = new File(["bad"], "bad.jpg", { type: "image/jpeg" });
    const result = await addWatermark(file);
    expect(result).toBeNull();
    expect(error.value?.message).toBe("解码失败");
  });

  it("支持不同水印位置", () => {
    const positions = [
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
      "center",
    ] as const;
    for (const pos of positions) {
      const { loading } = useWatermark({ position: pos, text: "test" });
      expect(loading.value).toBe(false);
    }
  });
});
