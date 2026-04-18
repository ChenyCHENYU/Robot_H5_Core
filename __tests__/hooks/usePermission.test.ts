import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Permissions API
const mockPermissionStatus = { state: "prompt" as PermissionState };
vi.stubGlobal("navigator", {
  ...navigator,
  permissions: {
    query: vi.fn().mockResolvedValue(mockPermissionStatus),
  },
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  geolocation: {
    getCurrentPosition: vi.fn().mockImplementation((success) => {
      success({ coords: { latitude: 39.9, longitude: 116.4 } });
    }),
  },
});

vi.stubGlobal("Notification", {
  requestPermission: vi.fn().mockResolvedValue("granted"),
});

import { usePermission } from "../../src/hooks/usePermission";

describe("usePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissionStatus.state = "prompt";
  });

  it("初始状态正确", () => {
    const { state, loading, error } = usePermission();
    expect(state.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("query 查询权限状态", async () => {
    mockPermissionStatus.state = "granted";
    const { query, state } = usePermission();
    const result = await query("camera");
    expect(result).toBe("granted");
    expect(state.value).toBe("granted");
  });

  it("request camera 权限", async () => {
    const { request, state } = usePermission();
    const result = await request("camera");
    expect(result).toBe(true);
    expect(state.value).toBe("granted");
  });

  it("request microphone 权限", async () => {
    const { request } = usePermission();
    const result = await request("microphone");
    expect(result).toBe(true);
  });

  it("request geolocation 权限", async () => {
    const { request } = usePermission();
    const result = await request("geolocation");
    expect(result).toBe(true);
  });

  it("request notifications 权限", async () => {
    const { request } = usePermission();
    const result = await request("notifications");
    expect(result).toBe(true);
  });

  it("request 拒绝时返回 false", async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error("NotAllowedError"),
    );
    const { request, state } = usePermission();
    const result = await request("camera");
    expect(result).toBe(false);
    expect(state.value).toBe("denied");
  });

  it("query 错误时返回 denied", async () => {
    (navigator.permissions.query as any).mockRejectedValueOnce(
      new Error("不支持"),
    );
    const { query, error } = usePermission();
    const result = await query("clipboard-read");
    expect(result).toBe("denied");
    expect(error.value).toBeDefined();
  });

  it("request clipboard-read 走 query 降级路径", async () => {
    mockPermissionStatus.state = "granted";
    const { request } = usePermission();
    const result = await request("clipboard-read");
    expect(result).toBe(true);
  });

  it("request clipboard-read 未授权返回 false", async () => {
    mockPermissionStatus.state = "denied";
    const { request } = usePermission();
    const result = await request("clipboard-read");
    expect(result).toBe(false);
  });

  it("watch 监听权限变化并返回取消函数", async () => {
    const mockStatus = {
      state: "granted" as PermissionState,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (navigator.permissions.query as any).mockResolvedValueOnce(mockStatus);

    const { watch, state } = usePermission();
    const stopWatch = watch("camera");

    // 等待异步 query 完成
    await new Promise((r) => setTimeout(r, 0));
    expect(state.value).toBe("granted");
    expect(mockStatus.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    // 取消监听
    stopWatch();
    expect(mockStatus.removeEventListener).toHaveBeenCalled();
  });

  it("watch query 失败时静默降级", async () => {
    (navigator.permissions.query as any).mockRejectedValueOnce(new Error("不支持"));
    const { watch } = usePermission();
    const stopWatch = watch("camera");
    await new Promise((r) => setTimeout(r, 0));
    // 不应抛出异常
    stopWatch();
  });

  it("geolocation 拒绝时返回 false", async () => {
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce(
      (_success: any, error: any) => {
        error({ code: 1, message: "PERMISSION_DENIED" });
      },
    );
    const { request, state } = usePermission();
    const result = await request("geolocation");
    expect(result).toBe(false);
    expect(state.value).toBe("denied");
  });

  it("notifications 拒绝时返回 false", async () => {
    (Notification.requestPermission as any).mockResolvedValueOnce("denied");
    const { request, state } = usePermission();
    const result = await request("notifications");
    expect(result).toBe(false);
    expect(state.value).toBe("denied");
  });
});
