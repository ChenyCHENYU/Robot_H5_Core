import type { AppConfig } from "./types";

/**
 * 包内默认配置 — 所有字段都有合理默认值
 * 项目侧通过 defineAppConfig 覆盖
 */
export const defaults: Required<AppConfig> = {
  bridge: {
    platform: "auto",
  },
  upload: {
    action: "/api/file/upload",
    chunkSize: 2 * 1024 * 1024,
    headers: {},
  },
  image: {
    maxSize: 1024,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
  },
  location: {
    coordType: "gcj02",
    timeout: 10000,
  },
};
