/**
 * 钉钉平台 h5.config.ts 参考配置
 *
 * 前置依赖: pnpm add dingtalk-jsapi
 */
import { defineH5Config } from "@robot-h5/core";
import dd from "dingtalk-jsapi";

export default defineH5Config({
  bridge: {
    platform: "dingtalk",
    dingtalk: { corpId: "ding_xxx" },
    overrides: {
      // 扫码 — 调用钉钉 JSAPI
      scanner: {
        scan: async () => {
          const res = await dd.biz.util.scan({ type: "qrCode" });
          return res.text;
        },
      },

      // 定位 — 调用钉钉 JSAPI
      location: {
        getCurrent: async () => {
          const pos = await dd.device.geolocation.get({
            targetAccuracy: 200,
            coordinate: 1, // gcj02
            withReGeocode: false,
          });
          return {
            longitude: pos.longitude,
            latitude: pos.latitude,
            accuracy: pos.accuracy,
            timestamp: Date.now(),
          };
        },
        watchPosition: (callback) => {
          // 钉钉无持续定位 API，轮询模拟
          const timer = setInterval(async () => {
            const pos = await dd.device.geolocation.get({
              targetAccuracy: 200,
              coordinate: 1,
              withReGeocode: false,
            });
            callback({
              longitude: pos.longitude,
              latitude: pos.latitude,
              accuracy: pos.accuracy,
              timestamp: Date.now(),
            });
          }, 5000);
          return () => clearInterval(timer);
        },
      },

      // 拍照 — 调用钉钉 JSAPI
      camera: {
        capture: async () => {
          const res = await dd.biz.util.uploadImage({
            compression: true,
            multiple: false,
            max: 1,
            quality: 50,
            resize: 50,
          });
          // 钉钉返回 mediaId，需要通过服务端下载后转 File
          // 此处简化为 Blob → File
          const response = await fetch(
            `/api/dingtalk/media?mediaId=${res.photoIds[0]}`,
          );
          const blob = await response.blob();
          return new File([blob], "photo.jpg", { type: "image/jpeg" });
        },
      },
    },
  },

  // 上传接口
  upload: {
    action: "/api/file/upload",
    headers: () => ({
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    }),
  },

  // 图片压缩
  image: { maxSize: 1024, quality: 0.8 },

  // 定位坐标系
  location: { coordType: "gcj02", timeout: 10000 },
});
