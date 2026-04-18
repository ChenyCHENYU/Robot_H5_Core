import type { BridgeAdapterOverrides } from "../bridge/types";

/**
 * 全局配置类型定义
 */
export interface AppConfig {
  bridge?: BridgeConfig;
  upload?: UploadConfig;
  image?: ImageConfig;
  location?: LocationConfig;
}

export interface BridgeConfig {
  /** 宿主平台：auto 自动检测 */
  platform?:
    | "auto"
    | "native"
    | "dingtalk"
    | "wechat"
    | "browser"
    | (string & {});
  /** APP 端自定义 UA 特征 */
  nativeUA?: string;
  /** 钉钉配置 */
  dingtalk?: { corpId: string };
  /** 微信配置 */
  wechat?: { appId: string; jsApiList?: string[] };
  /** 项目侧 SDK 能力覆盖 — 未提供的能力自动降级到浏览器实现 */
  overrides?: BridgeAdapterOverrides;
}

export interface UploadConfig {
  /** 上传接口 URL */
  action: string;
  /** 分片大小 (bytes)，默认 2MB */
  chunkSize?: number;
  /** 自定义请求头（支持函数动态生成） */
  headers?: Record<string, string> | (() => Record<string, string>);
}

export interface ImageConfig {
  /** 最大文件大小 (KB) */
  maxSize?: number;
  /** 压缩质量 0-1 */
  quality?: number;
  /** 最大宽度 (px) */
  maxWidth?: number;
  /** 最大高度 (px) */
  maxHeight?: number;
}

export interface LocationConfig {
  /** 坐标系 */
  coordType?: "gcj02" | "wgs84";
  /** 超时 (ms) */
  timeout?: number;
}
