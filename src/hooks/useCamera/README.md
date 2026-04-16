# useCamera

拍照/相册选图 + 自动压缩。

## 引入

```ts
import { useCamera } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { photo, preview, loading, error, capture, clear } = useCamera();
</script>

<template>
  <button @click="capture()" :disabled="loading">拍照</button>
  <img v-if="preview" :src="preview" />
  <button v-if="photo" @click="clear">清除</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `source` | `'camera' \| 'album' \| 'both'` | `'both'` | 图片来源 |
| `maxSize` | `number` | `1024` | 最大文件大小(KB)，超过自动压缩 |
| `quality` | `number` | `0.8` | 压缩质量 0-1 |
| `watermark` | `boolean` | `false` | 是否添加水印 |
| `watermarkText` | `string` | — | 水印文字 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `photo` | `Ref<File \| null>` | 拍照结果文件 |
| `preview` | `Ref<string>` | 预览 URL (ObjectURL) |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `capture` | `(options?) => Promise<File \| null>` | 执行拍照，支持临时覆盖配置 |
| `clear` | `() => void` | 清除照片和预览 |

## 全局配置

通过 `defineAppConfig` 设置全局图片参数，所有 `useCamera` 实例共享：

```ts
defineAppConfig(app, {
  image: { maxSize: 500, quality: 0.7, maxWidth: 1280 },
});
```

## 扩展

```ts
import { extendHook } from "@robot/h5-core";

extendHook("useCamera", {
  after: async (file, ctx) => {
    // 拍照后自动上传到 OSS
    ctx.meta.ossUrl = await uploadToOss(file);
    return file;
  },
});
```
