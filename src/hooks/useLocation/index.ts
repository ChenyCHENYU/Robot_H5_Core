import { ref, type Ref, onUnmounted } from "vue";
import { useAppConfig } from "../../config";
import { useBridge, type Coordinates } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseLocationOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
}

export interface UseLocationReturn {
  position: Ref<Coordinates | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  getCurrentPosition: () => Promise<Coordinates | null>;
  watchPosition: () => void;
  stopWatch: () => void;
}

/**
 * GPS 定位 Hook — 单次/持续定位 + 自动清理
 */
export function useLocation(options?: UseLocationOptions): UseLocationReturn {
  const config = useAppConfig();
  const opts = { ...config.location, ...options };
  const bridge = useBridge();

  const position = ref<Coordinates | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  let stopFn: (() => void) | null = null;

  async function getCurrentPosition(): Promise<Coordinates | null> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("useLocation", [opts]);
      const pos = await bridge.location.getCurrent({
        timeout: opts.timeout,
        enableHighAccuracy: opts.enableHighAccuracy,
      });
      const result = await runAfterExtensions("useLocation", pos);
      position.value = result;
      return result;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function watchPosition() {
    stopFn = bridge.location.watchPosition(
      (pos) => {
        position.value = pos;
      },
      { enableHighAccuracy: opts.enableHighAccuracy },
    );
  }

  function stopWatch() {
    stopFn?.();
    stopFn = null;
  }

  onUnmounted(stopWatch);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition,
    stopWatch,
  };
}
