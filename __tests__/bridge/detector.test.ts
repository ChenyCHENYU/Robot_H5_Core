import { describe, it, expect } from "vitest";
import { detectPlatform } from "../../src/bridge/detector";

describe("detectPlatform", () => {
  const originalNavigator = globalThis.navigator;

  function mockUA(ua: string) {
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: ua },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    // 清理 NativeCallJs
    delete (window as any).NativeCallJs;
  });

  it("检测钉钉环境", () => {
    mockUA("Mozilla/5.0 DingTalk/6.0");
    expect(detectPlatform()).toBe("dingtalk");
  });

  it("检测微信环境", () => {
    mockUA("Mozilla/5.0 MicroMessenger/8.0");
    expect(detectPlatform()).toBe("wechat");
  });

  it("检测企业微信", () => {
    mockUA("Mozilla/5.0 wxwork/4.0");
    expect(detectPlatform()).toBe("wechat");
  });

  it("检测自定义 Native UA", () => {
    mockUA("Mozilla/5.0 robot-app/1.0");
    expect(detectPlatform("robot-app")).toBe("native");
  });

  it("通过全局对象检测 Native", () => {
    mockUA("Mozilla/5.0 Chrome/120");
    (window as any).NativeCallJs = {};
    expect(detectPlatform()).toBe("native");
  });

  it("默认返回 browser", () => {
    mockUA("Mozilla/5.0 Chrome/120");
    expect(detectPlatform()).toBe("browser");
  });
});
