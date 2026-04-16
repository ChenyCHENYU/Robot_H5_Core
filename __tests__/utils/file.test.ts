import { describe, it, expect } from "vitest";
import { getFileType, formatFileSize } from "../../src/utils/file";

describe("file utils", () => {
  describe("getFileType", () => {
    it.each([
      ["document.pdf", "application/pdf"],
      ["photo.jpg", "image/jpeg"],
      ["photo.jpeg", "image/jpeg"],
      ["image.png", "image/png"],
      [
        "data.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      ["readme.txt", "text/plain"],
      ["unknown.xyz", "application/octet-stream"],
      ["noextension", "application/octet-stream"],
    ])("getFileType(%s) → %s", (name, expected) => {
      expect(getFileType(name)).toBe(expected);
    });
  });

  describe("formatFileSize", () => {
    it.each([
      [0, "0 B"],
      [512, "512 B"],
      [1024, "1.00 KB"],
      [1048576, "1.00 MB"],
      [1073741824, "1.00 GB"],
      [1536, "1.50 KB"],
    ])("formatFileSize(%d) → %s", (bytes, expected) => {
      expect(formatFileSize(bytes)).toBe(expected);
    });

    it("负数返回 0 B", () => {
      expect(formatFileSize(-1)).toBe("0 B");
    });
  });
});
