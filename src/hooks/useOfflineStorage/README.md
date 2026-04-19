# useOfflineStorage

离线存储 Hook — 基于 IndexedDB 的 KV 存储，支持可选的在线同步队列。

## 基本用法

```ts
import { useOfflineStorage } from "@robot-h5/core";

const { loading, error, get, set, remove } = useOfflineStorage();

await set("user", { name: "张三", role: "admin" });
const user = await get<{ name: string; role: string }>("user");
await remove("user");
```

## 在线同步队列

配置 `sync` 后，所有写操作（set / remove / clear）自动入队，网络恢复后批量推送到服务端。

```ts
const {
  get, set, remove,
  pendingCount,   // 待同步操作数
  syncStatus,     // 'idle' | 'syncing' | 'error'
  flush,          // 手动触发同步
} = useOfflineStorage({
  sync: {
    endpoint: "/api/offline/sync",
    headers: () => ({ Authorization: `Bearer ${getToken()}` }),
    autoSync: true, // 网络恢复后自动同步（默认 true）
  },
});

// 离线写入 → 自动入队
await set("draft-001", { title: "草稿", content: "..." });
console.log(pendingCount.value); // 1

// 手动触发同步
await flush();
console.log(pendingCount.value); // 0
```

服务端接收的请求体：

```json
{
  "operations": [
    { "op": "set", "key": "draft-001", "value": {...}, "timestamp": 1713500000000 },
    { "op": "remove", "key": "old-key", "timestamp": 1713500001000 }
  ]
}
```

## 高级用法

```ts
// 自定义数据库和仓库名
const { get, set, clear, keys, close } = useOfflineStorage({
  dbName: "my-app-cache",
  storeName: "form-drafts",
});

// 获取所有键
const allKeys = await keys();

// 清空所有数据
await clear();

// 手动关闭连接（组件卸载时也会自动关闭）
close();
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `get()` | `<T>(key: string) => Promise<T \| null>` | 读取值 |
| `set()` | `(key: string, value: any) => Promise<void>` | 写入值 |
| `remove()` | `(key: string) => Promise<void>` | 删除键 |
| `clear()` | `() => Promise<void>` | 清空所有数据 |
| `keys()` | `() => Promise<string[]>` | 获取所有键名 |
| `close()` | `() => void` | 手动关闭 IDB 连接 |
| `pendingCount` | `Ref<number>` | 待同步操作数量 |
| `syncStatus` | `Ref<'idle' \| 'syncing' \| 'error'>` | 同步状态 |
| `flush()` | `() => Promise<void>` | 立即推送同步队列 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dbName` | `string` | `'h5-core-storage'` | 数据库名 |
| `storeName` | `string` | `'kv-store'` | 存储仓库名 |
| `sync` | `SyncConfig` | — | 在线同步配置（可选） |

### SyncConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `endpoint` | `string` | — | 同步接口 URL（必填） |
| `headers` | `Record \| () => Record` | `{}` | 请求头 |
| `autoSync` | `boolean` | `true` | 网络恢复后自动同步 |

## 注意事项

- Safari 隐私模式下 IndexedDB 有 50MB 限制且可能被清理
- SSR 环境 `indexedDB` 不存在，会返回明确错误
- 支持结构化克隆（对象、数组、File、Blob 等）
- 组件卸载时自动关闭 IDB 连接 + 移除 online 监听
- 同步队列使用 localStorage 持久化，页面刷新不丢失
