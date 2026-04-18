# useQrScanner

二维码/条形码扫描 Hook。

## 基本用法

```ts
import { useQrScanner } from "@robot/h5-core";

const { result, loading, error, scan } = useQrScanner();

const text = await scan();
// text → 扫码内容字符串
```

## 高级用法

```ts
// 指定码类型
const { scan } = useQrScanner({ type: "barcode" });

// 调用时覆盖
const text = await scan({ type: "all" }); // 同时识别二维码和条形码

// 浏览器环境下通过 overrides 注入 jsQR 实现
defineAppConfig(app, {
  bridge: {
    overrides: {
      scanner: {
        async scan() {
          // 接入 jsQR 或其他前端扫码库
          return await jsQRScan();
        },
      },
    },
  },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `result` | `Ref<string>` | 扫码结果 |
| `loading` | `Ref<boolean>` | 扫码中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `scan()` | `(options?) => Promise<string \| null>` | 执行扫码 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'qrcode' \| 'barcode' \| 'all'` | `'qrcode'` | 码类型 |

## 注意事项

- 浏览器无原生扫码能力，BrowserBridge 会抛错提示接入 jsQR
- APP/钉钉/微信通过 Bridge 调用原生扫码
- 建议通过 `overrides` 或 `registerAdapter` 注入前端扫码实现
