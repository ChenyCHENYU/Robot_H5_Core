import { ref, type Ref, onUnmounted } from "vue";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import type { BluetoothDeviceInfo } from "../../bridge";

export interface UseBluetoothOptions {
  /** 自动重连 */
  autoReconnect?: boolean;
  /** 重连间隔(ms) */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
}

export interface UseBluetoothReturn {
  device: Ref<BluetoothDeviceInfo | null>;
  connected: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  connect: (
    deviceId: string,
    options?: Partial<UseBluetoothOptions>,
  ) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

const DEFAULTS: UseBluetoothOptions = {
  autoReconnect: false,
  reconnectInterval: 3000,
  maxReconnectAttempts: 3,
};

export function useBluetooth(
  options?: UseBluetoothOptions,
): UseBluetoothReturn {
  const opts = { ...DEFAULTS, ...options };
  const bridge = useBridge();

  const device = ref<BluetoothDeviceInfo | null>(null);
  const connected = ref(false);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentDeviceId = "";

  async function connect(
    deviceId: string,
    overrides?: Partial<UseBluetoothOptions>,
  ): Promise<boolean> {
    const merged = { ...opts, ...overrides };
    loading.value = true;
    error.value = null;
    currentDeviceId = deviceId;
    reconnectAttempts = 0;

    try {
      const args = await runBeforeExtensions("useBluetooth", [
        deviceId,
        merged,
      ]);
      const info = await bridge.bluetooth.connect(args[0]);
      const processed = await runAfterExtensions("useBluetooth", info);
      device.value = processed;
      connected.value = true;
      return true;
    } catch (e) {
      error.value = e as Error;
      connected.value = false;

      // 自动重连
      if (
        merged.autoReconnect &&
        reconnectAttempts < merged.maxReconnectAttempts!
      ) {
        reconnectAttempts++;
        reconnectTimer = setTimeout(
          () => connect(currentDeviceId, merged),
          merged.reconnectInterval,
        );
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  async function disconnect(): Promise<void> {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;

    try {
      await bridge.bluetooth.disconnect();
    } finally {
      device.value = null;
      connected.value = false;
    }
  }

  onUnmounted(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (connected.value) {
      bridge.bluetooth.disconnect().catch(() => {});
    }
  });

  return { device, connected, loading, error, connect, disconnect };
}
