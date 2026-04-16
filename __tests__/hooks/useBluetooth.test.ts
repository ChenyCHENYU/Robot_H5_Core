import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));

import { useBluetooth } from "../../src/hooks/useBluetooth";

describe("useBluetooth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { device, connected, loading, error } = useBluetooth();
    expect(device.value).toBeNull();
    expect(connected.value).toBe(false);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("connect 成功", async () => {
    const { connect, device, connected } = useBluetooth();
    const result = await connect("dev1");
    expect(result).toBeDefined();
    expect(result!.id).toBe("dev1");
    expect(device.value).toEqual(result);
    expect(connected.value).toBe(true);
  });

  it("connect 错误处理", async () => {
    mockBridge.bluetooth.connect.mockRejectedValueOnce(new Error("连接失败"));
    const { connect, error } = useBluetooth();
    const result = await connect("dev1");
    expect(result).toBeNull();
    expect(error.value?.message).toBe("连接失败");
  });

  it("disconnect 成功", async () => {
    const { connect, disconnect, device, connected } = useBluetooth();
    await connect("dev1");
    await disconnect();
    expect(device.value).toBeNull();
    expect(connected.value).toBe(false);
  });

  it("disconnect 错误处理", async () => {
    mockBridge.bluetooth.disconnect.mockRejectedValueOnce(
      new Error("断开失败"),
    );
    const { disconnect, error } = useBluetooth();
    await disconnect();
    expect(error.value?.message).toBe("断开失败");
  });
});
