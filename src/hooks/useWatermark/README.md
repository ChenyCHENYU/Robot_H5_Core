# useWatermark

图片水印 Hook — 在图片上叠加文字水印（时间/地点/人员等）。

## 基本用法

```ts
import { useWatermark } from "@robot/h5-core";

const { loading, error, addWatermark } = useWatermark({
  text: "张三 · 2024-01-01 · 生产车间",
});

const watermarked = await addWatermark(photoFile);
// watermarked → 带水印的 File 对象
```

## 高级用法

```ts
// 完整配置
const { addWatermark } = useWatermark({
  text: "张三 · 生产车间",
  fontSize: 20,
  fontColor: "#ffffff",
  position: "bottomRight",  // 'topLeft'|'topRight'|'bottomLeft'|'bottomRight'|'center'
  opacity: 0.8,
  outputType: "image/jpeg",  // 输出格式（默认保留原图格式）
  quality: 0.85,             // 输出质量 0-1（默认 0.92）
});

// 调用时覆盖参数（动态水印文字）
const result = await addWatermark(file, {
  text: `${userName} · ${formatDate(new Date())} · ${location}`,
  position: "topLeft",
});

// 配合 useCamera + useLocation 实现巡检拍照水印
const { capture } = useCamera();
const { getCurrentPosition } = useLocation();
const { addWatermark } = useWatermark();

const photo = await capture();
const pos = await getCurrentPosition();
if (photo && pos) {
  const text = `巡检员: 张三 | ${new Date().toLocaleString()} | ${pos.latitude},${pos.longitude}`;
  const result = await addWatermark(photo, { text });
}
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
| `position` | `string` | `'bottomRight'` | 水印位置 |
| `opacity` | `number` | `0.8` | 透明度 0-1 |
| `outputType` | `string` | 原图格式 | 输出 MIME 类型 |
| `quality` | `number` | `0.92` | 输出质量 0-1 |

## 注意事项

- 水印通过 Canvas 绘制，使用系统 `sans-serif` 字体
- 默认保留原图格式输出，可通过 `outputType` 指定（如 `image/jpeg`）
- 适用于隐患随手拍、巡检拍照、现场签到等场景
