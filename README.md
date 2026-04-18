# @robot/h5-core

企业级移动端 H5 通用能力包 — **厚组合层架构**。

> 包做厚、项目做薄。业务项目只需「配置 + 引用」，即获完整能力。

## 安装

```bash
pnpm add @robot/h5-core
```

> **前置依赖**：项目需安装 `vue@^3.3.0`（peerDependency）

## 快速开始

```ts
// main.ts
import { createApp } from "vue";
import { defineAppConfig } from "@robot/h5-core";
import App from "./App.vue";

const app = createApp(App);

await defineAppConfig(app, {
  bridge: { platform: "auto" },
  upload: { action: "/api/file/upload", headers: () => ({ Authorization: `Bearer ${getToken()}` }) },
  image: { maxSize: 1024, quality: 0.8 },
  location: { coordType: "gcj02", timeout: 10000 },
});

app.mount("#app");
```

```vue
<script setup>
import { useCamera, useLocation } from "@robot/h5-core/hooks";

const { photo, capture } = useCamera();
const { position, getCurrentPosition } = useLocation();
</script>
```

---

## 功能导航

### Hooks（14 个组合函数）

| Hook | 说明 | 文档 |
|------|------|------|
| `useCamera` | 拍照/相册 + 自动压缩 | [README](src/hooks/useCamera/README.md) |
| `useLocation` | GPS 单次/持续定位 | [README](src/hooks/useLocation/README.md) |
| `useQrScanner` | 二维码/条形码扫描 | [README](src/hooks/useQrScanner/README.md) |
| `useNfc` | NFC 读写 | [README](src/hooks/useNfc/README.md) |
| `useFileUpload` | 分片上传 + 进度条 + 自动重试 | [README](src/hooks/useFileUpload/README.md) |
| `useFilePreview` | PDF/Office/图片预览 | [README](src/hooks/useFilePreview/README.md) |
| `useSignature` | Canvas 手写签名 | [README](src/hooks/useSignature/README.md) |
| `useAudioRecorder` | 录音 + 暂停恢复 | [README](src/hooks/useAudioRecorder/README.md) |
| `useVideoRecorder` | 视频录制 + 实时预览 | [README](src/hooks/useVideoRecorder/README.md) |
| `useBluetooth` | 蓝牙设备连接 | [README](src/hooks/useBluetooth/README.md) |
| `useOfflineStorage` | IndexedDB 离线存储 | [README](src/hooks/useOfflineStorage/README.md) |
| `usePushNotification` | 推送通知 | [README](src/hooks/usePushNotification/README.md) |
| `useWatermark` | 图片水印（保留原图格式） | [README](src/hooks/useWatermark/README.md) |
| `usePermission` | 系统权限查询/请求/监听 | [README](src/hooks/usePermission/README.md) |

### Bridge 适配器

| 适配器 | 环境 | 状态 |
|--------|------|------|
| `BrowserBridge` | 浏览器降级 | ✅ 完整实现 |
| `NativeBridge` | APP WebView | ✅ 降级可用，项目侧通过 `overrides` 注入原生 SDK |
| `DingtalkBridge` | 钉钉 | ✅ 降级可用，项目侧通过 `overrides` 注入 dingtalk-jsapi |
| `WechatBridge` | 微信/企微 | ✅ 降级可用，项目侧通过 `overrides` 注入 weixin-js-sdk |

### Utils 工具函数

| 模块 | 函数 |
|------|------|
| `image` | `compressImage`, `fileToBase64`, `base64ToBlob` |
| `coord` | `gcj02ToWgs84`, `wgs84ToGcj02` |
| `device` | `getDeviceInfo`, `isAndroid`, `isIOS` |
| `file` | `getFileType`, `formatFileSize` |
| `validate` | `isPhone`, `isIdCard`, `isEmail`, `isCreditCode` |
| `format` | `formatDate`, `formatMoney` |

---

## 架构

```
业务项目（薄）── defineAppConfig + useXxx ──┐
                                             │
@robot/h5-core（厚）                         ▼
├── hooks/     14 个组合函数（封装全部逻辑）
├── bridge/    4 个适配器（Native/钉钉/微信/浏览器）
├── config/    配置驱动（provide/inject）
├── utils/     纯函数工具（零依赖）
└── types/     共享类型定义
```

依赖规则（单向无环）：`Hooks → Bridge + Utils + Config`，`Bridge → Types`，`Utils → 零依赖`

---

## 项目侧扩展

```ts
// SDK 能力注入（推荐方式 — 通过配置将平台 SDK 能力注入包内）
import { defineAppConfig } from "@robot/h5-core";
import dd from "dingtalk-jsapi";

await defineAppConfig(app, {
  bridge: {
    platform: "dingtalk",
    dingtalk: { corpId: "ding_xxx" },
    overrides: {
      scanner: {
        async scan() {
          const { text } = await dd.biz.util.scan({ type: "qrCode" });
          return text;
        },
      },
      location: {
        async getCurrent() {
          const pos = await dd.device.geolocation.get({ targetAccuracy: 200 });
          return { longitude: pos.longitude, latitude: pos.latitude, accuracy: pos.accuracy, timestamp: Date.now() };
        },
        watchPosition: (cb) => { /* ... */ return () => {}; },
      },
      camera: {
        async capture() {
          const { filePath } = await dd.biz.util.uploadImage({ compression: true });
          return fetch(filePath).then(r => r.blob()).then(b => new File([b], "photo.jpg"));
        },
      },
    },
  },
});
```

```ts
// 注册自定义 Bridge 适配器
import { registerAdapter } from "@robot/h5-core";
registerAdapter("my-native", myBridgeAdapter);

// Hook 行为增强
import { extendHook } from "@robot/h5-core";
extendHook("useCamera", {
  after: async (file) => { await uploadToOss(file); return file; },
});

// 热更新时重置 Bridge 实例
import { resetBridge, createBridge } from "@robot/h5-core";
resetBridge();
await createBridge("wechat");
```

---

## NPM 发布

```bash
pnpm run build        # 构建 ESM + 类型声明
npm publish           # 发布到 npm registry
```

发布产物仅包含 `dist/` 目录（由 `package.json.files` 控制）。

---

## 开发

```bash
pnpm install          # 安装依赖
pnpm test             # 运行测试（watch 模式）
pnpm test:run         # 运行测试（单次）
pnpm run lint         # ESLint 检查 + 修复
pnpm run typecheck    # TypeScript 类型检查
pnpm run build        # 构建库
pnpm run cz           # 规范化提交
```

---

## 文档

- [架构设计](docs/DESIGN.md) — 三层模型、配置驱动、扩展机制
- [功能清单](docs/CHECKLIST.md) — 实现进度
- [需求映射](docs/REQUIREMENTS.md) — 业务需求 → Hook 映射
- [后续规划](docs/ROADMAP.md) — 版本计划

## 许可证

UNLICENSED — 企业内部使用
