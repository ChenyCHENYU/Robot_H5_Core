import { describe, it, expect, vi, afterEach } from "vitest";
import { isAndroid, isIOS, getDeviceInfo } from "../../src/utils/device";

const originalUA = navigator.userAgent;

function mockUA(ua: string) {
  vi.stubGlobal("navigator", { ...navigator, userAgent: ua });
}

afterEach(() => {
  vi.stubGlobal("navigator", { ...navigator, userAgent: originalUA });
});

describe("device utils", () => {
  it("isAndroid 识别 Android UA", () => {
    mockUA(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0",
    );
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
  });

  it("isIOS 识别 iPhone UA", () => {
    mockUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1",
    );
    expect(isIOS()).toBe(true);
    expect(isAndroid()).toBe(false);
  });

  it("isIOS 识别 iPad UA", () => {
    mockUA(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    expect(isIOS()).toBe(true);
  });

  it("桌面浏览器返回 false", () => {
    mockUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
    );
    expect(isAndroid()).toBe(false);
    expect(isIOS()).toBe(false);
  });

  it("getDeviceInfo 返回 Android 信息", () => {
    mockUA(
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0",
    );
    const info = getDeviceInfo();
    expect(info.os).toBe("android");
    expect(info.osVersion).toBe("13");
    expect(info.screenWidth).toBeGreaterThan(0);
    expect(info.userAgent).toContain("Android");
  });

  it("getDeviceInfo 返回 iOS 信息", () => {
    mockUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1",
    );
    const info = getDeviceInfo();
    expect(info.os).toBe("ios");
    expect(info.osVersion).toBe("17.1.2");
  });

  it("getDeviceInfo 未知平台返回 unknown", () => {
    mockUA("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36");
    const info = getDeviceInfo();
    expect(info.os).toBe("unknown");
    expect(info.osVersion).toBe("");
  });
});
