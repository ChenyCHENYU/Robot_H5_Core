# usePermission

权限查询与请求 Hook — 统一管理设备/浏览器权限状态。

## 基本用法

```ts
import { usePermission } from "@robot/h5-core";

const { state, loading, error, query, request } = usePermission();

const status = await query("camera");
// status → 'granted' | 'denied' | 'prompt'

const granted = await request("camera");
// granted → true/false
```

## 高级用法

```ts
// 拍照前先请求权限
import { usePermission, useCamera } from "@robot/h5-core";

const { state, request, watch } = usePermission();
const { capture } = useCamera();

// 实时监听权限变化（返回取消函数）
const stopWatch = watch("camera");
// state.value 会随浏览器权限设置实时更新
// 不需要时调用 stopWatch() 取消监听

// 条件拍照
async function takePhoto() {
  const granted = await request("camera");
  if (!granted) {
    alert("请在系统设置中允许相机权限");
    return;
  }
  return await capture();
}

// 一次检查多个权限
async function checkAllPermissions() {
  const cam = await request("camera");
  const mic = await request("microphone");
  const loc = await request("geolocation");
  return { cam, mic, loc };
}
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `state` | `Ref<PermissionState \| null>` | 当前权限状态 |
| `loading` | `Ref<boolean>` | 查询中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `query()` | `(name: string) => Promise<PermissionState>` | 查询权限状态 |
| `request()` | `(name: string) => Promise<boolean>` | 请求权限 |
| `watch()` | `(name: PermissionName) => () => void` | 监听权限状态变化，返回取消函数 |

## 注意事项

- `query` 仅查询状态，不触发权限弹窗
- `request` 会触发浏览器权限弹窗（首次请求时）
- `watch` 基于 `permissions.onchange` 事件，不支持该 API 的浏览器将静默降级
- iOS Safari 对 `navigator.permissions` 支持有限，自动降级
