# useSignature

Canvas 手写签名 Hook — 支持触屏和鼠标。

## 基本用法

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSignature } from "@robot/h5-core";

const canvasRef = ref<HTMLCanvasElement>();
const { isEmpty, bindCanvas, clear, save, undo } = useSignature();

onMounted(() => bindCanvas(canvasRef.value!));

async function handleSave() {
  const file = await save();
  // file → File 对象（PNG 格式）
}
</script>

<template>
  <canvas ref="canvasRef" width="600" height="300" />
  <button @click="handleSave" :disabled="isEmpty">保存</button>
  <button @click="undo">撤销</button>
  <button @click="clear">清除</button>
</template>
```

## 高级用法

```ts
// 自定义画笔样式
const { save } = useSignature({
  lineWidth: 3,
  strokeColor: "#1a1a1a",
  backgroundColor: "#f5f5f5",
});

// 保存为 JPEG（更小体积）
const file = await save("image/jpeg", 0.85);
// file.name → "signature-1714000000000.jpeg"

// 保存后直接上传
const { upload } = useFileUpload();
const signFile = await save();
if (signFile) await upload(signFile);
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isEmpty` | `Ref<boolean>` | 是否空白画布 |
| `bindCanvas()` | `(el: HTMLCanvasElement) => void` | 绑定画布 |
| `clear()` | `() => void` | 清除签名 |
| `save()` | `(type?, quality?) => Promise<File \| null>` | 导出为 File |
| `undo()` | `() => void` | 撤销最后一笔 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `lineWidth` | `number` | `2` | 画笔宽度 |
| `strokeColor` | `string` | `#000000` | 画笔颜色 |
| `backgroundColor` | `string` | `#ffffff` | 背景色 |

## 注意事项

- 同时监听 mouse 和 touch 事件，桌面端和移动端均可用
- `save()` 的 `type` 参数支持 `image/png`（默认）、`image/jpeg` 等，文件扩展名自动从 type 派生
- 高 DPI 屏幕建议 canvas 尺寸乘以 `devicePixelRatio`
- 组件卸载自动清理事件监听
- `isEmpty` 为 `true` 时 `save()` 返回 `null`
