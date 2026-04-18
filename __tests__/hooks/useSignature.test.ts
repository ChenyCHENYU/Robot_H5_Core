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

  it("save 绑定 canvas 后可保存文件", async () => {
    const { result: { bindCanvas, save, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);

    // 模拟绘制：通过 addEventListener 获取 mousedown/mousemove/mouseup handler
    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      handlers[event] = fn;
    });

    // 模拟绘画操作
    handlers.mousedown({ preventDefault: vi.fn(), clientX: 10, clientY: 10 });
    handlers.mousemove({ preventDefault: vi.fn(), clientX: 20, clientY: 20 });
    handlers.mouseup();

    expect(isEmpty.value).toBe(false);

    const file = await save("image/jpeg", 0.8);
    expect(file).toBeInstanceOf(File);
    expect(file!.name).toContain("signature-");
    expect(file!.name).toMatch(/\.jpeg$/);
  });

  it("save toBlob 返回 null 时处理正确", async () => {
    const { result: { bindCanvas, save, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    (canvas.toBlob as any).mockImplementation((cb: any) => cb(null));
    bindCanvas(canvas);

    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      handlers[event] = fn;
    });
    handlers.mousedown({ preventDefault: vi.fn(), clientX: 10, clientY: 10 });
    handlers.mouseup();
    expect(isEmpty.value).toBe(false);

    const file = await save();
    expect(file).toBeNull();
  });

  it("触屏事件绘制", () => {
    const { result: { bindCanvas, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);

    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      if (!handlers[event]) handlers[event] = fn;
    });

    // touchstart
    handlers.touchstart({
      preventDefault: vi.fn(),
      touches: [{ clientX: 10, clientY: 10 }],
    });
    // touchmove
    handlers.touchmove({
      preventDefault: vi.fn(),
      touches: [{ clientX: 20, clientY: 20 }],
    });
    // touchend
    handlers.touchend();

    expect(isEmpty.value).toBe(false);
  });

  it("mouseleave 结束绘制", () => {
    const { result: { bindCanvas, isEmpty } } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);

    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      if (!handlers[event]) handlers[event] = fn;
    });

    handlers.mousedown({ preventDefault: vi.fn(), clientX: 10, clientY: 10 });
    handlers.mousemove({ preventDefault: vi.fn(), clientX: 20, clientY: 20 });
    handlers.mouseleave();

    expect(isEmpty.value).toBe(false);
  });

  it("undo 撤销最后一笔", () => {
    const { result: { bindCanvas, undo, isEmpty } } = withSetup(() => useSignature());
    const { canvas, ctx } = createMockCanvas();
    bindCanvas(canvas);

    // 先画一笔
    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      if (!handlers[event]) handlers[event] = fn;
    });
    handlers.mousedown({ preventDefault: vi.fn(), clientX: 10, clientY: 10 });
    handlers.mouseup();
    expect(isEmpty.value).toBe(false);

    // 撤销 → 触发 redraw
    undo();
    expect(isEmpty.value).toBe(true);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("unmount 时解绑事件", () => {
    const { result: { bindCanvas }, unmount } = withSetup(() => useSignature());
    const { canvas } = createMockCanvas();
    bindCanvas(canvas);
    unmount();
    expect(canvas.removeEventListener).toHaveBeenCalled();
  });

  it("支持自定义选项", () => {
    const { result: { isEmpty } } = withSetup(() => useSignature({
      lineWidth: 5,
      strokeColor: "#ff0000",
      backgroundColor: "#f5f5f5",
    }));
    expect(isEmpty.value).toBe(true);
  });

  it("onMove 未开始绘制时不执行", () => {
    const { result: { bindCanvas } } = withSetup(() => useSignature());
    const { canvas, ctx } = createMockCanvas();
    bindCanvas(canvas);

    const handlers: Record<string, Function> = {};
    (canvas.addEventListener as any).mock.calls.forEach(([event, fn]: [string, Function]) => {
      if (!handlers[event]) handlers[event] = fn;
    });

    // 直接 mousemove 不先 mousedown → 不应绘制
    const strokeCallsBefore = (ctx.stroke as any).mock.calls.length;
    handlers.mousemove({ preventDefault: vi.fn(), clientX: 20, clientY: 20 });
    expect((ctx.stroke as any).mock.calls.length).toBe(strokeCallsBefore);
  });
});
