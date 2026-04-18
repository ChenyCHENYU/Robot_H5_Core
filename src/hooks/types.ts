import type { Ref } from "vue";

export interface UseCameraOptions {
  source?: "camera" | "album" | "both";
  maxSize?: number;
  quality?: number;
}

export interface UseCameraReturn {
  photo: Ref<File | null>;
  preview: Ref<string>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  capture: (options?: Partial<UseCameraOptions>) => Promise<File | null>;
  clear: () => void;
}
