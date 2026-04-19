# useFileDownload

文件下载 Hook — 支持流式进度跟踪、取消下载、自动触发浏览器保存。

## 基本用法

```ts
import { useFileDownload } from "@robot/h5-core";

const { progress, downloading, error, download, abort } = useFileDownload();

const file = await download("https://example.com/report.pdf");
// progress.value → { loaded, total, percent }
```

## 高级用法

```ts
// 自定义请求头 + 携带 Cookie
const { download, abort, progress } = useFileDownload({
  withCredentials: true,
  headers: () => ({
    Authorization: `Bearer ${getToken()}`,
  }),
});

// 指定保存文件名
await download("/api/export/report", "月度报表.xlsx");

// 进度条展示
// progress.value.percent → 0~100

// 取消下载
abort();
```

## 文件名推断

下载时按以下优先级确定文件名：

1. 调用时显式指定的 `filename` 参数
2. 响应头 `Content-Disposition` 中的 `filename*`（UTF-8 编码）
3. 响应头 `Content-Disposition` 中的 `filename`
4. URL 路径末段（如 `/files/report.pdf` → `report.pdf`）
5. 自动生成 `download-{timestamp}`

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `progress` | `Ref<DownloadProgress>` | `{ loaded, total, percent }` |
| `downloading` | `Ref<boolean>` | 下载中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `download()` | `(url: string, filename?: string) => Promise<File \| null>` | 执行下载 |
| `abort()` | `() => void` | 取消下载 |

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `headers` | `Record<string, string> \| () => Record<string, string>` | — | 自定义请求头 |
| `withCredentials` | `boolean` | `false` | 是否携带 Cookie |
