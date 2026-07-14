import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MBASE_BRIDGE_PROTOCOL,
  MBASE_BRIDGE_SOURCE,
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
    vi.restoreAllMocks();
  });

  it("iframe transport 向父窗口发送协议请求", async () => {
    const postMessage = vi.fn();
    setParent({ postMessage });
    const payload = request("iframe");

    await postMbaseRequest("iframe", payload);

    expect(postMessage).toHaveBeenCalledWith(payload, "*");
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

  it("App transport 可懒加载内置官方 SDK", async () => {
    const evalJS = vi.fn();
    const plus = {
      webview: {
        currentWebview: () => ({ parent: () => ({ id: "portal-page" }) }),
        getWebviewById: () => null,
        getLaunchWebview: () => ({ evalJS }),
      },
    };
    (window as any).plus = plus;
    (globalThis as any).plus = plus;

    await postMbaseRequest("app", request("app"));

    expect(evalJS).toHaveBeenCalledOnce();
    expect(evalJS.mock.calls[0][0]).toContain("WEB_INVOKE_APPSERVICE");
  });
});
