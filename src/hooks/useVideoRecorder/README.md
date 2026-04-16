# useVideoRecorder

视频录制 + 实时预览 + 最大时长限制。

## 引入

```ts
import { useVideoRecorder } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const videoRef = ref<HTMLVideoElement>();
const { videoBlob, videoUrl, duration, recording, error, getStream, start, stop, clear } = useVideoRecorder();

async function init() {
  const stream = await getStream();
  if (stream && videoRef.value) {
    videoRef.value.srcObject = stream;
  }
}
</script>

<template>
  <video ref="videoRef" autoplay muted />
  <button @click="init">初始化摄像头</button>
  <button v-if="!recording" @click="start()">开始录制</button>
  <button v-else @click="stop()">停止</button>
  <p>{{ Math.round(duration / 1000) }}s</p>
  <video v-if="videoUrl" :src="videoUrl" controls />
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `1280` | 视频宽度 |
| `height` | `number` | `720` | 视频高度 |
| `facingMode` | `'user' \| 'environment'` | `'environment'` | 前置/后置 |
| `mimeType` | `string` | 自动检测 | 视频格式 |
| `maxDuration` | `number` | `0` | 最大时长(ms) |
| `audio` | `boolean` | `true` | 是否录音 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `videoBlob` | `Ref<Blob \| null>` | 录制结果 |
| `videoUrl` | `Ref<string>` | 预览 URL |
| `duration` | `Ref<number>` | 已录制时长(ms) |
| `recording` | `Ref<boolean>` | 是否正在录制 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `getStream` | `(options?) => Promise<MediaStream \| null>` | 获取媒体流 |
| `start` | `() => Promise<boolean>` | 开始录制（需先 getStream） |
| `stop` | `() => Promise<Blob \| null>` | 停止录制 |
| `clear` | `() => void` | 清除录制结果 |

## 使用流程

1. `getStream()` → 获取摄像头，绑定到 `<video>` 实时预览
2. `start()` → 开始录制
3. `stop()` → 停止并获取 Blob

## 自动清理

组件卸载时自动停止录制、释放摄像头、回收 ObjectURL。
