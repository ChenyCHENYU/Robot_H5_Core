import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePermission } from "../../src/hooks/usePermission";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("usePermission", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => usePermission());
    expect(result.status.value).toEqual({});
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("query 查询权限状态", async () => {
    // Mock permissions API
    const mockPermissionStatus = {
      state: "granted",
      onchange: null,
    };
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue(mockPermissionStatus),
      },
      configurable: true,
    });

    const { result } = withSetup(() => usePermission());
    const state = await result.query("camera");
    expect(state).toBe("granted");
    expect(result.status.value.camera).toBe("granted");
  });

  it("query 不支持时返回 unsupported", async () => {
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockRejectedValue(new Error("Not supported")),
      },
      configurable: true,
    });

    const { result } = withSetup(() => usePermission());
    const state = await result.query("camera");
    expect(state).toBe("unsupported");
  });

  it("queryAll 批量查询", async () => {
    const mockStatus = { state: "prompt", onchange: null };
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue(mockStatus),
      },
      configurable: true,
    });

    const { result } = withSetup(() => usePermission());
    const states = await result.queryAll(["camera", "microphone"]);
    expect(states.camera).toBe("prompt");
    expect(states.microphone).toBe("prompt");
  });
});
