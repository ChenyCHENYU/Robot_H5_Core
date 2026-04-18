import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSetup } from "./_helpers";

import { useSignature } from "../../src/hooks/useSignature";

// Mock canvas context
function createMockCanvas() {
  const ctx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt" as CanvasLineCap,
    lineJoin: "miter" as CanvasLineJoin,
    globalAlpha: 1,
    font: "",
  };

  const canvas = {
    width: 300,
    height: 150,
    getContext: vi.fn().mockReturnValue(ctx),
    getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0 }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(["img"]))),
  } as unknown as HTMLCanvasElement;

  return { canvas, ctx };
}

describe("useSignature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态 isEmpty 为 true", () => {
    const { result: { isEmpty } } = withSetup(() => useSignature());
    expect(isEmpty.value).toBe(true);
  });

  it("bindCanvas 绑定 canvas 元素", () => {
    const { result: { bindCanvas } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);
    expect(canvas.getContext).toHaveBeenCalledWith("2d");
    expect(canvas.addEventListener).toHaveBeenCalled();
  });

  it("clear 重置状态", () => {
    const { result: { bindCanvas, clear, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);
    clear();
    expect(isEmpty.value).toBe(true);
  });

  it("save 空签名返回 null", async () => {
    const { result: { save } } = withSetup(() => useSignature());
    const result = await save();
    expect(result).toBeNull();
  });

  it("undo 撤销最后一笔", () => {
    const { result: { bindCanvas, undo, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);
    undo();
    expect(isEmpty.value).toBe(true);
  });

  it("支持自定义选项", () => {
    const { result: { isEmpty } } = withSetup(() => useSignature({
      lineWidth: 5,
      strokeColor: "#ff0000",
      backgroundColor: "#f5f5f5",
    }));
    expect(isEmpty.value).toBe(true);
  });
});
