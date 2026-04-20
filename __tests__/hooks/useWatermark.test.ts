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
    // Reset createImageBitmap mock
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 800,
      height: 600,
      close: vi.fn(),
    }));
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
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      globalAlpha: 1,
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      lineJoin: "miter",
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

  it("autoScale 根据图片尺寸缩放字号", async () => {
    const mockCtx = {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 200 }),
      globalAlpha: 1,
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      lineJoin: "miter",
    };
    const mockCanvas = {
      width: 3000,
      height: 4000,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(["scaled"]))),
    };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 3000,
      height: 4000,
      close: vi.fn(),
    }));
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as any);

    const { addWatermark } = useWatermark({ text: "缩放测试", fontSize: 48 });
    const file = new File(["img"], "large.jpg", { type: "image/jpeg" });
    await addWatermark(file);

    // fontSize=48 on a 3000px wide image (reference 750) → 48 * (3000/750) = 192
    expect(mockCtx.font).toContain("192px");
  });

  it("stroke=false 不绘制描边", async () => {
    const mockCtx = {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 100 }),
      globalAlpha: 1,
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      lineJoin: "miter",
    };
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(["no-stroke"]))),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as any);

    const { addWatermark } = useWatermark({ text: "无描边", stroke: false });
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    await addWatermark(file);
    expect(mockCtx.strokeText).not.toHaveBeenCalled();
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
