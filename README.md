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
| `useCamera` | 拍照/相册 + 自动压缩 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useCamera/README.md) |
| `useLocation` | GPS 单次/持续定位 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useLocation/README.md) |
| `useQrScanner` | 二维码/条形码扫描 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useQrScanner/README.md) |
| `useNfc` | NFC 读写 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useNfc/README.md) |
| `useFileUpload` | 分片上传 + 进度条 + 自动重试 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useFileUpload/README.md) |
| `useFileDownload` | 文件下载 + 流式进度 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useFileDownload/README.md) |
| `useFilePreview` | PDF/Office/图片预览 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useFilePreview/README.md) |
| `useSignature` | Canvas 手写签名 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useSignature/README.md) |
| `useAudioRecorder` | 录音 + 暂停恢复 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useAudioRecorder/README.md) |
| `useVideoRecorder` | 视频录制 + 实时预览 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useVideoRecorder/README.md) |
| `useBluetooth` | 蓝牙设备连接 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useBluetooth/README.md) |
| `useOfflineStorage` | IndexedDB 离线存储 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useOfflineStorage/README.md) |
| `usePushNotification` | 推送通知 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/usePushNotification/README.md) |
| `useWatermark` | 图片水印（保留原图格式） | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/useWatermark/README.md) |
| `usePermission` | 系统权限查询/请求/监听 | [README](https://github.com/ChenyCHENYU/Robot_H5_Core/blob/main/src/hooks/usePermission/README.md) |

### Bridge 适配器

| 适配器 | 环境 | 说明 |
|--------|------|------|
| `BrowserBridge` | 浏览器 | 完整实现，Web 标准 API 降级 |
| `NativeBridge` | APP WebView | 项目侧通过 `overrides` 注入原生 SDK |
| `DingtalkBridge` | 钉钉 | 项目侧通过 `overrides` 注入 dingtalk-jsapi |
| `MbaseBridge` | 钉钉内嵌入基座(mbase) | 子应用经基座 `postMessage` 桥接拍照/扫码/定位，**自动识别，零配置** |
| `WechatBridge` | 微信/企微 | 项目侧通过 `overrides` 注入 weixin-js-sdk |

> **mbase 自动识别**：当应用以 iframe 形式嵌入门户基座、且运行在钉钉客户端内时，
> `platform: "auto"` 会自动解析为 `mbase`（钉钉顶层页面仍为 `dingtalk`，其余环境不受影响）。
> 详见下文 [基座嵌入场景（mbase）](#基座嵌入场景mbase)。


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

### 基座嵌入场景（mbase）

当本应用作为**子应用**以 iframe 形式嵌入移动端门户**基座(mbase)**、且运行在钉钉客户端内时：
钉钉 WebView 安全策略**禁止 iframe 子页面直接调用拍照/定位 JSAPI**，只有基座（钉钉入口页）有调用权限。

`MbaseBridge` 自动处理这一场景 —— 子应用通过 `postMessage` 请求基座代为调用，基座完成 `dd.config`
鉴权后执行并回传结果，**业务代码无感知**：

```ts
// 无需任何额外配置，platform: "auto"（默认）即可自动识别
import { useCamera, useLocation, useQrScanner } from "@robot-h5/core";

const { capture } = useCamera();        // 自动经基座拍照
const { getCurrentPosition } = useLocation();  // 自动经基座定位
const { scan } = useQrScanner();        // 自动经基座扫码
```

- **自动识别**：钉钉 + iframe 嵌入 → `mbase`；钉钉顶层页面 → `dingtalk`；浏览器/微信等不受影响。
- **能力范围**：桥接 `camera` / `scanner` / `location`；其余能力（NFC、蓝牙、文件预览、通知）自动降级到浏览器实现。
- **桥接协议**（与基座约定，子应用 → 基座）：
  - 请求：`{ source: "mbase-bridge", type: "capability:invoke", id, api, payload }`
  - 响应：`{ source: "mbase-bridge", type: "capability:result", id, ok, data?, error?, reason? }`
  - `api`：`takePhoto` · `scan` · `getLocation`
- **未嵌入基座**时调用会立即拒绝（而非挂起），便于上层降级提示。

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
├── bridge/      5 个适配器（Native/钉钉/mbase/微信/浏览器）
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
