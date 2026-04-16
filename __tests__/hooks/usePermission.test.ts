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
});
