# Changelog

## v1.0.0 (2026-04-19)

### Features

- **useOfflineStorage**: 在线自动同步队列（SyncConfig / flush / pendingCount / syncStatus）
- **useFileUpload**: 断点续传（resumable 选项 + localStorage 分片跟踪）
- **CI/CD**: GitHub Actions 自动化（push → lint/test/build，tag → npm publish）
- **examples/**: 平台 SDK 集成示例（钉钉 / 微信 / 原生 WebView）
- **CHANGELOG**: 版本变更记录
- 测试覆盖率 94%+ statements / 83%+ branches

### Tests

- 新增 12 个测试用例（同步队列 8 + 断点续传 3 + 其他 1）
- 全部 208 测试通过

## v0.2.0 (2026-04-19)

### BREAKING CHANGES

- **Plugin 模式**：新增 `h5Core` Vue Plugin + `defineH5Config` 配置函数，替代 `defineAppConfig` 作为推荐初始化方式
- **同步初始化**：`createBridge` / `defineAppConfig` / `resolveAdapter` 从异步改为同步

### Features

- `h5Core` — Vue Plugin，一行代码完成全部初始化
- `defineH5Config()` — 配置文件辅助函数，提供完整 IDE 智能提示
- `H5PluginConfig` — 扩展配置类型，支持 `extensions` 和 `adapters` 字段
- Bridge 适配器静态导入（去除运行时 `import()`）

## v0.1.0 (2026-04-18)

### Features

- 15 个 Hook 组合函数（Camera / Location / QrScanner / NFC / FileUpload / FileDownload / FilePreview / Signature / AudioRecorder / VideoRecorder / Bluetooth / OfflineStorage / PushNotification / Watermark / Permission）
- 4 个 Bridge 适配器（Browser / Native / Dingtalk / Wechat）
- 6 个 Utils 工具模块（image / coord / device / file / validate / format）
- 配置系统（defineAppConfig / provide-inject / deepMerge）
- Hook 扩展系统（extendHook / before / after）
- Bridge 降级框架（createFallbackAdapter / mergeAdapter / BridgeAdapterOverrides）
- 196 单元测试
- Vite 库构建（ESM + 类型声明 + sourcemap）
- sideEffects: false（tree-shaking 优化）
