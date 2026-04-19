# h5-core 后续规划

## v1.0.0 — 当前版本 ✅

### 核心能力（v0.1.0）

- [x] 15 个 Hook 实现（全部完成）
- [x] BrowserBridge 浏览器降级适配器
- [x] 配置系统（defineAppConfig / provide-inject + Bridge 自动注入）
- [x] Hook 扩展系统（extendHook / before / after）
- [x] 6 个 Utils 工具模块
- [x] 196 单元测试（覆盖全部 15 个 Hook + Utils + Bridge + Config）
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

### Plugin 模式（v0.2.0）

- [x] `h5Core` Vue Plugin — 一行代码完成全部初始化
- [x] `defineH5Config` 配置函数 + 完整 IDE 智能提示
- [x] Bridge 同步初始化（静态导入替代动态 import）
- [x] `H5PluginConfig` 扩展类型（extensions / adapters）

### 企业级加固（v1.0.0）

- [x] useOfflineStorage：在线自动同步队列（SyncConfig + flush）
- [x] useFileUpload：断点续传（resumable + localStorage 分片跟踪）
- [x] GitHub Actions CI/CD（push → lint/test/build，tag → publish）
- [x] CHANGELOG 自动生成
- [x] 平台 SDK 集成示例（钉钉 / 微信 / 原生 WebView）
- [x] 覆盖率配置（v8 provider，80% 阈值）

## v1.1 — 质量深化

- [ ] E2E 测试：Playwright 覆盖需真实浏览器 API 的 Hook（MediaRecorder / getUserMedia / IndexedDB）
- [ ] 测试覆盖率达到 90%+
- [ ] Bridge 集成测试（真机验证）
- [ ] API 参考文档（自动从 TSDoc 生成）

## v1.2 — 功能增强

- [ ] useAudioRecorder：语音转文字（ASR）扩展
- [ ] useFileUpload：秒传（hash 校验）
- [ ] useWatermark：多行水印 / 图片水印
- [ ] useSignature：笔锋效果 / 压感支持

## 文档计划

- [x] 各 Bridge overrides 接入指南（examples/ 目录）
- [ ] 项目集成最佳实践
- [ ] 常见问题 FAQ
