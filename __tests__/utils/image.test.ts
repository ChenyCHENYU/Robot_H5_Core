import { describe, it, expect } from "vitest";
import { fileToBase64, base64ToBlob } from "../../src/utils/image";

describe("image utils", () => {
  describe("fileToBase64 + base64ToBlob", () => {
    it("双向转换保持数据一致", async () => {
      const content = "hello world";
      const original = new File([content], "test.txt", { type: "text/plain" });

      const base64 = await fileToBase64(original);
      expect(base64).toContain("data:text/plain;base64,");

      const blob = base64ToBlob(base64);
      expect(blob.type).toBe("text/plain");
      expect(blob.size).toBe(original.size);
    });
  });

  describe("base64ToBlob", () => {
    it("无效 base64 抛错", () => {
      expect(() => base64ToBlob("invalid")).toThrow();
    });
  });
});
