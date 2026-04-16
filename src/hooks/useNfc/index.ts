import { ref, type Ref } from "vue";
import { useBridge, type NFCData } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseNfcReturn {
  data: Ref<NFCData | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  read: () => Promise<NFCData | null>;
  write: (data: NFCData) => Promise<boolean>;
}

/**
 * NFC 读写 Hook
 * 浏览器环境不支持，需通过 Native Bridge 实现
 */
export function useNfc(): UseNfcReturn {
  const bridge = useBridge();

  const data = ref<NFCData | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function read(): Promise<NFCData | null> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("useNfc", []);
      const nfcData = await bridge.nfc.read();
      const result = await runAfterExtensions("useNfc", nfcData);
      data.value = result;
      return result;
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
      await runBeforeExtensions("useNfc", [nfcData]);
      await bridge.nfc.write(nfcData);
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, read, write };
}
