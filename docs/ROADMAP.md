# h5-core 后续规划

## v1.0 — 当前版本 ✅

- [x] 14 个 Hook 实现（全部完成）
- [x] BrowserBridge 浏览器降级适配器
- [x] 配置系统（defineAppConfig / provide-inject）
- [x] Hook 扩展系统（extendHook / before / after）
- [x] 6 个 Utils 工具模块
- [x] 127 个单元测试
- [x] Vite 库构建配置
- [x] ESLint + TypeScript 零错误

## v1.1 — Bridge 对接

- [ ] NativeBridge：对接 APP WebView 原生协议（camera / scanner / nfc / bluetooth）
- [ ] DingtalkBridge：对接 dingtalk-jsapi（dd.biz.util.scan / dd.device.geolocation 等）
- [ ] WechatBridge：对接 weixin-js-sdk（wx.scanQRCode / wx.getLocation 等）
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

- [ ] 各 Bridge 适配器接入指南
- [ ] 项目集成最佳实践
- [ ] 常见问题 FAQ
- [ ] API 参考文档（自动从 TSDoc 生成）
