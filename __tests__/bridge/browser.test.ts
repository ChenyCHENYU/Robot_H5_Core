import { describe, it, expect, vi } from "vitest";
import browserBridge from "../../src/bridge/adapters/browser";

describe("browserBridge", () => {
  it("platform 为 browser", () => {
    expect(browserBridge.platform).toBe("browser");
  });

  it("camera.capture 创建 file input", async () => {
    const clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      type: "",
      accept: "",
      setAttribute: vi.fn(),
      set onchange(fn: any) {
        // 模拟用户选择文件
        setTimeout(() => fn(), 0);
      },
      set oncancel(_fn: any) {},
      click: clickSpy,
      files: [new File(["test"], "photo.jpg", { type: "image/jpeg" })],
    } as any);

    const file = await browserBridge.camera.capture();
    expect(clickSpy).toHaveBeenCalled();
    expect(file.name).toBe("photo.jpg");
  });

  it("camera.capture source=camera 设置 capture 属性", async () => {
    const setAttrSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      type: "",
      accept: "",
      setAttribute: setAttrSpy,
      set onchange(fn: any) {
        setTimeout(() => fn(), 0);
      },
      set oncancel(_fn: any) {},
      click: vi.fn(),
      files: [new File(["test"], "photo.jpg")],
    } as any);

    await browserBridge.camera.capture({ source: "camera" });
    expect(setAttrSpy).toHaveBeenCalledWith("capture", "environment");
  });

  it("camera.capture 用户取消时拒绝", async () => {
    vi.spyOn(document, "createElement").mockReturnValue({
      type: "",
      accept: "",
      setAttribute: vi.fn(),
      set onchange(_fn: any) {},
      set oncancel(fn: any) {
        setTimeout(() => fn(), 0);
      },
      click: vi.fn(),
    } as any);

    await expect(browserBridge.camera.capture()).rejects.toThrow("用户取消选择");
  });

  it("scanner.scan 拒绝（浏览器不支持）", async () => {
    await expect(browserBridge.scanner.scan()).rejects.toThrow("jsQR");
  });

  it("location.getCurrent 调用 Geolocation API", async () => {
    const mockPos = {
      coords: {
        longitude: 116.4,
        latitude: 39.9,
        altitude: null,
        accuracy: 10,
      },
      timestamp: 1000,
    };
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (success: any) => success(mockPos),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
    });

    const pos = await browserBridge.location.getCurrent();
    expect(pos.longitude).toBe(116.4);
    expect(pos.latitude).toBe(39.9);
    expect(pos.accuracy).toBe(10);
  });

  it("location.watchPosition 返回取消函数", () => {
    const clearSpy = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        watchPosition: vi.fn().mockReturnValue(42),
        clearWatch: clearSpy,
      },
    });

    const stop = browserBridge.location.watchPosition(vi.fn());
    expect(stop).toBeTypeOf("function");
    stop();
    expect(clearSpy).toHaveBeenCalledWith(42);
  });

  it("nfc.read 抛出不支持错误", () => {
    expect(() => browserBridge.nfc.read()).toThrow("NFC");
  });

  it("bluetooth.connect 抛出不支持错误", () => {
    expect(() => browserBridge.bluetooth.connect("xx")).toThrow("Bluetooth");
  });

  it("file.preview 调用 window.open", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    await browserBridge.file.preview("https://example.com/doc.pdf");
    expect(openSpy).toHaveBeenCalledWith("https://example.com/doc.pdf", "_blank");
  });

  it("notification.register 抛出不支持错误", () => {
    expect(() => browserBridge.notification.register("token")).toThrow(
      "Push Notification",
    );
  });

  it("notification.onMessage 抛出不支持错误", () => {
    expect(() => browserBridge.notification.onMessage(vi.fn())).toThrow(
      "Push Notification",
    );
  });
});
