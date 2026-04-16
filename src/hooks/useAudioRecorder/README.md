# useAudioRecorder

录音 Hook — 基于 MediaRecorder API，支持暂停/恢复。

## 用法

```ts
import { useAudioRecorder } from "@robot/h5-core/hooks";

const { isRecording, isPaused, duration, error, start, stop, pause, resume } = useAudioRecorder();

await start();
// 录音中...
pause();
resume();
const blob = await stop();
// blob = Blob { type: 'audio/webm;codecs=opus' }
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
| `mimeType` | `string` | 音频格式，默认自动选择最佳 |
| `audioBitsPerSecond` | `number` | 音频比特率 |

## 注意事项

- **HTTPS 必需**：`getUserMedia` 要求安全上下文
- **权限请求**：首次使用会弹出麦克风授权，可配合 `usePermission` 预请求
- **组件卸载自动清理**：自动停止录音并释放 MediaStream
- **格式兼容性**：优先使用 `audio/webm;codecs=opus`，不支持时降级到 `audio/ogg` 或 `audio/mp4`
- **iOS Safari**：不支持 `audio/webm`，需要 `audio/mp4` 格式

## 测试说明

- 单元测试环境（happy-dom）**无 MediaRecorder API**，仅能测试初始状态
- **必须在真实浏览器中测试录音功能**（推荐 Chrome DevTools + Playwright）
- 建议通过 E2E 测试验证：录音→暂停→恢复→停止→播放 完整流程
