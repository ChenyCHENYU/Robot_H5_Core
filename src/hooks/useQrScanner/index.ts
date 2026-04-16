import { ref, type Ref, onUnmounted } from "vue";
import { useAppConfig } from "../../config";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseQrScannerOptions {
  /** 扫码类型：二维码 / 条形码 / 全部 */
  type?: "qrcode" | "barcode" | "all";
}

export interface UseQrScannerReturn {
  result: Ref<string>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  scan: (options?: Partial<UseQrScannerOptions>) => Promise<string | null>;
  clear: () => void;
}

const DEFAULTS: UseQrScannerOptions = {
  type: "all",
};

export function useQrScanner(
  options?: UseQrScannerOptions,
): UseQrScannerReturn {
  const config = useAppConfig();
  const opts = { ...DEFAULTS, ...options };
  const bridge = useBridge();

  const result = ref("");
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function scan(
    overrides?: Partial<UseQrScannerOptions>,
  ): Promise<string | null> {
    const merged = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useQrScanner", [merged]);
      const code = await bridge.scanner.scan(args[0]);
      const processed = await runAfterExtensions("useQrScanner", code);
      result.value = processed;
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    result.value = "";
    error.value = null;
  }

  return { result, loading, error, scan, clear };
}
