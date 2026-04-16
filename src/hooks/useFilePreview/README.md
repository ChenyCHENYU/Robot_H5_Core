# useFilePreview

PDF / Office / 图片在线预览。

## 引入

```ts
import { useFilePreview } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { loading, error, preview } = useFilePreview();
</script>

<template>
  <button @click="preview('https://example.com/doc.pdf', 'doc.pdf')">
    预览文件
  </button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'bridge' \| 'iframe' \| 'window'` | `'bridge'` | 预览方式 |
| `previewServer` | `string` | — | Office 预览服务地址 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `preview` | `(url, name?, options?) => Promise<boolean>` | 执行预览 |

## 预览模式

- **bridge**（默认）：调用宿主 APP / 钉钉 / 微信的原生预览
- **iframe**：对 Office 文件拼接预览服务地址，图片/PDF 直接打开
- **window**：新窗口打开文件 URL

## 接入预览服务

```ts
const { preview } = useFilePreview({
  mode: "iframe",
  previewServer: "https://preview.example.com/onlinePreview",
});

// Office 文件会自动拼接: https://preview.example.com/onlinePreview?url=...
preview("https://cdn.example.com/report.docx", "report.docx");
```
