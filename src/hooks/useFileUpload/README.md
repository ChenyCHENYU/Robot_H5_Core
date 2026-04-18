# useFileUpload

分片上传 Hook — 支持进度跟踪、取消上传、失败自动重试。

## 基本用法

```ts
import { useFileUpload } from "@robot/h5-core";

const { progress, uploading, error, upload, abort } = useFileUpload();

const result = await upload(file);
// progress.value → { loaded, total, percent }
```

## 高级用法

```ts
// 自定义上传参数
const { upload, abort } = useFileUpload({
  action: "/api/file/upload",
  chunkSize: 4 * 1024 * 1024,  // 4MB 分片（默认 2MB）
  maxRetries: 5,                // 单片失败重试次数（默认 3）
  withCredentials: true,        // 携带 Cookie
  headers: () => ({
    Authorization: `Bearer ${getToken()}`,
  }),
});

// 配合 useCamera 拍照后上传
const { capture } = useCamera();
const photo = await capture();
if (photo) {
  const result = await upload(photo);
}

// 取消上传
abort();
```

## 全局配置

```ts
defineAppConfig(app, {
  upload: {
    action: "/api/file/upload",
    chunkSize: 2 * 1024 * 1024,
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `progress` | `Ref<UploadProgress>` | `{ loaded, total, percent }` |
| `uploading` | `Ref<boolean>` | 上传中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `upload()` | `(file: File) => Promise<any>` | 执行上传 |
| `abort()` | `() => void` | 取消上传 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `action` | `string` | 全局配置 | 上传接口地址 |
| `chunkSize` | `number` | `2MB` | 分片大小 |
| `headers` | `Record \| () => Record` | `{}` | 请求头（支持函数动态获取） |
| `withCredentials` | `boolean` | `false` | 是否携带 Cookie |
| `maxRetries` | `number` | `3` | 单片上传失败最大重试次数 |

## 注意事项

- 每个分片携带 `fileId` 标识同一文件，后端据此合并
- 分片字段：`file`（分片数据）、`chunk`（片索引）、`chunks`（总片数）、`filename`、`fileId`
- `abort()` 通过 AbortController 中断当前请求
- `headers` 支持函数，每片请求时动态调用（Token 刷新场景）
