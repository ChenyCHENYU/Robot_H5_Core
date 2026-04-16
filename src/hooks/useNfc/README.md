# useNfc

NFC 读卡 / 写卡。

## 引入

```ts
import { useNfc } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { data, loading, error, read, write, clear } = useNfc();
</script>

<template>
  <button @click="read()" :disabled="loading">读取 NFC</button>
  <pre v-if="data">{{ data }}</pre>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `timeout` | `number` | `10000` | 读取超时(ms) |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `Ref<NFCData \| null>` | 读取到的 NFC 数据 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `read` | `() => Promise<NFCData \| null>` | 读取 NFC |
| `write` | `(data: NFCData) => Promise<boolean>` | 写入 NFC |
| `clear` | `() => void` | 清空数据 |

## NFCData 类型

```ts
interface NFCData {
  id: string;
  type: string;
  records: Array<{ type: string; data: string }>;
}
```
