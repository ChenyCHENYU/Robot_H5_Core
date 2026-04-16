# usePermission

系统权限请求与查询。

## 引入

```ts
import { usePermission } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { status, query, request, queryAll } = usePermission();

onMounted(async () => {
  await queryAll(["camera", "microphone", "geolocation"]);
});
</script>

<template>
  <p>相机: {{ status.camera ?? '未查询' }}</p>
  <p>麦克风: {{ status.microphone ?? '未查询' }}</p>
  <button @click="request('camera')">请求相机权限</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoRequest` | `boolean` | `false` | 查询为 prompt 时自动请求 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `status` | `Ref<Record<string, PermissionStatus>>` | 各权限状态 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `query` | `(name) => Promise<PermissionStatus>` | 查询单个权限 |
| `request` | `(name) => Promise<PermissionStatus>` | 请求权限 |
| `queryAll` | `(names) => Promise<Record>` | 批量查询 |

## 支持的权限

| 名称 | 说明 |
|------|------|
| `camera` | 摄像头 |
| `microphone` | 麦克风 |
| `geolocation` | 地理位置 |
| `notifications` | 通知 |
| `clipboard-read` | 剪贴板读取 |
| `clipboard-write` | 剪贴板写入 |

## PermissionStatus

- `granted` — 已授权
- `denied` — 已拒绝
- `prompt` — 待询问
- `unsupported` — 浏览器不支持

## 权限请求方式

`request()` 通过调用相关 Web API 触发浏览器权限弹窗：
- `camera` → `getUserMedia({ video: true })`
- `microphone` → `getUserMedia({ audio: true })`
- `geolocation` → `getCurrentPosition()`
- `notifications` → `Notification.requestPermission()`
