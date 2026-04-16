# useFileUpload

分片上传 + 进度条 + 文件校验。

## 引入

```ts
import { useFileUpload } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { progress, uploading, error, result, upload, abort } = useFileUpload();

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) await upload(file);
}
</script>

<template>
  <input type="file" @change="handleUpload" :disabled="uploading" />
  <p v-if="uploading">{{ progress.percent }}%</p>
  <button v-if="uploading" @click="abort">取消</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `action` | `string` | 全局配置 | 上传接口 URL |
| `chunkSize` | `number` | `2MB` | 分片大小(bytes)，小于此值直传 |
| `headers` | `Record \| () => Record` | `{}` | 自定义请求头 |
| `maxFileSize` | `number` | `0` | 最大文件大小(bytes)，0 = 不限 |
| `accept` | `string[]` | `[]` | 允许的 MIME 类型 |
| `compressImage` | `boolean` | `false` | 是否自动压缩图片 |
| `concurrency` | `number` | `3` | 并发分片数 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `progress` | `Ref<UploadProgress>` | 上传进度 `{ loaded, total, percent }` |
| `uploading` | `Ref<boolean>` | 是否正在上传 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `result` | `Ref<any>` | 服务端响应 |
| `upload` | `(file, options?) => Promise<any>` | 执行上传 |
| `abort` | `() => void` | 取消上传 |

## 全局配置

```ts
defineAppConfig(app, {
  upload: {
    action: "/api/file/upload",
    chunkSize: 5 * 1024 * 1024,
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
  },
});
```

## 分片逻辑

- 文件大小 ≤ `chunkSize`：单次 POST（FormData）
- 文件大小 > `chunkSize`：按 `chunkSize` 分片依次上传，附带 `chunkIndex`、`totalChunks`、`fileName`、`fileSize`
