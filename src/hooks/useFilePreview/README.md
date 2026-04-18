# useFilePreview

PDF/Office/图片在线预览 Hook。

## 基本用法

```ts
import { useFilePreview } from "@robot/h5-core";

const { loading, error, preview } = useFilePreview();

await preview("https://oss.example.com/report.pdf");
```

## 高级用法

```ts
// 配置 Office 文件预览服务（LibreOffice Online / OnlyOffice）
const { preview } = useFilePreview({
  previewServer: "https://preview.example.com/onlinePreview",
});

// Office 文件自动拼接预览服务地址
await preview("https://oss.example.com/report.docx", "report.docx");
// 实际打开: https://preview.example.com/onlinePreview?url=https%3A%2F%2Foss...

// 配合 extendHook 记录预览日志
extendHook("useFilePreview", {
  before: async (url, name) => {
    await logPreview(url, name);
    return [url, name];
  },
});
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
| `previewServer` | `string` | Office 文件预览服务地址 |

## 注意事项

- 浏览器降级使用 `window.open()` 打开新标签
- PDF 大部分浏览器原生支持
- Office 文件需配置 `previewServer`
- APP 环境通过 Bridge 调用原生文档查看器
