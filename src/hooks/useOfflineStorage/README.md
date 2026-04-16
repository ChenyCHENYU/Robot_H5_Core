# useOfflineStorage

IndexedDB 离线存储 + 在线自动同步。

## 引入

```ts
import { useOfflineStorage } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { online, pendingCount, save, get, remove, sync } = useOfflineStorage({
  syncAction: "/api/sync",
});

async function saveForm(data: any) {
  await save("form-draft", data);
}
</script>

<template>
  <p>{{ online ? '在线' : '离线' }} | 待同步: {{ pendingCount }}</p>
  <button @click="sync">手动同步</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dbName` | `string` | `'h5-core-offline'` | IndexedDB 数据库名 |
| `storeName` | `string` | `'data'` | 存储表名 |
| `version` | `number` | `1` | 数据库版本 |
| `autoSync` | `boolean` | `true` | 上线时自动同步 |
| `syncAction` | `string` | — | 同步接口 URL |
| `syncHeaders` | `Record \| () => Record` | — | 同步请求头 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `online` | `Ref<boolean>` | 是否在线 |
| `pendingCount` | `Ref<number>` | 待同步数量 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `save` | `(key, data) => Promise<boolean>` | 存储数据 |
| `get` | `<T>(key) => Promise<T \| null>` | 读取数据 |
| `remove` | `(key) => Promise<boolean>` | 删除数据 |
| `keys` | `() => Promise<string[]>` | 获取所有 key |
| `sync` | `() => Promise<boolean>` | 手动同步 |
| `clear` | `() => Promise<void>` | 清空存储 |

## 自动同步

配置 `syncAction` 后：
- 每次 `save()` 会记录到同步队列
- 网络恢复时（`autoSync: true`）自动 POST 到 `syncAction`
- 同步成功后清空队列

## 自动清理

组件卸载时自动移除网络状态监听并关闭数据库连接。
