# @robot/h5-core 功能清单

> ⬜ = 待实现 | ✅ = 已完成 | 🚧 = 开发中

## 基础设施

- ✅ 配置系统 (defineAppConfig / useAppConfig / deepMerge)
- ✅ Bridge 注册表 (registerAdapter / resolveAdapter)
- ✅ 环境检测 (detectPlatform)
- ✅ Hook 扩展系统 (extendHook / before / after)
- ✅ Bridge 重置 (resetBridge)

## Bridge 适配器

- ✅ BrowserBridge（浏览器降级）
- ⬜ NativeBridge（APP WebView）— 桩实现，待原生协议
- ⬜ DingtalkBridge（钉钉）— 桩实现，待 dingtalk-jsapi
- ⬜ WechatBridge（微信/企微）— 桩实现，待 weixin-js-sdk
- ✅ createStubAdapter 工厂（消除桩代码重复）

## Hooks

- ✅ useCamera — 拍照/相册 + 自动压缩
- ✅ useLocation — GPS 定位 + 持续监听
- ✅ useQrScanner — 扫码
- ✅ useNfc — NFC 读写
- ✅ useFileUpload — 分片上传 + 单片自动重试
- ✅ useFilePreview — 文件预览
- ✅ useSignature — 手写签名
- ✅ useAudioRecorder — 录音（精确计时）
- ✅ useVideoRecorder — 视频录制（精确计时）
- ✅ useBluetooth — 蓝牙
- ✅ useOfflineStorage — 离线存储 + 自动关闭连接
- ✅ usePushNotification — 推送
- ✅ useWatermark — 水印（保留原图格式）
- ✅ usePermission — 权限查询/请求/状态监听

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
- ✅ hooks/usePermission.test.ts
- ✅ hooks/useWatermark.test.ts
- ✅ hooks/useOfflineStorage.test.ts
