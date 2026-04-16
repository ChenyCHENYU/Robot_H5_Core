import { ref, type Ref, onUnmounted } from "vue";
import { useBridge } from "../../bridge";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import type { PushMessage } from "../../bridge";

export interface UsePushNotificationOptions {
  /** 推送 token（如 FCM token） */
  token?: string;
}

export interface UsePushNotificationReturn {
  /** 最新消息 */
  lastMessage: Ref<PushMessage | null>;
  /** 所有已接收消息 */
  messages: Ref<PushMessage[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  /** 注册推送 */
  register: (token?: string) => Promise<boolean>;
  /** 开始监听推送消息 */
  startListening: () => void;
  /** 停止监听 */
  stopListening: () => void;
  /** 清空消息列表 */
  clearMessages: () => void;
}

export function usePushNotification(
  options?: UsePushNotificationOptions,
): UsePushNotificationReturn {
  const opts = { ...options };
  const bridge = useBridge();

  const lastMessage = ref<PushMessage | null>(null);
  const messages = ref<PushMessage[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  let stopFn: (() => void) | null = null;

  async function register(token?: string): Promise<boolean> {
    const targetToken = token ?? opts.token;
    if (!targetToken) {
      error.value = new Error(
        "[h5-core] usePushNotification: 未提供推送 token",
      );
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("usePushNotification", [
        targetToken,
      ]);
      await bridge.notification.register(args[0]);
      await runAfterExtensions("usePushNotification", {
        action: "register",
        token: args[0],
      });
      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function startListening() {
    stopFn = bridge.notification.onMessage((msg) => {
      lastMessage.value = msg;
      messages.value = [...messages.value, msg];
    });
  }

  function stopListening() {
    stopFn?.();
    stopFn = null;
  }

  function clearMessages() {
    messages.value = [];
    lastMessage.value = null;
  }

  onUnmounted(stopListening);

  return {
    lastMessage,
    messages,
    loading,
    error,
    register,
    startListening,
    stopListening,
    clearMessages,
  };
}
