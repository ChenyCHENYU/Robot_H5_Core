import { describe, it, expect } from "vitest";
import { formatDate, formatMoney } from "../../src/utils/format";

describe("format", () => {
  describe("formatDate", () => {
    it("默认格式 YYYY-MM-DD HH:mm:ss", () => {
      const d = new Date(2025, 0, 15, 9, 30, 45);
      expect(formatDate(d)).toBe("2025-01-15 09:30:45");
    });

    it("自定义格式", () => {
      const d = new Date(2025, 11, 1);
      expect(formatDate(d, "YYYY/MM/DD")).toBe("2025/12/01");
    });

    it("接受时间戳", () => {
      const ts = new Date(2025, 5, 15).getTime();
      expect(formatDate(ts, "YYYY-MM-DD")).toBe("2025-06-15");
    });

    it("无效日期返回空字符串", () => {
      expect(formatDate("invalid")).toBe("");
    });
  });

  describe("formatMoney", () => {
    it("千分位格式化", () => {
      expect(formatMoney(1234567.89)).toBe("1,234,567.89");
    });

    it("零值", () => {
      expect(formatMoney(0)).toBe("0.00");
    });

    it("自定义小数位", () => {
      expect(formatMoney(1234, 0)).toBe("1,234");
    });

    it("千以内不加逗号", () => {
      expect(formatMoney(999.99)).toBe("999.99");
    });

    it("负数", () => {
      expect(formatMoney(-1234567.89)).toBe("-1,234,567.89");
    });
  });
});
