import { ref, type Ref, onUnmounted } from "vue";
import { useBridge, type PushMessage } from "../../bridge";
import { runBeforeExtensions } from "../extend";

export interface UsePushNotificationReturn {
  messages: Ref<PushMessage[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  register: (token: string) => Promise<boolean>;
  onMessage: (callback: (msg: PushMessage) => void) => void;
  clearMessages: () => void;
}

/**
 * 推送通知 Hook — 统一推送消息接收
 * 通过 Bridge 对接原生推送通道（钉钉/微信/APP）
 */
export function usePushNotification(): UsePushNotificationReturn {
  const bridge = useBridge();

  const messages = ref<PushMessage[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  let unsubscribe: (() => void) | null = null;

  async function register(token: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      await runBeforeExtensions("usePushNotification", [token]);
      await bridge.notification.register(token);
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function onMessage(callback: (msg: PushMessage) => void) {
    unsubscribe = bridge.notification.onMessage((msg) => {
      messages.value.push(msg);
      callback(msg);
    });
  }

  function clearMessages() {
    messages.value = [];
  }

  onUnmounted(() => {
    unsubscribe?.();
  });

  return { messages, loading, error, register, onMessage, clearMessages };
}
