import { ref, type Ref } from "vue";

export type PermissionName =
  | "camera"
  | "microphone"
  | "geolocation"
  | "notifications"
  | "clipboard-read"
  | "clipboard-write";

export interface UsePermissionReturn {
  state: Ref<PermissionState | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  query: (name: PermissionName) => Promise<PermissionState>;
  request: (name: PermissionName) => Promise<boolean>;
}

/**
 * 系统权限查询/请求 Hook
 * 统一封装 Permissions API + 各类权限请求
 */
export function usePermission(): UsePermissionReturn {
  const state = ref<PermissionState | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function query(name: PermissionName): Promise<PermissionState> {
    loading.value = true;
    error.value = null;
    try {
      const result = await navigator.permissions.query({
        name: name as any,
      });
      state.value = result.state;
      return result.state;
    } catch (e) {
      error.value = e as Error;
      state.value = "denied";
      return "denied";
    } finally {
      loading.value = false;
    }
  }

  async function requestMediaPermission(
    type: "camera" | "microphone",
  ): Promise<boolean> {
    const constraints = type === "camera" ? { video: true } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach((t) => t.stop());
    state.value = "granted";
    return true;
  }

  async function requestGeolocation(): Promise<boolean> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          state.value = "granted";
          resolve(true);
        },
        () => {
          state.value = "denied";
          resolve(false);
        },
        { timeout: 10000 },
      );
    });
  }

  async function request(name: PermissionName): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      if (name === "camera" || name === "microphone") {
        return await requestMediaPermission(name);
      }
      if (name === "geolocation") {
        return await requestGeolocation();
      }
      if (name === "notifications") {
        const result = await Notification.requestPermission();
        state.value = result === "granted" ? "granted" : "denied";
        return result === "granted";
      }
      const queryResult = await query(name);
      return queryResult === "granted";
    } catch (e) {
      error.value = e as Error;
      state.value = "denied";
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { state, loading, error, query, request };
}
