# useOfflineStorage

离线存储 Hook — 基于 IndexedDB 的 KV 存储。

## 基本用法

```ts
import { useOfflineStorage } from "@robot/h5-core";

const { loading, error, get, set, remove } = useOfflineStorage();

await set("user", { name: "张三", role: "admin" });
const user = await get<{ name: string; role: string }>("user");
await remove("user");
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

// 离线表单草稿场景
async function saveDraft(formId: string, data: Record<string, any>) {
  await set(`draft-${formId}`, { ...data, savedAt: Date.now() });
}
async function loadDraft(formId: string) {
  return await get(`draft-${formId}`);
}
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

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dbName` | `string` | `'h5-core-storage'` | 数据库名 |
| `storeName` | `string` | `'kv-store'` | 存储仓库名 |

## 注意事项

- Safari 隐私模式下 IndexedDB 有 50MB 限制且可能被清理
- SSR 环境 `indexedDB` 不存在，会返回明确错误
- 支持结构化克隆（对象、数组、File、Blob 等）
- 组件卸载时自动关闭 IDB 连接
