import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MBASE_BRIDGE_PROTOCOL,
  MBASE_BRIDGE_SOURCE,
  configureMbaseBridge,
  postMbaseRequest,
  type MbaseBridgeRequest,
} from "../../src/bridge/transports/mbase";

function request(host: "iframe" | "app"): MbaseBridgeRequest {
  return {
    source: MBASE_BRIDGE_SOURCE,
    type: "capability:invoke",
    id: "cap_test",
    api: "getLocation",
    payload: {},
    protocol: MBASE_BRIDGE_PROTOCOL,
    host,
  };
}

function setParent(parent: unknown) {
  Object.defineProperty(window, "parent", {
    value: parent,
    writable: true,
    configurable: true,
  });
}

describe("mbase transport", () => {
  afterEach(() => {
    setParent(window.self);
    delete (document as any).referrer;
    delete (window as any).uni;
    delete (window as any).plus;
    delete (globalThis as any).plus;
    configureMbaseBridge();
    vi.restoreAllMocks();
  });

  it("iframe transport 缺少可信 origin 时拒绝发送", async () => {
    const postMessage = vi.fn();
    setParent({ postMessage });
    await expect(
      postMbaseRequest("iframe", request("iframe")),
    ).rejects.toMatchObject({ code: "mbase_origin_missing" });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("iframe transport 使用 referrer 的父级 origin", async () => {
    const postMessage = vi.fn();
    setParent({ postMessage });
    Object.defineProperty(document, "referrer", {
      value: "https://portal.example.com/pages/webview",
      configurable: true,
    });
    const payload = request("iframe");

    await postMbaseRequest("iframe", payload);

    expect(postMessage).toHaveBeenCalledWith(
      payload,
      "https://portal.example.com",
    );
  });

  it("iframe transport 支持显式可信 origin", async () => {
    const postMessage = vi.fn();
    setParent({ postMessage });
    configureMbaseBridge({ origin: "https://portal.example.com/base" });
    const payload = request("iframe");

    await postMbaseRequest("iframe", payload);

    expect(postMessage).toHaveBeenCalledWith(payload, "https://portal.example.com");
  });

  it("拒绝把通配符配置为可信 origin", () => {
    expect(() => configureMbaseBridge({ origin: "*" })).toThrow(/禁止配置为/);
  });

  it("iframe 顶层页面立即返回稳定错误码", async () => {
    setParent(window.self);
    await expect(postMbaseRequest("iframe", request("iframe"))).rejects.toMatchObject({
      code: "bridge_unavailable",
    });
  });

  it("无 window 的预渲染环境返回稳定错误码", async () => {
    const browserWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    try {
      await expect(
        postMbaseRequest("iframe", request("iframe")),
      ).rejects.toMatchObject({ code: "bridge_unavailable" });
    } finally {
      vi.stubGlobal("window", browserWindow);
    }
  });

  it("App transport 优先复用已注入的 uni.postMessage", async () => {
    const postMessage = vi.fn();
    (window as any).uni = { postMessage };
    const payload = request("app");

    await postMbaseRequest("app", payload);

    expect(postMessage).toHaveBeenCalledWith({ data: payload });
  });

  it("App transport 仅在调用时加载配置的自托管官方 SDK", async () => {
    const postMessage = vi.fn();
    const appendChild = vi.spyOn(document.head, "appendChild").mockImplementation(node => {
      const script = node as HTMLScriptElement;
      (window as any).uni = { postMessage };
      (window as any).plus = {};
      queueMicrotask(() => script.onload?.(new Event("load")));
      return node;
    });

    await postMbaseRequest("app", request("app"), {
      appSdkUrl: "/vendor/uni.webview.1.5.8.js",
    });

    expect(appendChild).toHaveBeenCalledOnce();
    expect((appendChild.mock.calls[0][0] as HTMLScriptElement).src).toContain(
      "/vendor/uni.webview.1.5.8.js",
    );
    expect(postMessage).toHaveBeenCalledOnce();
  });

  it("App 未注入 SDK 且未配置地址时返回稳定错误码", async () => {
    await expect(postMbaseRequest("app", request("app"))).rejects.toMatchObject({
      code: "app_sdk_url_missing",
    });
  });
});
