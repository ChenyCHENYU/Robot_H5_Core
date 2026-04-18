# useAudioRecorder

录音 Hook — 基于 MediaRecorder API，支持暂停/恢复。

## 基本用法

```ts
import { useAudioRecorder } from "@robot/h5-core";

const { isRecording, duration, error, start, stop } = useAudioRecorder();

await start();
// duration.value 实时更新（毫秒）
const blob = await stop();
// blob → 音频 Blob 对象
```

## 高级用法

```ts
// 暂停/恢复
const { start, stop, pause, resume, isPaused } = useAudioRecorder();
await start();
pause();   // isPaused.value → true
resume();  // isPaused.value → false，duration 继续累加
const blob = await stop();

// 指定格式和比特率
const { start } = useAudioRecorder({
  mimeType: "audio/mp4",          // iOS Safari 需要 audio/mp4
  audioBitsPerSecond: 128000,
});

// 录音后上传
const { upload } = useFileUpload();
const blob = await stop();
if (blob) {
  const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type });
  await upload(file);
}

// 配合 usePermission 预请求麦克风权限
const { request } = usePermission();
const granted = await request("microphone");
if (granted) await start();
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isRecording` | `Ref<boolean>` | 是否在录音 |
| `isPaused` | `Ref<boolean>` | 是否已暂停 |
| `duration` | `Ref<number>` | 已录制时长（ms） |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `start()` | `() => Promise<void>` | 开始录音 |
| `stop()` | `() => Promise<Blob \| null>` | 停止并返回音频 Blob |
| `pause()` | `() => void` | 暂停录音 |
| `resume()` | `() => void` | 恢复录音 |

## Options

| 参数 | 类型 | 说明 |
|------|------|------|
| `mimeType` | `string` | 音频格式，默认自动选择最佳格式 |
| `audioBitsPerSecond` | `number` | 音频比特率 |

## 注意事项

- HTTPS 必需
- 首次使用弹出麦克风授权，建议配合 `usePermission` 预请求
- 组件卸载自动停止录音并释放 MediaStream
- 格式优先级：`audio/webm;codecs=opus` > `audio/webm` > `audio/ogg` > `audio/mp4`
