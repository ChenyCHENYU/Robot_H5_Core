# useFileUpload

分片上传 Hook — 支持进度跟踪、取消上传。

## 用法

```ts
import { useFileUpload } from "@robot/h5-core/hooks";

const { progress, uploading, error, upload, abort } = useFileUpload({
  action: "/api/file/upload",
  chunkSize: 2 * 1024 * 1024,
  headers: () => ({ Authorization: `Bearer ${getToken()}` }),
});

// 上传
const result = await upload(file);

// 取消
abort();
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
| `action` | `string` | 配置中心 | 上传接口地址 |
| `chunkSize` | `number` | `2MB` | 分片大小 |
| `headers` | `Record \| () => Record` | `{}` | 请求头（支持函数动态获取） |
| `withCredentials` | `boolean` | `false` | 是否携带 Cookie |

## 配置

通过 `defineAppConfig` 的 `upload` 字段全局配置：

```ts
defineAppConfig(app, {
  upload: {
    action: "/api/file/upload",
    chunkSize: 2 * 1024 * 1024,
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  },
});
```

## 注意事项

- **分片上传**：文件按 `chunkSize` 切片，每片独立上传并携带 `chunk/chunks/filename` 参数
- **后端协议**：服务端需支持分片接收和合并（FormData 包含 chunk 序号和总片数）
- **取消安全**：`abort()` 通过 AbortController 中断请求，不会导致半成品文件
- **headers 支持函数**：便于动态获取 Token，避免闭包过期

## 测试说明

- 单元测试通过 Mock fetch 验证分片逻辑、进度、取消、错误处理
- **集成测试建议**：需要搭配后端分片接收接口，验证大文件（>100MB）的完整上传和断点续传
