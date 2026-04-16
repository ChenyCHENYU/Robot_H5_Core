# useNfc

NFC 读写 Hook。

## 用法

```ts
import { useNfc } from "@robot/h5-core/hooks";

const { data, loading, error, read, write } = useNfc();

// 读取
const nfcData = await read();
// nfcData = { id: 'abc', type: 'NDEF', records: [...] }

// 写入
await write({ id: '', type: 'NDEF', records: [{ type: 'text', data: '点检区域A' }] });
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `data` | `Ref<NFCData \| null>` | 读取的 NFC 数据 |
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `read()` | `() => Promise<NFCData \| null>` | 读取 NFC |
| `write()` | `(data: NFCData) => Promise<boolean>` | 写入 NFC |

## 注意事项

- **Web NFC**：仅 Chrome Android 96+ 支持，且需要 HTTPS
- **iOS 完全不支持 Web NFC**，必须通过 Native Bridge
- **浏览器降级**：BrowserBridge 直接抛出"不支持"错误
- 实际使用场景（如设备点检刷卡）必须在 APP 环境中运行

## 测试说明

- 单元测试通过 Mock Bridge 验证调用链和错误处理
- **NFC 无法在模拟器中测试**，必须使用支持 NFC 的真实设备（如 Android 手机 + NFC 标签）
- 建议在集成测试阶段使用实体 NFC 标签在真机上验证读写功能
