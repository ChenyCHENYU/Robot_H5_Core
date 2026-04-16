# useFilePreview

PDF/Office/图片在线预览 Hook。

## 用法

```ts
import { useFilePreview } from "@robot/h5-core/hooks";

const { loading, error, preview } = useFilePreview({
  previewServer: "https://preview.example.com/onlinePreview",
});

await preview("https://oss.example.com/report.docx", "report.docx");
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `loading` | `Ref<boolean>` | 加载中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `preview()` | `(url: string, name?: string) => Promise<void>` | 打开预览 |

## Options

| 参数 | 类型 | 说明 |
|------|------|------|
| `previewServer` | `string` | Office 文件预览服务地址（如 OnlyOffice / LibreOffice Online） |

## 注意事项

- **浏览器降级**：BrowserBridge 使用 `window.open()` 打开新标签页
- **Office 文件**：需要配置 `previewServer`，否则直接下载而非预览
- **PDF**：大部分浏览器原生支持 PDF 预览，无需 previewServer
- **APP 环境**：通过 Native Bridge 调用原生文档查看器，体验更佳

## 测试说明

- 单元测试通过 Mock Bridge 验证 URL 拼接和调用链
- **集成测试建议**：需要部署 Office 预览服务，测试 .docx/.xlsx/.pptx 等格式的实际预览效果
