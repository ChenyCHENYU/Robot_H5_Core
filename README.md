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
| `MbaseBridge` | wl-mbase（钉钉 iframe、App/PDA WebView） | 子应用经统一协议桥接拍照/扫码/定位及扩展能力 |
| `WechatBridge` | 微信/企微 | 项目侧通过 `overrides` 注入 weixin-js-sdk |

> **mbase 自动识别**：`mbase_host=app` 识别 App/PDA；`from=portal` 或钉钉 iframe
> 识别门户嵌入态。普通第三方 iframe 不会误判。钉钉顶层页仍为 `dingtalk`，微信和独立浏览器不受影响。
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

当应用由 wl-mbase 承载时，宿主可能是钉钉 iframe，也可能是 App/PDA WebView。业务页面不应直接判断设备或调用宿主私有对象，统一经 Core 发起能力请求。

先在 `src/h5.config.ts` 配置可信门户 origin。App/PDA 不使用该 origin 发送消息，但保留同一配置可让多端构建共用一份代码：

```ts
import { defineH5Config } from "@robot-h5/core";

export default defineH5Config({
  bridge: {
    platform: "auto",
    mbase: {
      origin: import.meta.env.VITE_MBASE_ORIGIN,
      appBridgeTimeoutMs: 6000,
      appSdkUrl: `${import.meta.env.BASE_URL}vendor/uni.webview.1.5.8.js`,
    },
  },
});
```

`origin` 必须是完整来源（协议 + 域名 + 可选端口），禁止配置 `*`。未配置时 Core 会尝试使用 `document.referrer`；两者都不可用时以 `mbase_origin_missing` 明确拒绝，不会退回不安全的通配符。

拍照、扫码、定位继续使用通用 Hook，业务代码无感知：

```ts
import { useCamera, useLocation, useQrScanner } from "@robot-h5/core";

const { capture } = useCamera();        // 自动经基座拍照
const { getCurrentPosition } = useLocation();  // 自动经基座定位
const { scan } = useQrScanner();        // 自动经基座扫码
```

- **自动识别**：App/PDA 的 `mbase_host=app`、门户的 `from=portal`、兼容旧钉钉 iframe；普通 iframe、浏览器、微信不受影响。
- **能力范围**：桥接 `camera` / `scanner` / `location`；其余能力（NFC、蓝牙、文件预览、通知）自动降级到浏览器实现。
- **安全边界**：iframe 请求使用精确 target origin；响应同时校验 `event.source` 与 `event.origin`。
- **App/PDA**：官方 `uni.webview` SDK 应由业务域名自托管，Core 只在 App 宿主首次通信时按 `appSdkUrl` 插入脚本；普通 H5 主包和运行路径均不包含 SDK。
- **桥接协议**（与基座约定，子应用 → 基座）：
  - 请求：`{ source: "mbase-bridge", type: "capability:invoke", id, api, payload }`
  - 响应：`{ source: "mbase-bridge", type: "capability:result", id, ok, data?, error?, reason? }`
  - `api`：`takePhoto` · `scan` · `getLocation`
- **未嵌入基座**时调用会立即拒绝（而非挂起），便于上层降级提示。

Core 尚未封装成 Hook 的基座能力（如相册选择）使用统一扩展入口：

```ts
import {
  getMbaseTransportStatus,
  invokeMbaseCapability,
  MbaseBridgeError,
} from "@robot-h5/core/bridge";

try {
  const result = await invokeMbaseCapability<{ files: unknown[] }>(
    "chooseImage",
    { source: "album", max: 1 },
  );
  console.info(result.files);
} catch (error) {
  const bridgeError = error as MbaseBridgeError;
  console.error(bridgeError.code, bridgeError.message, bridgeError.details);
  console.table(getMbaseTransportStatus());
}
```

职责边界：Core 负责宿主识别、安全传输、超时和稳定错误；模板负责路由标题与返回协议；业务负责页面交互、上传地址和附件关联规则。

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
