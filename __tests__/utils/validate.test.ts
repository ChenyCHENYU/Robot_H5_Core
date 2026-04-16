import { describe, it, expect } from "vitest";
import {
  isPhone,
  isIdCard,
  isEmail,
  isCreditCode,
} from "../../src/utils/validate";

describe("validate", () => {
  describe("isPhone", () => {
    it.each([
      ["13800138000", true],
      ["15912345678", true],
      ["19999999999", true],
      ["12345678901", false], // 不以 13-19 开头
      ["1380013800", false], // 10 位
      ["138001380001", false], // 12 位
      ["", false],
      ["abcdefghijk", false],
    ])("isPhone(%s) → %s", (input, expected) => {
      expect(isPhone(input)).toBe(expected);
    });
  });

  describe("isIdCard", () => {
    it("有效身份证号通过", () => {
      // 校验码为 X 的情况
      expect(isIdCard("11010519491231002X")).toBe(true);
    });

    it("无效身份证号不通过", () => {
      expect(isIdCard("110105194912310020")).toBe(false); // 校验码错
      expect(isIdCard("12345678901234567")).toBe(false); // 17 位
      expect(isIdCard("")).toBe(false);
    });
  });

  describe("isEmail", () => {
    it.each([
      ["test@example.com", true],
      ["user.name+tag@domain.co", true],
      ["@example.com", false],
      ["test@", false],
      ["test@.com", false],
      ["", false],
    ])("isEmail(%s) → %s", (input, expected) => {
      expect(isEmail(input)).toBe(expected);
    });
  });

  describe("isCreditCode", () => {
    it("18位信用代码格式", () => {
      expect(isCreditCode("91350100M000100Y43")).toBe(true);
      expect(isCreditCode("123")).toBe(false);
    });
  });
});
