import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSignature } from "../../src/hooks/useSignature";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useSignature", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useSignature());
    expect(result.signature.value).toBe("");
    expect(result.isEmpty.value).toBe(true);
  });

  it("bindCanvas 初始化画布", () => {
    const { result } = withSetup(() =>
      useSignature({ width: 400, height: 200 }),
    );

    const canvas = document.createElement("canvas");
    // Mock getContext
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      putImageData: vi.fn(),
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx as any);

    result.bindCanvas(canvas);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it("clear 重置画布", () => {
    const { result } = withSetup(() => useSignature());

    const canvas = document.createElement("canvas");
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      fillRect: vi.fn(),
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx as any);

    result.bindCanvas(canvas);
    result.clear();
    expect(result.isEmpty.value).toBe(true);
    expect(result.signature.value).toBe("");
  });

  it("toDataURL 导出 base64", () => {
    const { result } = withSetup(() => useSignature());

    const canvas = document.createElement("canvas");
    const mockCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      lineCap: "",
      lineJoin: "",
      fillRect: vi.fn(),
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx as any);
    vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,xxx");

    result.bindCanvas(canvas);
    const url = result.toDataURL();
    expect(url).toContain("data:image/png");
    expect(result.signature.value).toContain("data:image/png");
  });

  it("toFile 未绑定 canvas 时抛错", async () => {
    const { result } = withSetup(() => useSignature());
    await expect(result.toFile()).rejects.toThrow("canvas 未绑定");
  });
});
