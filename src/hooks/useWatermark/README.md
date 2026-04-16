# useWatermark

图片水印 Hook — 在图片上叠加文字水印（时间/地点/人员等）。

## 用法

```ts
import { useWatermark } from "@robot/h5-core/hooks";

const { loading, error, addWatermark } = useWatermark({
  text: "张三 · 2024-01-01 · 生产车间",
  fontSize: 16,
  fontColor: "#ffffff",
  position: "bottomRight",
  opacity: 0.8,
});

const watermarked = await addWatermark(photoFile);
// watermarked = File（含水印的 JPEG）
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `loading` | `Ref<boolean>` | 处理中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `addWatermark()` | `(file: File, options?) => Promise<File \| null>` | 添加水印 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | `''` | 水印文字 |
| `fontSize` | `number` | `16` | 字号 |
| `fontColor` | `string` | `#ffffff` | 字色 |
| `position` | `string` | `'bottomRight'` | 位置：topLeft/topRight/bottomLeft/bottomRight/center |
| `opacity` | `number` | `0.8` | 透明度 0-1 |

## 注意事项

- **字体加载**：Canvas 使用系统默认 sans-serif 字体，如需自定义字体建议等待 `document.fonts.ready`
- **高 DPI**：在 Retina 屏幕上水印可能偏小，可根据 `devicePixelRatio` 调整 fontSize
- **输出格式**：固定输出 JPEG 格式（quality=0.92），如需 PNG 可通过扩展实现
- **配合 useCamera**：可先拍照再添加水印，适用于隐患随手拍、巡检拍照等场景

## 测试说明

- 单元测试通过 Mock Canvas API 验证核心逻辑
- **字体渲染效果需要在真实浏览器中验证**（不同设备字体渲染可能有差异）
