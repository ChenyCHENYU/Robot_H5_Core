# useQrScanner

二维码/条形码扫描 Hook。

## 用法

```ts
import { useQrScanner } from "@robot/h5-core/hooks";

const { result, loading, error, scan } = useQrScanner({ type: "qrcode" });

const text = await scan();
// text = "https://example.com"
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

- **浏览器不支持原生扫码**：BrowserBridge 会直接抛出错误，提示接入 jsQR 等第三方库
- **APP/钉钉/微信**：通过 Bridge 调用原生扫码，体验最佳
- 建议项目侧通过 `registerAdapter` 注入集成了 jsQR 的自定义 BrowserBridge 以支持纯 Web 扫码

## 测试说明

- 单元测试通过 Mock Bridge 验证调用链
- **真机测试建议**：不同码的识别率受相机质量影响，建议在真实设备上测试条形码和低对比度二维码的识别
