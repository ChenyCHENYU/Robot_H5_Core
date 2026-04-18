# useNfc

NFC 读写 Hook。

## 基本用法

```ts
import { useNfc } from "@robot/h5-core";

const { data, loading, error, read, write } = useNfc();

// 读取 NFC 标签
const nfcData = await read();

// 写入 NFC 标签
await write({
  id: "",
  type: "NDEF",
  records: [{ type: "text", data: "点检区域A" }],
});
```

## 高级用法

```ts
// 配合 extendHook 实现扫描后自动记录
extendHook("useNfc", {
  after: async (nfcData, ctx) => {
    await reportCheckpoint(nfcData.records[0].data);
    return nfcData;
  },
});

// 通过 overrides 注入原生 NFC 实现
defineAppConfig(app, {
  bridge: {
    overrides: {
      nfc: {
        async read() {
          return await NativeNFC.scan();
        },
        async write(data) {
          await NativeNFC.write(data);
        },
      },
    },
  },
});
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

- Web NFC 仅 Chrome Android 96+ 支持，需 HTTPS
- iOS 完全不支持 Web NFC，必须通过 Native Bridge
- BrowserBridge 降级直接抛出"不支持"错误
