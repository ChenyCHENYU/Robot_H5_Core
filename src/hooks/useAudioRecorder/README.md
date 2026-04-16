# useAudioRecorder

浏览器录音 + 暂停/恢复 + 最大时长限制。

## 引入

```ts
import { useAudioRecorder } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { audioBlob, duration, recording, error, start, stop, pause, resume } = useAudioRecorder();
</script>

<template>
  <p>时长: {{ Math.round(duration / 1000) }}s</p>
  <button v-if="!recording" @click="start()">开始录音</button>
  <button v-else @click="stop()">停止</button>
  <button v-if="recording" @click="pause">暂停</button>
  <audio v-if="audioBlob" :src="URL.createObjectURL(audioBlob)" controls />
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sampleRate` | `number` | `44100` | 采样率 |
| `mimeType` | `string` | 自动检测 | 录音格式 |
| `maxDuration` | `number` | `0` | 最大时长(ms)，0=不限 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `audioBlob` | `Ref<Blob \| null>` | 录音结果 |
| `duration` | `Ref<number>` | 已录制时长(ms) |
| `recording` | `Ref<boolean>` | 是否正在录音 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `start` | `(options?) => Promise<boolean>` | 开始录音 |
| `stop` | `() => Promise<Blob \| null>` | 停止并返回结果 |
| `pause` | `() => void` | 暂停 |
| `resume` | `() => void` | 恢复 |

## 限制录音时长

```ts
const { start, stop } = useAudioRecorder({ maxDuration: 60000 }); // 最长 60 秒
```

到达时限后自动调用 `stop()`。

## 自动清理

组件卸载时自动停止录音并释放麦克风。
