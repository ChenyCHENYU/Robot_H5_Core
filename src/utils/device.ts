export interface DeviceInfo {
  os: "android" | "ios" | "unknown";
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  userAgent: string;
}

/** 是否 Android */
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/** 是否 iOS */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** 获取设备信息 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let os: DeviceInfo["os"] = "unknown";
  let osVersion = "";

  if (isAndroid()) {
    os = "android";
    const match = ua.match(/Android\s+([\d.]+)/i);
    osVersion = match?.[1] ?? "";
  } else if (isIOS()) {
    os = "ios";
    const match = ua.match(/OS\s+([\d_]+)/i);
    osVersion = match?.[1]?.replace(/_/g, ".") ?? "";
  }

  return {
    os,
    osVersion,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
    userAgent: ua,
  };
}
