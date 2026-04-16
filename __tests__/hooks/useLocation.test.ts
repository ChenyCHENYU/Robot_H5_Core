import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLocation } from "../../src/hooks/useLocation";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useLocation", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useLocation());
    expect(result.position.value).toBeNull();
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("getCurrentPosition 返回坐标", async () => {
    const mockPos = {
      longitude: 116.397,
      latitude: 39.909,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const { result } = withSetup(() => useLocation(), {
      location: {
        getCurrent: vi.fn().mockResolvedValue(mockPos),
        watchPosition: vi.fn().mockReturnValue(() => {}),
      },
    });

    const pos = await result.getCurrentPosition();
    expect(pos).toEqual(mockPos);
    expect(result.position.value).toEqual(mockPos);
    expect(result.loading.value).toBe(false);
  });

  it("getCurrentPosition 失败时设置 error", async () => {
    const { result } = withSetup(() => useLocation(), {
      location: {
        getCurrent: vi.fn().mockRejectedValue(new Error("定位超时")),
        watchPosition: vi.fn().mockReturnValue(() => {}),
      },
    });

    const pos = await result.getCurrentPosition();
    expect(pos).toBeNull();
    expect(result.error.value?.message).toBe("定位超时");
  });

  it("watchPosition 和 stopWatch 正常工作", () => {
    const stopMock = vi.fn();
    const { result } = withSetup(() => useLocation(), {
      location: {
        getCurrent: vi.fn().mockResolvedValue(null),
        watchPosition: vi.fn().mockReturnValue(stopMock),
      },
    });

    result.watchPosition();
    result.stopWatch();
    expect(stopMock).toHaveBeenCalled();
  });
});
