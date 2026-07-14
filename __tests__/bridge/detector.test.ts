import { describe, it, expect } from "vitest";
import {
  detectMbaseHost,
  detectPlatform,
  isMbaseAppWebView,
} from "../../src/bridge/detector";

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
    delete (window as any).__MBASE_BRIDGE_HOST__;
    // 还原 window.parent（部分用例会改成嵌入态）
    Object.defineProperty(window, "parent", {
      value: window.self,
      writable: true,
      configurable: true,
    });
  });

  it("检测钉钉环境", () => {
    mockUA("Mozilla/5.0 DingTalk/6.0");
    expect(detectPlatform()).toBe("dingtalk");
  });

  it("钉钉内以 iframe 嵌入基座 → mbase", () => {
    mockUA("Mozilla/5.0 DingTalk/6.0");
    Object.defineProperty(window, "parent", {
      value: {},
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe("mbase");
  });

  it("钉钉内顶层页面（非嵌入）仍为 dingtalk", () => {
    mockUA("Mozilla/5.0 DingTalk/6.0");
    Object.defineProperty(window, "parent", {
      value: window.self,
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe("dingtalk");
  });

  it("显式 App 基座标记在顶层 WebView 中解析为 mbase", () => {
    mockUA("Mozilla/5.0 Html5Plus/1.0 uni-app");
    (window as any).__MBASE_BRIDGE_HOST__ = "app";

    expect(isMbaseAppWebView()).toBe(true);
    expect(detectMbaseHost()).toBe("app");
    expect(detectPlatform()).toBe("mbase");
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
