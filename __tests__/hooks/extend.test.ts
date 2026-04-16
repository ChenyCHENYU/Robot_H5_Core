import { describe, it, expect, beforeEach } from "vitest";
import {
  extendHook,
  runBeforeExtensions,
  runAfterExtensions,
  clearExtensions,
} from "../../src/hooks/extend";

describe("hook extensions", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("before 扩展修改参数", async () => {
    extendHook("useCamera", {
      before: (opts) => [{ ...opts, quality: 0.5 }],
    });

    const result = await runBeforeExtensions("useCamera", [{ quality: 0.8 }]);
    expect(result[0].quality).toBe(0.5);
  });

  it("after 扩展处理结果", async () => {
    extendHook("useCamera", {
      after: (file, ctx) => {
        ctx.meta.processed = true;
        return file;
      },
    });

    const result = await runAfterExtensions("useCamera", "test-file");
    expect(result).toBe("test-file");
  });

  it("多个扩展按注册顺序执行", async () => {
    const order: number[] = [];

    extendHook("useTest", {
      before: (x) => {
        order.push(1);
        return [x];
      },
    });
    extendHook("useTest", {
      before: (x) => {
        order.push(2);
        return [x];
      },
    });

    await runBeforeExtensions("useTest", ["data"]);
    expect(order).toEqual([1, 2]);
  });

  it("无扩展时透传", async () => {
    const args = await runBeforeExtensions("nonexistent", ["a", "b"]);
    expect(args).toEqual(["a", "b"]);

    const result = await runAfterExtensions("nonexistent", 42);
    expect(result).toBe(42);
  });

  it("clearExtensions 清除所有", async () => {
    extendHook("useTest", { before: () => ["modified"] });
    clearExtensions();

    const args = await runBeforeExtensions("useTest", ["original"]);
    expect(args).toEqual(["original"]);
  });
});
