# @robot/h5-core 功能清单

> ⬜ = 待实现 | ✅ = 已完成 | 🚧 = 开发中

## 基础设施

- ✅ 配置系统 (defineAppConfig / useAppConfig / deepMerge)
- ✅ Bridge 注册表 (registerAdapter / resolveAdapter)
- ✅ 环境检测 (detectPlatform)
- ✅ Hook 扩展系统 (extendHook / before / after)

## Bridge 适配器

- ✅ BrowserBridge（浏览器降级）
- ✅ NativeBridge（APP WebView）— 桩实现，待原生协议
- ✅ DingtalkBridge（钉钉）— 桩实现，待 dingtalk-jsapi
- ✅ WechatBridge（微信/企微）— 桩实现，待 weixin-js-sdk

## Hooks

- ✅ useCamera — 拍照/相册 + 自动压缩
- ✅ useLocation — GPS 定位 + 持续监听
- ✅ useQrScanner — 扫码
- ✅ useNfc — NFC 读写
- ✅ useFileUpload — 分片上传
- ✅ useFilePreview — 文件预览
- ✅ useSignature — 手写签名
- ✅ useAudioRecorder — 录音
- ✅ useVideoRecorder — 视频录制
- ✅ useBluetooth — 蓝牙
- ✅ useOfflineStorage — 离线存储
- ✅ usePushNotification — 推送
- ✅ useWatermark — 水印
- ✅ usePermission — 权限

## Utils 工具函数

- ✅ image (compressImage / fileToBase64 / base64ToBlob)
- ✅ coord (gcj02ToWgs84 / wgs84ToGcj02)
- ✅ device (getDeviceInfo / isAndroid / isIOS)
- ✅ file (getFileType / formatFileSize)
- ✅ validate (isPhone / isIdCard / isEmail / isCreditCode)
- ✅ format (formatDate / formatMoney)

## 测试

- ✅ utils/validate.test.ts
- ✅ utils/format.test.ts
- ✅ utils/file.test.ts
- ✅ utils/coord.test.ts
- ✅ utils/image.test.ts
- ✅ bridge/detector.test.ts
- ✅ bridge/registry.test.ts
- ✅ hooks/extend.test.ts
- ✅ config/define.test.ts
- ✅ hooks/useCamera.test.ts
- ✅ hooks/useLocation.test.ts
- ✅ hooks/useQrScanner.test.ts
- ✅ hooks/useNfc.test.ts
- ✅ hooks/useFileUpload.test.ts
- ✅ hooks/useFilePreview.test.ts
- ✅ hooks/useSignature.test.ts
- ✅ hooks/useBluetooth.test.ts
- ✅ hooks/usePushNotification.test.ts
- ✅ hooks/useWatermark.test.ts
- ✅ hooks/usePermission.test.ts

## 文档

- ✅ 每个 Hook 独立 README.md
- ✅ 项目 README.md
