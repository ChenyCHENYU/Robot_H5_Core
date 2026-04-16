# useSignature

Canvas 手写签名板。

## 引入

```ts
import { useSignature } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const canvasRef = ref<HTMLCanvasElement>();
const { signature, isEmpty, bindCanvas, clear, undo, toDataURL, toFile } = useSignature();

function onMounted() {
  if (canvasRef.value) bindCanvas(canvasRef.value);
}

async function save() {
  const file = await toFile("my-signature.png");
  // 上传 file...
}
</script>

<template>
  <canvas ref="canvasRef" @vue:mounted="onMounted" />
  <button @click="undo" :disabled="isEmpty">撤销</button>
  <button @click="clear">清除</button>
  <button @click="save" :disabled="isEmpty">保存</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `600` | 画布宽度 |
| `height` | `number` | `300` | 画布高度 |
| `penColor` | `string` | `'#000000'` | 线条颜色 |
| `penWidth` | `number` | `2` | 线条宽度 |
| `backgroundColor` | `string` | `'#ffffff'` | 背景色 |
| `outputType` | `string` | `'image/png'` | 导出格式 |
| `quality` | `number` | `0.92` | 导出质量(jpeg/webp) |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `signature` | `Ref<string>` | 签名 base64 |
| `isEmpty` | `Ref<boolean>` | 是否为空画布 |
| `bindCanvas` | `(el: HTMLCanvasElement) => void` | 绑定 canvas 元素 |
| `clear` | `() => void` | 清除画布 |
| `undo` | `() => void` | 撤销上一笔 |
| `toDataURL` | `() => string` | 导出 base64 |
| `toFile` | `(fileName?) => Promise<File>` | 导出 File 对象 |

## 自动清理

组件卸载时自动移除 canvas 事件监听。
