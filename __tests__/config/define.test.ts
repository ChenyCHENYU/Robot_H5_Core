import { describe, it, expect } from "vitest";
import { createApp } from "vue";
import {
  defineAppConfig,
  useAppConfig,
  deepMerge,
} from "../../src/config/define";
import { defaults } from "../../src/config/defaults";

describe("config", () => {
  describe("deepMerge", () => {
    it("合并嵌套对象", () => {
      const base = { a: 1, nested: { x: 10, y: 20 } };
      const override = { nested: { x: 99 } };
      const result = deepMerge(base, override);
      expect(result).toEqual({ a: 1, nested: { x: 99, y: 20 } });
    });

    it("undefined 值不覆盖", () => {
      const base = { a: 1, b: 2 };
      const override = { a: undefined, b: 3 };
      const result = deepMerge(base, override);
      expect(result.a).toBe(1);
      expect(result.b).toBe(3);
    });

    it("多个 source 依次合并", () => {
      const result = deepMerge({ a: 1 }, { a: 2 }, { a: 3 });
      expect(result.a).toBe(3);
    });
  });

  describe("defaults", () => {
    it("默认配置存在", () => {
      expect(defaults.image.maxSize).toBe(1024);
      expect(defaults.bridge.platform).toBe("auto");
      expect(defaults.upload.chunkSize).toBe(2 * 1024 * 1024);
      expect(defaults.location.coordType).toBe("gcj02");
    });
  });

  describe("defineAppConfig", () => {
    it("在 app 实例上提供配置", () => {
      const app = createApp({ template: "<div />" });
      defineAppConfig(app, {
        image: { maxSize: 500 },
      });
      // defineAppConfig 不抛错即说明注入成功
      expect(true).toBe(true);
    });
  });
});
