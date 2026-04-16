import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockBridge } from "./_helpers";

const mockBridge = createMockBridge();
vi.mock("../../src/bridge", () => ({
  useBridge: () => mockBridge,
}));

import { usePushNotification } from "../../src/hooks/usePushNotification";

describe("usePushNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始状态正确", () => {
    const { messages, loading, error } = usePushNotification();
    expect(messages.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("register 成功", async () => {
    const { register } = usePushNotification();
    const result = await register("test-token");
    expect(result).toBe(true);
    expect(mockBridge.notification.register).toHaveBeenCalledWith("test-token");
  });

  it("register 错误处理", async () => {
    mockBridge.notification.register.mockRejectedValueOnce(
      new Error("注册失败"),
    );
    const { register, error } = usePushNotification();
    const result = await register("token");
    expect(result).toBe(false);
    expect(error.value?.message).toBe("注册失败");
  });

  it("onMessage 注册回调", () => {
    const { onMessage } = usePushNotification();
    const callback = vi.fn();
    onMessage(callback);
    expect(mockBridge.notification.onMessage).toHaveBeenCalled();
  });

  it("clearMessages 清空消息", () => {
    const { messages, clearMessages } = usePushNotification();
    messages.value.push({
      title: "test",
      body: "test body",
      timestamp: Date.now(),
    });
    clearMessages();
    expect(messages.value).toEqual([]);
  });
});
