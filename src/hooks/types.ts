import type { Ref } from "vue";

/** 所有 Hook 的通用返回结构 */
export interface UseAsyncReturn<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  execute: (...args: any[]) => Promise<T>;
}

export interface UseCameraOptions {
  source?: "camera" | "album" | "both";
  maxSize?: number;
  quality?: number;
  watermark?: boolean;
  watermarkText?: string;
}

export interface UseCameraReturn {
  photo: Ref<File | null>;
  preview: Ref<string>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  capture: (options?: Partial<UseCameraOptions>) => Promise<File | null>;
  clear: () => void;
}

export interface UseLocationOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
}
