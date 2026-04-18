# useVideoRecorder

视频录制 Hook — 基于 MediaRecorder API，支持实时预览。

## 基本用法

```ts
import { useVideoRecorder } from "@robot/h5-core";

const { isRecording, duration, stream, error, start, stop } = useVideoRecorder();

await start();
// stream.value → MediaStream 可绑定到 <video>
const blob = await stop();
```

## 高级用法

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { useVideoRecorder } from "@robot/h5-core";

const videoRef = ref<HTMLVideoElement>();
const { isRecording, duration, stream, start, stop } = useVideoRecorder({
  facingMode: "user",   // 前置摄像头
  audio: false,         // 不录音频
});

// stream 绑定到 video 实时预览
watch(stream, (s) => {
  if (videoRef.value && s) videoRef.value.srcObject = s;
});

async function handleStop() {
  const blob = await stop();
  if (blob) {
    const file = new File([blob], `video-${Date.now()}.webm`, { type: blob.type });
    // 上传或保存...
  }
}
</script>

<template>
  <video ref="videoRef" autoplay muted />
  <button @click="start" v-if="!isRecording">开始录制</button>
  <button @click="handleStop" v-else>停止（{{ duration }}ms）</button>
</template>
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isRecording` | `Ref<boolean>` | 是否在录制 |
| `duration` | `Ref<number>` | 已录制时长（ms） |
| `stream` | `Ref<MediaStream \| null>` | 视频流（可绑定 `<video>` 预览） |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `start()` | `() => Promise<void>` | 开始录制 |
| `stop()` | `() => Promise<Blob \| null>` | 停止并返回视频 Blob |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `facingMode` | `'user' \| 'environment'` | `'environment'` | 前置/后置摄像头 |
| `audio` | `boolean` | `true` | 是否同时录音频 |
| `mimeType` | `string` | 自动选择 | 视频格式 |
| `videoBitsPerSecond` | `number` | 默认 | 视频比特率 |

## 注意事项

- HTTPS 必需
- `stream` 可直接赋值给 `<video>.srcObject` 实时预览画面
- iOS Safari 不支持 `video/webm`，需要 `video/mp4` 或 polyfill
- 组件卸载自动停止录制并释放摄像头
