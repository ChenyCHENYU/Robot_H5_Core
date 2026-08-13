# Changelog

## v1.1.4 (2026-08-13)

### Fixes

- App/PDA SDK 改为按 `bridge.mbase.appSdkUrl` 运行时加载，避免消费方构建器把动态模块合入普通 H5 主包
- SDK 地址缺失时返回稳定错误码 `app_sdk_url_missing`，不静默请求公共网络

### Quality

- 增加自托管 SDK 延迟加载与缺失配置测试；Core 包不再携带或执行平台 SDK 源码

## v1.1.3 (2026-08-13)

### Fixes

- 修复 `@robot-h5/core/bridge`、`hooks`、`utils` 子路径中类型已声明但部分运行时导出被构建器裁剪的问题

### Quality

- 将所有公开子路径设为独立构建入口，并在每次构建后动态导入产物校验实际导出

## v1.1.2 (2026-08-13)

### Features

- **统一扩展能力入口**：新增 `invokeMbaseCapability`，供相册等尚未封装为 Hook 的 wl-mbase v1 能力复用
- **桥接诊断**：新增 `getMbaseTransportStatus`、`MbaseBridgeError`、`postMbaseMessage` 与 App 桥等待出口
- **配置收口**：`bridge.mbase.origin` 支持为所有 iframe 请求配置精确门户来源

### Security

- iframe 响应同时校验父窗口引用与精确 origin，移除 `postMessage('*')` 兜底
- 普通第三方 iframe 不再误判为 mbase；保留钉钉 iframe、`from=portal` 与 `mbase_host=app` 兼容链路

### Quality

- App/PDA 官方 `uni.webview` SDK 继续按需懒加载，不改变浏览器、微信、独立 H5 运行路径
- 类型检查、生产构建及 234 个测试通过

## v1.1.1 (2026-07-14)

### Fixes

- **统一坐标系**：浏览器、微信和 Native 降级定位按 `coordType` 将 WGS-84 转为 GCJ-02
- **定位元数据**：补全原始坐标系、是否转换、定位 API、来源、平台和采样次数，不改变原有经纬度字段

### Quality

- 增加南京现场坐标的 H5 转换回归测试

## v1.1.0 (2026-07-14)

### Features

- **MbaseBridge**：新增 mbase App WebView 传输，业务 Hook 与钉钉 iframe 保持一致
- **App SDK**：内置官方 `uni.webview.1.5.8.js`，仅在 App 宿主首次调用时懒加载
- **定位质量**：透传坐标系、服务来源、平台、采样次数和定位时间等可选元数据
- **宿主检测**：支持 `mbase_host=app` 显式标记，不改变浏览器、钉钉、微信和独立 Native 的原有识别

### Quality

- 新增 App/iframe transport、协议兼容和定位元数据测试
- 修复水印测试画布桩及文件下载延迟 DOM 清理问题
- 229 个测试通过，覆盖率门禁通过

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
