import { describe, it, expect } from "vitest";
import { gcj02ToWgs84, wgs84ToGcj02 } from "../../src/utils/coord";

describe("coord", () => {
  // 天安门坐标 GCJ-02: 116.397428, 39.90923
  const gcjLng = 116.397428;
  const gcjLat = 39.90923;

  describe("gcj02ToWgs84", () => {
    it("中国境内转换", () => {
      const [lng, lat] = gcj02ToWgs84(gcjLng, gcjLat);
      // WGS-84 应比 GCJ-02 有偏移，但偏差在 0.01 度以内
      expect(Math.abs(lng - gcjLng)).toBeLessThan(0.01);
      expect(Math.abs(lat - gcjLat)).toBeLessThan(0.01);
      // 确保确实有偏移（不是原值）
      expect(lng).not.toBe(gcjLng);
      expect(lat).not.toBe(gcjLat);
    });

    it("国外坐标不转换", () => {
      const [lng, lat] = gcj02ToWgs84(-73.9857, 40.7484); // 纽约
      expect(lng).toBe(-73.9857);
      expect(lat).toBe(40.7484);
    });
  });

  describe("wgs84ToGcj02", () => {
    it("中国境内转换", () => {
      const [lng, lat] = wgs84ToGcj02(116.3912, 39.9075);
      expect(Math.abs(lng - 116.3912)).toBeLessThan(0.01);
      expect(Math.abs(lat - 39.9075)).toBeLessThan(0.01);
      expect(lng).not.toBe(116.3912);
    });

    it("互逆转换近似还原", () => {
      const [wgsLng, wgsLat] = gcj02ToWgs84(gcjLng, gcjLat);
      const [backLng, backLat] = wgs84ToGcj02(wgsLng, wgsLat);
      // 互逆后误差应在 0.0001 度以内（约 10m）
      expect(Math.abs(backLng - gcjLng)).toBeLessThan(0.0001);
      expect(Math.abs(backLat - gcjLat)).toBeLessThan(0.0001);
    });
  });
});
