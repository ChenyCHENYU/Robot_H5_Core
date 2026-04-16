# usePermission

系统权限查询/请求 Hook — 统一封装浏览器权限 API。

## 用法

```ts
import { usePermission } from "@robot/h5-core/hooks";

const { state, loading, error, query, request } = usePermission();

// 查询权限状态
const status = await query("camera"); // 'granted' | 'denied' | 'prompt'

// 请求权限（会触发浏览器授权弹窗）
const granted = await request("camera");
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `state` | `Ref<PermissionState \| null>` | 当前权限状态 |
| `loading` | `Ref<boolean>` | 查询/请求中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `query()` | `(name) => Promise<PermissionState>` | 查询权限状态 |
| `request()` | `(name) => Promise<boolean>` | 请求权限 |

## 支持的权限类型

| 权限名 | 请求方式 | 说明 |
|--------|----------|------|
| `camera` | getUserMedia({video}) | 摄像头 |
| `microphone` | getUserMedia({audio}) | 麦克风 |
| `geolocation` | getCurrentPosition() | 地理位置 |
| `notifications` | Notification.requestPermission() | 通知 |
| `clipboard-read` | Permissions API query | 剪贴板读取 |
| `clipboard-write` | Permissions API query | 剪贴板写入 |

## 注意事项

- **clipboard-read/write**：仅支持查询（query），浏览器不提供主动请求 API
- **权限持久化**：浏览器授权/拒绝会记忆，拒绝后需用户手动在设置中恢复
- **不同浏览器差异**：Firefox 不支持 `camera`/`microphone` 的 Permissions API query
- **request 即触发**：`request('camera')` 会打开摄像头再立即关闭，仅用于触发授权弹窗

## 测试说明

- 单元测试通过 Mock Permissions API + getUserMedia 验证查询/请求/错误
- **权限弹窗交互需要在真实浏览器中测试**（自动化测试可用 Playwright 设置权限策略）
