# useCamera

拍照/相册 + 自动压缩 Hook。

## 基本用法

```ts
import { useCamera } from "@robot/h5-core";

const { photo, preview, loading, error, capture, clear } = useCamera();

await capture();
// photo.value → File 对象
// preview.value → ObjectURL 可直接绑定 <img :src="preview">
```

## 高级用法

```ts
// 指定来源和压缩参数
const { capture } = useCamera({
  source: "camera",  // 'camera' | 'album' | 'both'（默认）
  maxSize: 500,      // 压缩目标 KB（默认 1024）
  quality: 0.7,      // 压缩质量 0-1（默认 0.8）
});

// 调用时覆盖默认参数
await capture({ source: "album", maxSize: 200 });

// 配合 useWatermark 拍照+水印
const { addWatermark } = useWatermark({ text: "张三 · 生产车间" });
const file = await capture();
if (file) await addWatermark(file);

// 通过 extendHook 自动上传 OSS
extendHook("useCamera", {
  after: async (file, ctx) => {
    ctx.meta.ossUrl = await uploadToOss(file);
    return file;
  },
});
```

## 全局配置

```ts
defineAppConfig(app, {
  image: { maxSize: 500, quality: 0.7, maxWidth: 1920 },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `photo` | `Ref<File \| null>` | 拍照/选图结果 |
| `preview` | `Ref<string>` | 预览 URL（ObjectURL） |
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `capture()` | `(options?) => Promise<File \| null>` | 执行拍照 |
| `clear()` | `() => void` | 清除照片和预览 |

## 注意事项

- 连续拍照自动释放旧 ObjectURL，组件卸载时自动清理
- 文件已小于 maxSize 则跳过压缩
- 浏览器降级通过 `<input type="file">`；APP/钉钉/微信通过 Bridge 调用原生相机
