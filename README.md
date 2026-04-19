# @robot-h5/core

企业级移动端 H5 通用能力包 — **厚组合层架构**。

> 包做厚、项目做薄。业务项目只需「配置 + 引用」，即获完整能力。

---

## 安装

```bash
pnpm add @robot-h5/core
```

> **前置依赖**：`vue@^3.3.0`（peerDependency）

---

## 快速开始

### 1. 创建配置文件

```ts
// src/h5.config.ts
import { defineH5Config } from "@robot-h5/core";

export default defineH5Config({
  // 上传接口
  upload: {
    action: "/api/file/upload",
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  },
  // 图片压缩
  image: { maxSize: 1024, quality: 0.8 },
  // GPS 定位
  location: { coordType: "gcj02", timeout: 10000 },
});
```

### 2. 注册插件（一行搞定）

```ts
// main.ts
import { createApp } from "vue";
import { h5Core } from "@robot-h5/core";
import h5Config from "./h5.config";
import App from "./App.vue";

createApp(App)
  .use(h5Core, h5Config)   // ← 一行完成全部初始化
  .mount("#app");
```

### 3. 在组件中使用

```vue
<script setup>
import { useCamera, useLocation } from "@robot-h5/core";

const { photo, capture } = useCamera();
const { position, getCurrentPosition } = useLocation();
</script>
```

> **零配置也能用** — 不传配置时使用内置默认值：
> ```ts
> createApp(App).use(h5Core).mount("#app");
> ```

---

## 功能一览

### Hooks（15 个组合函数）

| Hook | 说明 | 文档 |
|------|------|------|
| `useCamera` | 拍照/相册 + 自动压缩 | [README](src/hooks/useCamera/README.md) |
| `useLocation` | GPS 单次/持续定位 | [README](src/hooks/useLocation/README.md) |
| `useQrScanner` | 二维码/条形码扫描 | [README](src/hooks/useQrScanner/README.md) |
| `useNfc` | NFC 读写 | [README](src/hooks/useNfc/README.md) |
| `useFileUpload` | 分片上传 + 进度条 + 自动重试 | [README](src/hooks/useFileUpload/README.md) |
| `useFileDownload` | 文件下载 + 流式进度 | [README](src/hooks/useFileDownload/README.md) |
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

| 适配器 | 环境 | 说明 |
|--------|------|------|
| `BrowserBridge` | 浏览器 | 完整实现，Web 标准 API 降级 |
| `NativeBridge` | APP WebView | 项目侧通过 `overrides` 注入原生 SDK |
| `DingtalkBridge` | 钉钉 | 项目侧通过 `overrides` 注入 dingtalk-jsapi |
| `WechatBridge` | 微信/企微 | 项目侧通过 `overrides` 注入 weixin-js-sdk |

### Utils 工具函数

| 模块 | 函数 |
|------|------|
| `image` | `compressImage` · `fileToBase64` · `base64ToBlob` |
| `coord` | `gcj02ToWgs84` · `wgs84ToGcj02` |
| `device` | `getDeviceInfo` · `isAndroid` · `isIOS` |
| `file` | `getFileType` · `formatFileSize` |
| `validate` | `isPhone` · `isIdCard` · `isEmail` · `isCreditCode` |
| `format` | `formatDate` · `formatMoney` |

---

## 进阶配置

### 注入平台 SDK（以钉钉为例）

```ts
// src/h5.config.ts
import { defineH5Config } from "@robot-h5/core";
import dd from "dingtalk-jsapi";

export default defineH5Config({
  bridge: {
    platform: "dingtalk",
    dingtalk: { corpId: "ding_xxx" },
    // 将钉钉 SDK 能力注入 — 未覆盖的自动降级到浏览器
    overrides: {
      scanner: {
        scan: async () => (await dd.biz.util.scan({ type: "qrCode" })).text,
      },
      location: {
        getCurrent: async () => {
          const p = await dd.device.geolocation.get({ targetAccuracy: 200 });
          return { longitude: p.longitude, latitude: p.latitude, accuracy: p.accuracy, timestamp: Date.now() };
        },
        watchPosition: (cb) => { /* ... */ return () => {}; },
      },
    },
  },
});
```

### Hook 行为扩展

```ts
// src/h5.config.ts — 在配置中声明扩展
export default defineH5Config({
  upload: { action: "/api/file/upload" },

  // 声明式 Hook 扩展
  extensions: {
    useCamera: {
      after: async (file) => {
        await uploadToOss(file);  // 拍照后自动上传 OSS
        return file;
      },
    },
  },
});
```

### 自定义适配器

```ts
// src/h5.config.ts — 注册自定义适配器
export default defineH5Config({
  bridge: { platform: "my-native" },
  adapters: {
    "my-native": myCustomBridgeAdapter,
  },
});
```

---

## 架构

```
业务项目（薄）
├── h5.config.ts          ← 配置文件（defineH5Config）
└── main.ts               ← app.use(h5Core, config)
         │
         ▼
@robot-h5/core（厚）
├── plugin.ts    Vue Plugin（一行注册）
├── hooks/       15 个组合函数（封装全部逻辑）
├── bridge/      4 个适配器（Native/钉钉/微信/浏览器）
├── config/      配置驱动（provide/inject）
├── utils/       纯函数工具（零依赖）
└── types/       共享类型定义
```

依赖规则（单向无环）：`Hooks → Bridge + Utils + Config`，`Bridge → Types`，`Utils → 零依赖`

---

## 开发

```bash
pnpm install          # 安装依赖
pnpm test             # 运行测试（watch 模式）
pnpm test:run         # 单次运行
pnpm run lint         # ESLint 检查 + 修复
pnpm run typecheck    # TypeScript 类型检查
pnpm run build        # 构建 ESM + 类型声明
```

## 文档

- [架构设计](docs/DESIGN.md) — 三层模型、配置驱动、扩展机制
- [功能清单](docs/CHECKLIST.md) — 实现进度
- [需求映射](docs/REQUIREMENTS.md) — 业务需求 → Hook 映射
- [后续规划](docs/ROADMAP.md) — 版本计划

## 许可证

UNLICENSED — 企业内部使用
