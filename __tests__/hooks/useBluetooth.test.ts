import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBluetooth } from "../../src/hooks/useBluetooth";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("useBluetooth", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => useBluetooth());
    expect(result.device.value).toBeNull();
    expect(result.connected.value).toBe(false);
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("connect 成功", async () => {
    const mockDevice = { id: "bt-1", name: "Printer", connected: true };
    const { result } = withSetup(() => useBluetooth(), {
      bluetooth: {
        connect: vi.fn().mockResolvedValue(mockDevice),
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
    });

    const ok = await result.connect("bt-1");
    expect(ok).toBe(true);
    expect(result.device.value).toEqual(mockDevice);
    expect(result.connected.value).toBe(true);
  });

  it("connect 失败", async () => {
    const { result } = withSetup(() => useBluetooth(), {
      bluetooth: {
        connect: vi.fn().mockRejectedValue(new Error("连接失败")),
        disconnect: vi.fn().mockResolvedValue(undefined),
      },
    });

    const ok = await result.connect("bt-1");
    expect(ok).toBe(false);
    expect(result.error.value?.message).toBe("连接失败");
    expect(result.connected.value).toBe(false);
  });

  it("disconnect 重置状态", async () => {
    const disconnectMock = vi.fn().mockResolvedValue(undefined);
    const { result } = withSetup(() => useBluetooth(), {
      bluetooth: {
        connect: vi
          .fn()
          .mockResolvedValue({ id: "bt-1", name: "D", connected: true }),
        disconnect: disconnectMock,
      },
    });

    await result.connect("bt-1");
    await result.disconnect();
    expect(result.device.value).toBeNull();
    expect(result.connected.value).toBe(false);
    expect(disconnectMock).toHaveBeenCalled();
  });
});
