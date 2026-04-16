import { ref, type Ref } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export type PermissionName =
  | "camera"
  | "microphone"
  | "geolocation"
  | "notifications"
  | "clipboard-read"
  | "clipboard-write";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export interface UsePermissionOptions {
  /** 查询失败时是否自动请求 */
  autoRequest?: boolean;
}

export interface UsePermissionReturn {
  /** 各权限的状态 */
  status: Ref<Record<string, PermissionStatus>>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  /** 查询单个权限状态 */
  query: (name: PermissionName) => Promise<PermissionStatus>;
  /** 请求权限（通过触发相关 API 来触发浏览器权限弹窗） */
  request: (name: PermissionName) => Promise<PermissionStatus>;
  /** 批量查询 */
  queryAll: (names: PermissionName[]) => Promise<Record<string, PermissionStatus>>;
}

const DEFAULTS: UsePermissionOptions = {
  autoRequest: false,
};

export function usePermission(
  options?: UsePermissionOptions,
): UsePermissionReturn {
  const opts = { ...DEFAULTS, ...options };

  const status = ref<Record<string, PermissionStatus>>({});
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function query(name: PermissionName): Promise<PermissionStatus> {
    try {
      if (!navigator.permissions) return "unsupported";

      const result = await navigator.permissions.query({
        name: name as globalThis.PermissionName,
      });

      const state = result.state as PermissionStatus;
      status.value = { ...status.value, [name]: state };

      // 监听变化
      result.onchange = () => {
        status.value = {
          ...status.value,
          [name]: result.state as PermissionStatus,
        };
      };

      return state;
    } catch {
      // 浏览器不支持查询该权限
      return "unsupported";
    }
  }

  async function request(name: PermissionName): Promise<PermissionStatus> {
    loading.value = true;
    error.value = null;

    try {
      const args = await runBeforeExtensions("usePermission", [name]);
      const targetName: PermissionName = args[0];

      let result: PermissionStatus = "unsupported";

      // 通过调用相关 API 触发权限弹窗
      switch (targetName) {
        case "camera":
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            stream.getTracks().forEach((t) => t.stop());
            result = "granted";
          } catch (e: any) {
            result = e.name === "NotAllowedError" ? "denied" : "prompt";
          }
          break;

        case "microphone":
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.getTracks().forEach((t) => t.stop());
            result = "granted";
          } catch (e: any) {
            result = e.name === "NotAllowedError" ? "denied" : "prompt";
          }
          break;

        case "geolocation":
          try {
            await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              }),
            );
            result = "granted";
          } catch (e: any) {
            result = e.code === 1 ? "denied" : "prompt";
          }
          break;

        case "notifications":
          if (!("Notification" in window)) {
            result = "unsupported";
          } else {
            const permission = await Notification.requestPermission();
            result = permission as PermissionStatus;
          }
          break;

        default:
          result = await query(targetName);
      }

      status.value = { ...status.value, [targetName]: result };
      await runAfterExtensions("usePermission", {
        name: targetName,
        status: result,
      });
      return result;
    } catch (e) {
      error.value = e as Error;
      return "denied";
    } finally {
      loading.value = false;
    }
  }

  async function queryAll(
    names: PermissionName[],
  ): Promise<Record<string, PermissionStatus>> {
    loading.value = true;

    try {
      const results: Record<string, PermissionStatus> = {};
      for (const name of names) {
        results[name] = await query(name);
      }
      status.value = { ...status.value, ...results };
      return results;
    } finally {
      loading.value = false;
    }
  }

  return { status, loading, error, query, request, queryAll };
}
