import { ref, type Ref } from "vue";
import { useBridge, type BluetoothDeviceInfo } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseBluetoothReturn {
  device: Ref<BluetoothDeviceInfo | null>;
  connected: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  connect: (deviceId: string) => Promise<BluetoothDeviceInfo | null>;
  disconnect: () => Promise<void>;
}

/**
 * 蓝牙设备连接 Hook
 * Web Bluetooth 仅 Chrome 系支持，iOS 完全不可用，建议配合 Native Bridge
 */
export function useBluetooth(): UseBluetoothReturn {
  const bridge = useBridge();

  const device = ref<BluetoothDeviceInfo | null>(null);
  const connected = ref(false);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function connect(
    deviceId: string,
  ): Promise<BluetoothDeviceInfo | null> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("useBluetooth", [deviceId]);
      const info = await bridge.bluetooth.connect(deviceId);
      const result = await runAfterExtensions("useBluetooth", info);
      device.value = result;
      connected.value = true;
      return result;
    } catch (e) {
      error.value = e as Error;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function disconnect(): Promise<void> {
    try {
      await bridge.bluetooth.disconnect();
      device.value = null;
      connected.value = false;
    } catch (e) {
      error.value = e as Error;
    }
  }

  return { device, connected, loading, error, connect, disconnect };
}
