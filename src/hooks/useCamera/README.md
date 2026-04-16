# useCamera

拍照/相册 + 自动压缩 Hook。

## 用法

```ts
import { useCamera } from "@robot/h5-core/hooks";

const { photo, preview, loading, error, capture, clear } = useCamera({
  source: "both",   // 'camera' | 'album' | 'both'
  maxSize: 1024,     // 压缩目标 KB
  quality: 0.8,      // 0-1
});

// 拍照
await capture();
// capture({ source: 'camera' }) 可覆盖默认参数
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

## 配置

通过 `defineAppConfig` 的 `image` 字段全局配置：

```ts
defineAppConfig(app, {
  image: { maxSize: 500, quality: 0.7, maxWidth: 1920 },
});
```

## 扩展

```ts
extendHook("useCamera", {
  after: async (file, ctx) => {
    ctx.meta.ossUrl = await uploadToOss(file);
    return file;
  },
});
```

## 注意事项

- **内存管理**：连续拍照时自动释放旧的 ObjectURL，组件卸载时自动清理
- **压缩**：基于 `OffscreenCanvas + createImageBitmap`，如文件已小于 maxSize 则跳过
- **浏览器降级**：通过 `<input type="file">` 实现，移动端会自动弹出相机/相册选择

## 测试说明

- 单元测试通过 Mock Bridge 覆盖核心流程
- **真机测试建议**：不同手机的相机分辨率和 EXIF 方向可能影响压缩结果，建议在 iOS Safari 和 Android Chrome 上验证
