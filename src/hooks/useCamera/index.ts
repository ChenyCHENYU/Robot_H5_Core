import { ref, onUnmounted } from "vue";
import { useAppConfig } from "../../config";
import { useBridge } from "../../bridge";
import { compressImage } from "../../utils/image";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import type { UseCameraOptions, UseCameraReturn } from "../types";

const DEFAULTS: UseCameraOptions = {
  source: "both",
  maxSize: 1024,
  quality: 0.8,
  watermark: false,
};

export function useCamera(
  options?: Partial<UseCameraOptions>,
): UseCameraReturn {
  const config = useAppConfig();
  const opts = { ...DEFAULTS, ...config.image, ...options };
  const bridge = useBridge();

  const photo = ref<File | null>(null);
  const preview = ref("");
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function capture(
    overrides?: Partial<UseCameraOptions>,
  ): Promise<File | null> {
    const merged = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useCamera", [merged]);
      const file = await bridge.camera.capture(args[0]);
      const compressed = merged.maxSize
        ? await compressImage(file, {
            maxSize: merged.maxSize,
            quality: merged.quality,
          })
        : file;

      const result = await runAfterExtensions("useCamera", compressed);
      photo.value = result;
      preview.value = URL.createObjectURL(result);
      return result;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    if (preview.value) URL.revokeObjectURL(preview.value);
    photo.value = null;
    preview.value = "";
  }

  onUnmounted(clear);

  return { photo, preview, loading, error, capture, clear };
}
