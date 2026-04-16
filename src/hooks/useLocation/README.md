# useLocation

GPS 单次定位 + 持续监听。

## 引入

```ts
import { useLocation } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { position, loading, error, getCurrentPosition, watchPosition, stopWatch } = useLocation();
</script>

<template>
  <button @click="getCurrentPosition">获取位置</button>
  <p v-if="position">{{ position.longitude }}, {{ position.latitude }}</p>
  <button @click="watchPosition">持续定位</button>
  <button @click="stopWatch">停止</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `timeout` | `number` | `10000` | 定位超时(ms) |
| `enableHighAccuracy` | `boolean` | — | 是否启用高精度 |
| `coordType` | `'gcj02' \| 'wgs84'` | `'gcj02'` | 坐标系 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `position` | `Ref<Coordinates \| null>` | 当前坐标 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `getCurrentPosition` | `() => Promise<Coordinates \| null>` | 单次定位 |
| `watchPosition` | `() => void` | 开始持续监听 |
| `stopWatch` | `() => void` | 停止监听 |

## 全局配置

```ts
defineAppConfig(app, {
  location: { coordType: "gcj02", timeout: 15000 },
});
```

## 自动清理

组件卸载时自动停止监听，无需手动调用 `stopWatch`。
