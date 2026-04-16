import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePushNotification } from "../../src/hooks/usePushNotification";
import { clearExtensions } from "../../src/hooks/extend";
import { withSetup } from "./_helpers";

describe("usePushNotification", () => {
  beforeEach(() => {
    clearExtensions();
  });

  it("初始状态正确", () => {
    const { result } = withSetup(() => usePushNotification());
    expect(result.lastMessage.value).toBeNull();
    expect(result.messages.value).toEqual([]);
    expect(result.loading.value).toBe(false);
    expect(result.error.value).toBeNull();
  });

  it("register 成功", async () => {
    const registerMock = vi.fn().mockResolvedValue(undefined);
    const { result } = withSetup(() => usePushNotification(), {
      notification: {
        register: registerMock,
        onMessage: vi.fn().mockReturnValue(() => {}),
      },
    });

    const ok = await result.register("token-123");
    expect(ok).toBe(true);
    expect(registerMock).toHaveBeenCalledWith("token-123");
  });

  it("register 无 token 时报错", async () => {
    const { result } = withSetup(() => usePushNotification());

    const ok = await result.register();
    expect(ok).toBe(false);
    expect(result.error.value?.message).toContain("未提供推送 token");
  });

  it("register 失败时设置 error", async () => {
    const { result } = withSetup(() => usePushNotification(), {
      notification: {
        register: vi.fn().mockRejectedValue(new Error("注册失败")),
        onMessage: vi.fn().mockReturnValue(() => {}),
      },
    });

    const ok = await result.register("token-123");
    expect(ok).toBe(false);
    expect(result.error.value?.message).toBe("注册失败");
  });

  it("startListening / stopListening", () => {
    const stopMock = vi.fn();
    const onMessageMock = vi.fn().mockReturnValue(stopMock);

    const { result } = withSetup(() => usePushNotification(), {
      notification: {
        register: vi.fn().mockResolvedValue(undefined),
        onMessage: onMessageMock,
      },
    });

    result.startListening();
    expect(onMessageMock).toHaveBeenCalled();

    result.stopListening();
    expect(stopMock).toHaveBeenCalled();
  });

  it("clearMessages 清空消息", () => {
    const { result } = withSetup(() => usePushNotification());

    // 模拟有消息
    result.messages.value = [
      { title: "Test", body: "Hello", timestamp: Date.now() },
    ];
    result.lastMessage.value = { title: "Test", body: "Hello", timestamp: Date.now() };

    result.clearMessages();
    expect(result.messages.value).toEqual([]);
    expect(result.lastMessage.value).toBeNull();
  });
});
