# useOfflineStorage

离线存储 Hook — 基于 IndexedDB 的 KV 存储。

## 用法

```ts
import { useOfflineStorage } from "@robot/h5-core/hooks";

const { loading, error, get, set, remove, clear, keys } = useOfflineStorage({
  dbName: "my-app-storage",
  storeName: "cache",
});

await set("user", { name: "张三", role: "admin" });
const user = await get("user");
const allKeys = await keys();
await remove("user");
await clear();
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `get()` | `<T>(key: string) => Promise<T \| null>` | 读取数据 |
| `set()` | `(key: string, value: any) => Promise<void>` | 写入数据 |
| `remove()` | `(key: string) => Promise<void>` | 删除数据 |
| `clear()` | `() => Promise<void>` | 清空所有数据 |
| `keys()` | `() => Promise<string[]>` | 获取所有键 |

## Options

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dbName` | `string` | `'h5-core-storage'` | 数据库名称 |
| `storeName` | `string` | `'kv-store'` | 存储仓库名称 |

## 注意事项

- **Safari 隐私模式**：IndexedDB 有 50MB 限制，且浏览器可能在存储压力下清理数据
- **SSR 环境**：`indexedDB` 不存在，会返回明确错误
- **数据序列化**：IndexedDB 支持结构化克隆，可存储对象/数组/File/Blob 等
- **无自动同步**：当前版本仅提供本地存储，如需在线同步需在项目侧实现

## 测试说明

- 单元测试通过 Mock IndexedDB 验证 CRUD 操作和错误处理
- **happy-dom 对 IndexedDB 支持有限**，建议使用 fake-indexeddb 库增强测试
- 生产环境建议验证：大量数据读写性能、Safari 隐私模式兼容性
