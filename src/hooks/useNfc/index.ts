import { ref, type Ref, onUnmounted } from "vue";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import type { NFCData } from "../../bridge";

export interface UseNfcOptions {
  /** 读取超时(ms) */
  timeout?: number;
}

export interface UseNfcReturn {
  data: Ref<NFCData | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  read: () => Promise<NFCData | null>;
  write: (data: NFCData) => Promise<boolean>;
  clear: () => void;
}

const DEFAULTS: UseNfcOptions = {
  timeout: 10000,
};

export function useNfc(options?: UseNfcOptions): UseNfcReturn {
  const opts = { ...DEFAULTS, ...options };
  const bridge = useBridge();

  const data = ref<NFCData | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function read(): Promise<NFCData | null> {
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("useNfc", [opts]);
      const result = await bridge.nfc.read();
      const processed = await runAfterExtensions("useNfc", result);
      data.value = processed;
      return processed;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function write(nfcData: NFCData): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await bridge.nfc.write(nfcData);
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    data.value = null;
    error.value = null;
  }

  return { data, loading, error, read, write, clear };
}
