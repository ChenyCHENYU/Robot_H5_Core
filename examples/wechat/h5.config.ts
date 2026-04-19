/**
 * 微信/企业微信平台 h5.config.ts 参考配置
 *
 * 前置依赖: pnpm add weixin-js-sdk
 * 注意: 需要后端提供 JSSDK 签名接口
 */
import { defineH5Config } from "@robot-h5/core";
import wx from "weixin-js-sdk";

// 初始化微信 JSSDK（需在页面加载后调用）
async function initWxSdk() {
  const { data } = await fetch("/api/wechat/jssdk-config").then((r) =>
    r.json(),
  );
  wx.config({
    debug: false,
    appId: data.appId,
    timestamp: data.timestamp,
    nonceStr: data.nonceStr,
    signature: data.signature,
    jsApiList: [
      "scanQRCode",
      "getLocation",
      "chooseImage",
      "getLocalImgData",
    ],
  });
}

// 页面初始化时调用
initWxSdk();

export default defineH5Config({
  bridge: {
    platform: "wechat",
    wechat: { appId: "wx_xxx" },
    overrides: {
      // 扫码 — 调用微信 JSAPI
      scanner: {
        scan: () =>
          new Promise((resolve, reject) => {
            wx.scanQRCode({
              needResult: 1,
              scanType: ["qrCode", "barCode"],
              success: (res: any) => resolve(res.resultStr),
              fail: (err: any) => reject(new Error(err.errMsg)),
            });
          }),
      },

      // 定位 — 调用微信 JSAPI
      location: {
        getCurrent: () =>
          new Promise((resolve, reject) => {
            wx.getLocation({
              type: "gcj02",
              success: (res: any) =>
                resolve({
                  longitude: res.longitude,
                  latitude: res.latitude,
                  accuracy: res.accuracy,
                  timestamp: Date.now(),
                }),
              fail: (err: any) => reject(new Error(err.errMsg)),
            });
          }),
        watchPosition: (callback) => {
          // 微信无持续定位 API，轮询模拟
          const timer = setInterval(() => {
            wx.getLocation({
              type: "gcj02",
              success: (res: any) => {
                callback({
                  longitude: res.longitude,
                  latitude: res.latitude,
                  accuracy: res.accuracy,
                  timestamp: Date.now(),
                });
              },
            });
          }, 5000);
          return () => clearInterval(timer);
        },
      },

      // 拍照 — 调用微信 JSAPI
      camera: {
        capture: () =>
          new Promise((resolve, reject) => {
            wx.chooseImage({
              count: 1,
              sizeType: ["compressed"],
              sourceType: ["camera"],
              success: async (res: any) => {
                const localId = res.localIds[0];
                // 微信返回 localId，需通过 getLocalImgData 获取 base64
                wx.getLocalImgData({
                  localId,
                  success: (imgRes: any) => {
                    const base64 = imgRes.localData.replace(
                      /^data:image\/\w+;base64,/,
                      "",
                    );
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: "image/jpeg" });
                    resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
                  },
                  fail: (err: any) => reject(new Error(err.errMsg)),
                });
              },
              fail: (err: any) => reject(new Error(err.errMsg)),
            });
          }),
      },
    },
  },

  upload: {
    action: "/api/file/upload",
    headers: () => ({
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    }),
  },

  image: { maxSize: 1024, quality: 0.8 },
  location: { coordType: "gcj02", timeout: 10000 },
});
