# h5-core 后续规划

## v1.0 — 当前版本 ✅

- [x] 14 个 Hook 实现（全部完成）
- [x] BrowserBridge 浏览器降级适配器
- [x] 配置系统（defineAppConfig / provide-inject + Bridge 自动注入）
- [x] Hook 扩展系统（extendHook / before / after）
- [x] 6 个 Utils 工具模块
- [x] 140+ 单元测试（含 useAudioRecorder / useVideoRecorder）
- [x] Vite 库构建配置（ESM + 类型声明 + sourcemap）
- [x] ESLint + TypeScript 零错误
- [x] createFallbackAdapter（未覆盖能力自动降级到浏览器）
- [x] mergeAdapter（项目侧 overrides 合并工具）
- [x] BridgeAdapterOverrides 类型（项目侧 SDK 能力注入）
- [x] Bridge 重置（resetBridge）
- [x] 分片上传单片自动重试（maxRetries）+ fileId 标识
- [x] 录音/录像精确计时（Date.now）
- [x] 水印保留原图格式（outputType 配置）
- [x] 权限状态实时监听（watch）+ 竞态安全
- [x] IDB 连接自动关闭（onUnmounted）
- [x] 相机取消选择处理（oncancel）
- [x] 签名文件扩展名从 type 派生
- [x] sideEffects: false（tree-shaking 优化）

## v1.1 — Bridge SDK 集成

> 注：包本身已提供降级框架，以下是 **项目侧** 通过 `overrides` 配置注入对应平台 SDK 的示例集成。

- [ ] NativeBridge overrides 示例：APP WebView 原生协议注入
- [ ] DingtalkBridge overrides 示例：dingtalk-jsapi 注入（dd.biz.util.scan / dd.device.geolocation 等）
- [ ] WechatBridge overrides 示例：weixin-js-sdk 注入（wx.scanQRCode / wx.getLocation 等）
- [ ] Bridge 集成测试（真机验证）

## v1.2 — 质量加固

- [ ] E2E 测试：Playwright 覆盖需真实浏览器 API 的 Hook（MediaRecorder / getUserMedia / IndexedDB）
- [ ] 测试覆盖率达到 90%+
- [ ] npm publish 自动化（CI/CD）
- [ ] CHANGELOG 自动生成

## v1.3 — 功能增强

- [ ] useAudioRecorder：语音转文字（ASR）扩展
- [ ] useOfflineStorage：在线自动同步队列
- [ ] useFileUpload：秒传 / 断点续传
- [ ] useWatermark：多行水印 / 图片水印
- [ ] useSignature：笔锋效果 / 压感支持

## 文档计划

- [ ] 各 Bridge overrides 接入指南（含完整代码示例）
- [ ] 项目集成最佳实践
- [ ] 常见问题 FAQ
- [ ] API 参考文档（自动从 TSDoc 生成）
