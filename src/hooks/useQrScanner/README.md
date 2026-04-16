# useQrScanner

二维码 / 条形码扫描。

## 引入

```ts
import { useQrScanner } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { result, loading, error, scan, clear } = useQrScanner();
</script>

<template>
  <button @click="scan()" :disabled="loading">扫码</button>
  <p v-if="result">结果: {{ result }}</p>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'qrcode' \| 'barcode' \| 'all'` | `'all'` | 扫码类型 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `result` | `Ref<string>` | 扫描结果 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `scan` | `(options?) => Promise<string \| null>` | 执行扫码 |
| `clear` | `() => void` | 清空结果 |

## 扩展

```ts
extendHook("useQrScanner", {
  after: (code, ctx) => {
    // 扫码后自动查询商品信息
    ctx.meta.product = lookupProduct(code);
    return code;
  },
});
```
