# useSignature

Canvas 手写签名 Hook — 支持触屏和鼠标绘制。

## 用法

```vue
<template>
  <canvas ref="canvasRef" width="600" height="300" />
  <button @click="clear">清除</button>
  <button @click="undo">撤销</button>
  <button @click="handleSave">保存</button>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useSignature } from "@robot/h5-core/hooks";

const canvasRef = ref();
const { isEmpty, bindCanvas, clear, save, undo } = useSignature({
  lineWidth: 2,
  strokeColor: "#000",
});

onMounted(() => bindCanvas(canvasRef.value));

async function handleSave() {
  const file = await save();
  if (file) {
    // 上传签名文件...
  }
}
</script>
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isEmpty` | `Ref<boolean>` | 是否为空白画布 |
| `bindCanvas()` | `(el: HTMLCanvasElement) => void` | 绑定画布元素 |
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

- **触屏支持**：同时监听 mouse 和 touch 事件，移动端体验良好
- **高 DPI 屏幕**：建议将 canvas 尺寸乘以 `devicePixelRatio` 以获得清晰签名
- **组件卸载自动清理**：自动移除事件监听
- **空签名检查**：`save()` 在 `isEmpty` 为 true 时返回 null

## 测试说明

- 单元测试通过 Mock Canvas API 验证 bindCanvas/clear/undo/save 逻辑
- **真机测试建议**：触屏手写的流畅度和精度需要在真实移动设备上验证，特别是低端设备上的绘制性能
