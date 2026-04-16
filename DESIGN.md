# @robot/h5-core — 厚组合层设计文档

> **核心理念：包做厚、项目做薄。**
> 把复杂度封装在 `@robot/h5-core`，业务项目只需 **配置 + 引用**，即可获得完整能力。
> 同时保留 **项目级扩展点**，允许业务侧按需覆盖/增强，绝不污染包本身。

---

## 目录

- [设计哲学](#设计哲学)
- [功能清单](#功能清单)
- [包目录结构](#包目录结构)
- [核心架构：三层模型](#核心架构三层模型)
- [配置驱动 API](#配置驱动-api)
- [项目侧扩展机制](#项目侧扩展机制)
- [详细设计](#详细设计)
- [测试策略](#测试策略)
- [版本与发布](#版本与发布)

---

## 设计哲学

### 厚组合层 + 薄项目层

```
┌──────────────────────────────────────────────────────────┐
│  业务项目 (Robot_H5, 物流H5, 安全H5 ...)                   │
│                                                            │
│  只做三件事:                                                │
│    1. 提供配置 (defineAppConfig)                            │
│    2. 引用 Hook (useCamera / useLocation / ...)            │
│    3. 按需扩展 (registerAdapter / extendHook)              │
│                                                            │
│  2-3 行代码获得完整能力，零 boilerplate                       │
└────────────────────────┬───────────────────────────────────┘
                         │ pnpm add @robot/h5-core
                         ▼
┌──────────────────────────────────────────────────────────┐
│  @robot/h5-core（厚组合层）                                 │
│                                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  Hooks  │  │  Bridge  │  │  Utils  │  │ Presets │     │
│  │ 14个组合 │  │ 4个适配器│  │ 14个工具│  │ 开箱配置│     │
│  └────┬────┘  └────┬────┘  └─────────┘  └─────────┘     │
│       │            │                                       │
│       └──── 配置注入 / 自动检测 / 按需加载 ────┘            │
└──────────────────────────────────────────────────────────┘
```

### 三个设计约束

| 约束               | 说明                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| **配置优先**       | 所有行为通过配置对象驱动，不硬编码业务逻辑                               |
| **可扩展不可污染** | 项目可注册自定义适配器和覆盖默认行为，但 node_modules 中的包代码永远不变 |
| **按需取用零冗余** | tree-shaking 友好，只打包用到的 Hook/Utils/Bridge                        |

---

## 功能清单

> ⬜ = 待实现 | ✅ = 已完成 | 🚧 = 开发中

### Hooks（Vue 3 Composable）

| #   | Hook                  | 说明                               | 状态 |
| --- | --------------------- | ---------------------------------- | ---- |
| 1   | `useCamera`           | 拍照/相册 → File/Base64 + 自动压缩 | ⬜   |
| 2   | `useQrScanner`        | 二维码/条形码扫描                  | ⬜   |
| 3   | `useNfc`              | NFC 读卡/写卡                      | ⬜   |
| 4   | `useLocation`         | GPS 单次/持续定位                  | ⬜   |
| 5   | `useFileUpload`       | 分片上传 + 进度条 + 自动压缩       | ⬜   |
| 6   | `useFilePreview`      | PDF/Office/图片 在线预览           | ⬜   |
| 7   | `useSignature`        | Canvas 手写签名板                  | ⬜   |
| 8   | `useAudioRecorder`    | 录音 + 可选语音转文字              | ⬜   |
| 9   | `useVideoRecorder`    | 视频录制                           | ⬜   |
| 10  | `useBluetooth`        | 蓝牙设备连接                       | ⬜   |
| 11  | `useOfflineStorage`   | IndexedDB + 在线自动同步           | ⬜   |
| 12  | `usePushNotification` | 统一推送                           | ⬜   |
| 13  | `useWatermark`        | 拍照水印（时间+地点+人员）         | ⬜   |
| 14  | `usePermission`       | 系统权限请求/检查                  | ⬜   |

### Bridge 适配器

| #   | 适配器           | 环境        | 状态 |
| --- | ---------------- | ----------- | ---- |
| 1   | `NativeBridge`   | APP WebView | ⬜   |
| 2   | `DingtalkBridge` | 钉钉        | ⬜   |
| 3   | `WechatBridge`   | 微信/企微   | ⬜   |
| 4   | `BrowserBridge`  | 浏览器降级  | ⬜   |

### Utils 工具函数

| #   | 模块       | 函数                                             | 状态 |
| --- | ---------- | ------------------------------------------------ | ---- |
| 1   | `image`    | `compressImage`, `fileToBase64`, `base64ToBlob`  | ⬜   |
| 2   | `coord`    | `gcj02ToWgs84`, `wgs84ToGcj02`                   | ⬜   |
| 3   | `device`   | `getDeviceInfo`, `isAndroid`, `isIOS`            | ⬜   |
| 4   | `file`     | `getFileType`, `formatFileSize`                  | ⬜   |
| 5   | `validate` | `isPhone`, `isIdCard`, `isEmail`, `isCreditCode` | ⬜   |
| 6   | `format`   | `formatDate`, `formatMoney`                      | ⬜   |

### 基础设施

| #   | 能力              | 说明                     | 状态 |
| --- | ----------------- | ------------------------ | ---- |
| 1   | `defineAppConfig` | 全局配置入口             | ⬜   |
| 2   | `createBridge`    | Bridge 工厂 + 自动检测   | ⬜   |
| 3   | `extendHook`      | Hook 扩展注册            | ⬜   |
| 4   | `registerAdapter` | 自定义 Bridge 适配器注册 | ⬜   |

---

## 包目录结构

```
@robot/h5-core/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── DESIGN.md                  # ← 本文档（架构设计）
├── CHECKLIST.md               # ← 功能清单（与上表同步）
│
├── src/
│   ├── index.ts               # 顶层入口：re-export 所有子模块
│   │
│   ├── config/                # ===== 配置系统 =====
│   │   ├── define.ts          # defineAppConfig() 实现
│   │   ├── defaults.ts        # 全局默认配置
│   │   ├── types.ts           # AppConfig 类型
│   │   └── index.ts
│   │
│   ├── hooks/                 # ===== 组合函数层（厚） =====
│   │   ├── useCamera/
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── useLocation/
│   │   ├── useQrScanner/
│   │   ├── useNfc/
│   │   ├── useFileUpload/
│   │   ├── useFilePreview/
│   │   ├── useSignature/
│   │   ├── useAudioRecorder/
│   │   ├── useVideoRecorder/
│   │   ├── useBluetooth/
│   │   ├── useOfflineStorage/
│   │   ├── usePushNotification/
│   │   ├── useWatermark/
│   │   ├── usePermission/
│   │   └── index.ts           # 统一导出
│   │
│   ├── bridge/                # ===== 宿主适配层 =====
│   │   ├── types.ts           # BridgeAdapter 抽象接口
│   │   ├── detector.ts        # 运行环境自动检测
│   │   ├── adapters/
│   │   │   ├── native.ts
│   │   │   ├── dingtalk.ts
│   │   │   ├── wechat.ts
│   │   │   └── browser.ts
│   │   ├── registry.ts        # 适配器注册表（支持项目扩展）
│   │   └── index.ts           # createBridge() 工厂
│   │
│   ├── utils/                 # ===== 纯函数工具 =====
│   │   ├── image.ts
│   │   ├── coord.ts
│   │   ├── device.ts
│   │   ├── file.ts
│   │   ├── validate.ts
│   │   ├── format.ts
│   │   └── index.ts
│   │
│   └── types/                 # ===== 共享类型 =====
│       ├── bridge.d.ts
│       ├── hooks.d.ts
│       └── index.d.ts
│
├── __tests__/                 # ===== 测试 =====
│   ├── config/
│   ├── hooks/
│   ├── bridge/
│   └── utils/
│
└── playground/                # 开发调试 Demo
    ├── vite.config.ts
    └── src/App.vue
```

---

## 核心架构：三层模型

```
             ┌─ 项目层 ─┐
             │ 配置 + 扩展 │     ← 薄：defineAppConfig + registerAdapter
             └─────┬─────┘
                   │ 注入
             ┌─────▼─────┐
             │  组合函数层 │     ← 厚：14 Hooks，封装全部复杂逻辑
             └─────┬─────┘
                   │ 委派
         ┌─────────┼─────────┐
     ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
     │ Bridge │ │ Utils │ │ Types │  ← 基础：适配器 + 纯函数 + 类型
     └───────┘ └───────┘ └───────┘
```

### 依赖规则（单向无环）

- **Hooks** → 可依赖 Bridge、Utils、Types
- **Bridge** → 只依赖 Types（不依赖 Hooks）
- **Utils** → 零依赖（纯函数）
- **Types** → 零运行时

---

## 配置驱动 API

### 核心思想：项目只写配置，包做一切

```ts
// ==========================================
// 项目 main.ts — 这就是项目需要写的全部代码
// ==========================================
import { createApp } from "vue";
import { defineAppConfig } from "@robot/h5-core";
import App from "./App.vue";

const app = createApp(App);

defineAppConfig(app, {
  // Bridge 配置：告诉包当前宿主环境规则
  bridge: {
    platform: "auto", // 'auto' = 自动检测（默认）
    nativeUA: "robot-app", // APP 端自定义 UA 特征
    dingtalk: { corpId: "ding_xxx" },
    wechat: { appId: "wx_xxx" },
  },

  // 上传配置：所有涉及上传的 Hook 共享
  upload: {
    action: "/api/file/upload",
    chunkSize: 2 * 1024 * 1024,
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  },

  // 图片配置：拍照/选图类 Hook 共享
  image: {
    maxSize: 1024,
    quality: 0.8,
    maxWidth: 1920,
  },

  // 定位配置
  location: {
    coordType: "gcj02",
    timeout: 10000,
  },
});

app.mount("#app");
```

### 配置类型定义

```ts
export interface AppConfig {
  bridge?: BridgeConfig;
  upload?: UploadConfig;
  image?: ImageConfig;
  location?: LocationConfig;
}

export interface BridgeConfig {
  platform?: "auto" | "native" | "dingtalk" | "wechat" | "browser";
  nativeUA?: string;
  dingtalk?: { corpId: string };
  wechat?: { appId: string; jsApiList?: string[] };
}
```

### Hook 如何读取配置

```ts
export function useCamera(options?: UseCameraOptions) {
  // ① 读取全局配置，② 合并（局部 > 全局 > 默认），③ 自动获取 Bridge
  const globalConfig = useAppConfig();
  const opts = deepMerge(DEFAULTS, globalConfig.image, options);
  const bridge = useBridge();

  const photo = ref<File | null>(null);
  const loading = ref(false);

  async function capture() {
    loading.value = true;
    const file = await bridge.camera.capture(opts);
    photo.value = opts.maxSize ? await compressImage(file, opts) : file;
    loading.value = false;
    return photo.value;
  }

  onUnmounted(() => {
    /* 自动清理 */
  });
  return { photo, loading, capture, clear };
}
```

### 项目侧使用（极简）

```vue
<script setup lang="ts">
import { useCamera } from "@robot/h5-core/hooks";

// 2 行代码 — 压缩、Bridge 调用、错误处理、资源清理全在包里
const { photo, loading, capture } = useCamera();
</script>

<template>
  <button @click="capture" :loading="loading">拍照</button>
  <img v-if="photo" :src="URL.createObjectURL(photo)" />
</template>
```

---

## 项目侧扩展机制

### 原则：扩展在项目中，包本体不变

```
node_modules/@robot/h5-core/    ← 只读，永远不动
src/extensions/                  ← 项目自己的扩展目录
  ├── my-bridge-adapter.ts
  ├── camera-overrides.ts
  └── custom-validators.ts
```

### 扩展方式 1：注册自定义 Bridge 适配器

```ts
import { registerAdapter } from "@robot/h5-core/bridge";

registerAdapter("robot-native-v2", {
  platform: "native",
  camera: {
    async capture(options) {
      return window.RobotBridge.invokeCamera(options);
    },
  },
  location: {
    async getCurrent() {
      return window.RobotBridge.getLocation();
    },
    watchPosition(cb) {
      return window.RobotBridge.watchLocation(cb);
    },
  },
  // 其他能力未实现时自动 fallback 到 BrowserBridge
});
```

### 扩展方式 2：Hook 行为覆盖

```ts
import { extendHook } from "@robot/h5-core";

extendHook("useCamera", {
  afterCapture: async (file, context) => {
    const url = await myOssUpload(file);
    context.meta.ossUrl = url;
    return file;
  },
});
```

### 扩展方式 3：工具函数补充

```ts
import { isPhone } from "@robot/h5-core/utils";

// 业务专用校验，不改包
export function isJobNumber(str: string): boolean {
  return /^[A-Z]{2}-\d{4}$/.test(str);
}
```

---

## 详细设计

### Bridge 抽象接口

```ts
export interface BridgeAdapter {
  readonly platform: string;
  camera: { capture(options: CameraOptions): Promise<File> };
  scanner: { scan(options?: ScanOptions): Promise<string> };
  location: {
    getCurrent(): Promise<Coordinates>;
    watchPosition(cb: (pos: Coordinates) => void): () => void;
  };
  nfc: { read(): Promise<NFCData>; write(data: NFCData): Promise<void> };
  bluetooth: {
    connect(deviceId: string): Promise<BluetoothDevice>;
    disconnect(): Promise<void>;
  };
  file: { preview(url: string, name?: string): Promise<void> };
  notification: {
    register(token: string): Promise<void>;
    onMessage(cb: (msg: PushMessage) => void): () => void;
  };
}
```

### 环境检测

```ts
export function detectPlatform(nativeUA?: string): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("dingtalk")) return "dingtalk";
  if (ua.includes("micromessenger") || ua.includes("wxwork")) return "wechat";
  if (nativeUA && ua.includes(nativeUA.toLowerCase())) return "native";
  if (window.NativeCallJs) return "native";
  return "browser";
}
```

### Hooks 统一模式

```ts
export function useXxx(options?: UseXxxOptions) {
  const config = useAppConfig();
  const opts = deepMerge(DEFAULTS, config.xxx, options);
  const bridge = useBridge();

  const data = ref(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function execute(...args) {
    loading.value = true;
    error.value = null;
    try {
      args = await runExtensions("useXxx", "before", args);
      const result = await bridge.xxx.doSomething(opts, ...args);
      data.value = await runExtensions("useXxx", "after", result);
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  onUnmounted(() => {
    /* 释放资源 */
  });
  return { data, loading, error, execute };
}
```

---

## 测试策略

| 层     | 覆盖率目标 | 说明                          |
| ------ | ---------- | ----------------------------- |
| Utils  | > 95%      | 纯函数，输入→输出，最好测     |
| Bridge | > 80%      | Mock 宿主 SDK，测适配器逻辑   |
| Hooks  | > 85%      | @vue/test-utils + Mock Bridge |
| Config | > 90%      | 配置合并、校验、默认值        |

---

## 版本与发布

### 语义化版本 (SemVer)

| 变更              | 版本号 |
| ----------------- | ------ |
| 新增 Hook / Utils | Minor  |
| Bug 修复          | Patch  |
| Bridge 接口变更   | Major  |

### package.json exports（按需导入）

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./hooks": {
      "types": "./dist/hooks/index.d.ts",
      "import": "./dist/hooks/index.mjs"
    },
    "./hooks/*": {
      "types": "./dist/hooks/*/index.d.ts",
      "import": "./dist/hooks/*/index.mjs"
    },
    "./bridge": {
      "types": "./dist/bridge/index.d.ts",
      "import": "./dist/bridge/index.mjs"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs"
    },
    "./utils/*": {
      "types": "./dist/utils/*.d.ts",
      "import": "./dist/utils/*.mjs"
    }
  }
}
```

### 发布到私有 npm

```bash
pnpm changeset          # 记录变更
pnpm changeset version  # 更新版本号 + CHANGELOG
pnpm changeset publish  # 发布
```

---

**PROPRIETARY** — 内部私有文档。© Robot H5. All rights reserved.
