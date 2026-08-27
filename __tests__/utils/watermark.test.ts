import { describe, expect, it } from "vitest";
import {
  WATERMARK_POLICY_FORM_FIELD,
  WatermarkPolicyError,
  buildWatermarkFormData,
  normalizeServerWatermarkPolicy,
} from "../../src/utils/watermark";

describe("服务端水印策略", () => {
  it("关闭水印时不增加协议字段且不修改原对象", () => {
    const base = { businessId: "A001" };
    const result = buildWatermarkFormData(base, { enabled: false });

    expect(result).toEqual(base);
    expect(result).not.toBe(base);
    expect(result).not.toHaveProperty(WATERMARK_POLICY_FORM_FIELD);
  });

  it("开启水印时生成可跨原生 multipart 透传的 JSON 字符串", () => {
    const result = buildWatermarkFormData(
      { businessId: "A001" },
      {
        enabled: true,
        templateId: "inspection-photo-v1",
        source: "album",
        clientCapturedAt: new Date("2026-08-24T01:00:00.000Z"),
        location: {
          longitude: 120.12,
          latitude: 30.28,
          accuracy: 15,
          address: "测试区域",
        },
        context: { businessName: "气体检测", sequence: 1 },
      },
    );

    expect(JSON.parse(String(result.watermarkPolicy))).toEqual({
      enabled: true,
      required: true,
      templateId: "inspection-photo-v1",
      source: "album",
      clientCapturedAt: "2026-08-24T01:00:00.000Z",
      location: {
        longitude: 120.12,
        latitude: 30.28,
        accuracy: 15,
        address: "测试区域",
      },
      context: { businessName: "气体检测", sequence: 1 },
    });
  });

  it("开启水印必须使用合法模板", () => {
    expect(() =>
      normalizeServerWatermarkPolicy({ enabled: true }),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "template_required",
      }),
    );
    expect(() =>
      normalizeServerWatermarkPolicy({
        enabled: true,
        templateId: "../unsafe",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "invalid_template",
      }),
    );
  });

  it("拒绝覆盖 Core 保留字段", () => {
    expect(() =>
      buildWatermarkFormData(
        { watermarkPolicy: "manual" },
        { enabled: true, templateId: "inspection-photo-v1" },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "reserved_field_conflict",
      }),
    );
    expect(() =>
      buildWatermarkFormData(
        { watermarkPolicy: "manual" },
        { enabled: false },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "reserved_field_conflict",
      }),
    );
  });

  it("拒绝越界定位和非有限上下文数值", () => {
    expect(() =>
      normalizeServerWatermarkPolicy({
        enabled: true,
        templateId: "inspection-photo-v1",
        location: { longitude: 181, latitude: 30 },
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "invalid_location",
      }),
    );
    expect(() =>
      normalizeServerWatermarkPolicy({
        enabled: true,
        templateId: "inspection-photo-v1",
        context: { invalid: Number.NaN },
      }),
    ).toThrowError(
      expect.objectContaining<Partial<WatermarkPolicyError>>({
        code: "invalid_context",
      }),
    );
  });
});
