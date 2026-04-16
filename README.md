# @robot/h5-core

企业级移动端 H5 通用能力包 — **厚组合层架构**。

> 包做厚、项目做薄。业务项目只需「配置 + 引用」，即获完整能力。

## 安装

```bash
pnpm add @robot/h5-core
```

## 快速开始

```ts
// main.ts
import { createApp } from "vue";
import { defineAppConfig } from "@robot/h5-core";

const app = createApp(App);

defineAppConfig(app, {
  bridge: { platform: "auto" },
  image: { maxSize: 1024, quality: 0.8 },
});

app.mount("#app");
```

```vue
<script setup>
import { useCamera } from "@robot/h5-core/hooks";
const { photo, capture } = useCamera();
</script>
```

## 功能一览

### Hooks（14 个）

| Hook | 说明 | 文档 |
|------|------|------|
| `useCamera` | 拍照/相册 + 自动压缩 | [README](src/hooks/useCamera/README.md) |
| `useLocation` | GPS 定位 + 持续监听 | [README](src/hooks/useLocation/README.md) |
| `useQrScanner` | 二维码/条形码扫描 | [README](src/hooks/useQrScanner/README.md) |
| `useNfc` | NFC 读写 | [README](src/hooks/useNfc/README.md) |
| `useFileUpload` | 分片上传 + 进度 | [README](src/hooks/useFileUpload/README.md) |
| `useFilePreview` | 文件预览 | [README](src/hooks/useFilePreview/README.md) |
| `useSignature` | 手写签名 | [README](src/hooks/useSignature/README.md) |
| `useAudioRecorder` | 录音 | [README](src/hooks/useAudioRecorder/README.md) |
| `useVideoRecorder` | 视频录制 | [README](src/hooks/useVideoRecorder/README.md) |
| `useBluetooth` | 蓝牙连接 | [README](src/hooks/useBluetooth/README.md) |
| `useOfflineStorage` | 离线存储 + 同步 | [README](src/hooks/useOfflineStorage/README.md) |
| `usePushNotification` | 推送消息 | [README](src/hooks/usePushNotification/README.md) |
| `useWatermark` | 拍照水印 + 防截屏 | [README](src/hooks/useWatermark/README.md) |
| `usePermission` | 系统权限 | [README](src/hooks/usePermission/README.md) |

### Utils 工具

| 模块 | 函数 |
|------|------|
| `image` | `compressImage` `fileToBase64` `base64ToBlob` |
| `coord` | `gcj02ToWgs84` `wgs84ToGcj02` |
| `device` | `getDeviceInfo` `isAndroid` `isIOS` |
| `file` | `getFileType` `formatFileSize` |
| `validate` | `isPhone` `isIdCard` `isEmail` `isCreditCode` |
| `format` | `formatDate` `formatMoney` |

## 架构

```
App
 └─ defineAppConfig(app, config)        ← 全局配置
     └─ provide(BRIDGE_KEY, bridge)     ← Bridge 注入
         └─ useXxx()                    ← Hook 内 inject 使用
             ├─ Bridge 适配器调用
             ├─ before/after 扩展
             └─ 浏览器降级
```

**Bridge 适配器**：Browser（降级）/ Native（APP WebView）/ Dingtalk / Wechat

**Hook 扩展**：`extendHook('useCamera', { before, after })` 可在任意 Hook 执行前后注入逻辑。

## 开发

```bash
pnpm install      # 安装依赖
pnpm test         # 运行测试（120 个用例）
pnpm build        # 构建
```

## 测试

覆盖 20 个测试文件、120 个测试用例，包括：
- 全部 14 个 Hook 单元测试
- Bridge 检测与注册表测试
- 配置系统测试
- 所有工具函数测试
