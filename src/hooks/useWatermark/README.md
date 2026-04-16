# useWatermark

拍照水印（时间+地点+人员） + 页面防截屏水印。

## 引入

```ts
import { useWatermark } from "@robot/h5-core/hooks";
```

## 基本用法 — 图片水印

```vue
<script setup lang="ts">
const { addWatermark, loading } = useWatermark({
  texts: ["张三", "巡检员"],
  showTime: true,
});

async function onPhoto(file: File) {
  const watermarked = await addWatermark(file);
  // 上传 watermarked...
}
</script>
```

## 基本用法 — 页面防截屏水印

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const containerRef = ref<HTMLElement>();
const { createPageWatermark } = useWatermark();

onMounted(() => {
  if (containerRef.value) {
    createPageWatermark(containerRef.value, {
      texts: ["张三 2025-01-01"],
      showTime: false,
    });
  }
});
</script>

<template>
  <div ref="containerRef">
    <!-- 页面内容 -->
  </div>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `texts` | `string[]` | `[]` | 水印文字（每行一条） |
| `showTime` | `boolean` | `true` | 是否包含时间 |
| `timeFormat` | `string` | `'YYYY-MM-DD HH:mm:ss'` | 时间格式 |
| `showLocation` | `boolean` | `false` | 是否包含位置 |
| `fontSize` | `number` | `14` | 字体大小(px) |
| `fontColor` | `string` | `'#ffffff'` | 字体颜色 |
| `position` | `string` | `'bottom-left'` | 文字位置 |
| `backgroundColor` | `string` | `'rgba(0,0,0,0.5)'` | 文字背景色 |
| `padding` | `number` | `10` | 内边距 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `addWatermark` | `(file, options?) => Promise<File \| null>` | 给图片加水印 |
| `createPageWatermark` | `(el, options?) => () => void` | 创建页面水印层，返回清理函数 |

## 防截屏

`createPageWatermark` 创建的水印层使用 `MutationObserver` 监听 DOM 删除，被移除后自动恢复。
