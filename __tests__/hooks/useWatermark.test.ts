import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWatermark } from "../../src/hooks/useWatermark";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useWatermark", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useWatermark());
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("createPageWatermark 创建水印层", () => {
    const { result } = withSetup(() =>
      useWatermark({ texts: ["TestUser"], showTime: false }),
    );

    const container = document.createElement("div");
    const cleanup = result.createPageWatermark(container, {
      texts: ["TestUser"],
      showTime: false,
    });

    // 应该添加了一个子元素
    expect(container.children.length).toBeGreaterThanOrEqual(1);
    const watermarkDiv = container.querySelector("div");
    expect(watermarkDiv).not.toBeNull();
    expect(watermarkDiv?.style.pointerEvents).toBe("none");

    // cleanup 移除水印
    cleanup();
  });

  it("createPageWatermark 返回清理函数", () => {
    const { result } = withSetup(() =>
      useWatermark({ texts: ["Test"], showTime: false }),
    );

    const container = document.createElement("div");
    const cleanup = result.createPageWatermark(container, {
      texts: ["Test"],
      showTime: false,
    });

    expect(typeof cleanup).toBe("function");
    cleanup();
  });
});
