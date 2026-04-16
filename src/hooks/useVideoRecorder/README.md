# useVideoRecorder

视频录制 Hook — 基于 MediaRecorder API。

## 用法

```vue
<template>
  <video ref="videoRef" autoplay muted />
  <button @click="startRecord">录制</button>
  <button @click="stopRecord">停止</button>
</template>

<script setup>
import { ref, watch } from "vue";
import { useVideoRecorder } from "@robot/h5-core/hooks";

const videoRef = ref();
const { isRecording, duration, stream, error, start, stop } = useVideoRecorder({
  facingMode: "environment", // 后置摄像头
  audio: true,
});

// 将 stream 绑定到 video 元素实时预览
watch(stream, (s) => {
  if (videoRef.value && s) videoRef.value.srcObject = s;
});

async function startRecord() { await start(); }
async function stopRecord() {
  const blob = await stop();
  // blob = Blob { type: 'video/webm;codecs=vp9,opus' }
}
</script>
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isRecording` | `Ref<boolean>` | 是否在录制 |
| `duration` | `Ref<number>` | 已录制时长（ms） |
| `stream` | `Ref<MediaStream \| null>` | 视频流（可绑定到 video 元素） |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `start()` | `() => Promise<void>` | 开始录制 |
| `stop()` | `() => Promise<Blob \| null>` | 停止并返回视频 Blob |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `facingMode` | `'user' \| 'environment'` | `'environment'` | 前置/后置摄像头 |
| `audio` | `boolean` | `true` | 是否同时录制音频 |
| `mimeType` | `string` | 自动选择 | 视频格式 |
| `videoBitsPerSecond` | `number` | 默认 | 视频比特率 |

## 注意事项

- **HTTPS 必需**：`getUserMedia` 要求安全上下文
- **iOS Safari**：不支持 `video/webm`，仅支持 `video/mp4` 或需要 MediaRecorder polyfill
- **stream 绑定**：返回的 `stream` 可直接赋给 `<video>` 的 `srcObject` 实现实时预览
- **组件卸载自动清理**：自动停止录制并释放摄像头

## 测试说明

- 单元测试环境（happy-dom）**无 MediaRecorder / getUserMedia API**，仅能测试初始状态
- **必须在真实浏览器中测试录制功能**
- 建议通过 Playwright 或真机验证：预览→录制→停止→回放 完整流程
