import { ref, type Ref } from "vue";
import { useBridge, type ScanOptions } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseQrScannerOptions {
  type?: "qrcode" | "barcode" | "all";
}

export interface UseQrScannerReturn {
  result: Ref<string>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  scan: (options?: UseQrScannerOptions) => Promise<string | null>;
}

const DEFAULTS: UseQrScannerOptions = { type: "qrcode" };

/**
 * 二维码/条形码扫描 Hook
 * 通过 Bridge 调用原生扫码，浏览器降级需接入 jsQR 等库
 */
export function useQrScanner(options?: UseQrScannerOptions): UseQrScannerReturn {
  const bridge = useBridge();
  const opts = { ...DEFAULTS, ...options };

  const result = ref("");
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function scan(overrides?: UseQrScannerOptions): Promise<string | null> {
    const merged: ScanOptions = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;
    try {
      const args = await runBeforeExtensions("useQrScanner", [merged]);
      const text = await bridge.scanner.scan(args[0]);
      const processed = await runAfterExtensions("useQrScanner", text);
      result.value = processed;
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { result, loading, error, scan };
}
