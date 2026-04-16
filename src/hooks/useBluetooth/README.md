# useBluetooth

蓝牙设备连接 + 自动重连。

## 引入

```ts
import { useBluetooth } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { device, connected, loading, error, connect, disconnect } = useBluetooth();
</script>

<template>
  <button @click="connect('device-id')" :disabled="loading">连接蓝牙</button>
  <p v-if="connected">已连接: {{ device?.name }}</p>
  <button v-if="connected" @click="disconnect">断开</button>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoReconnect` | `boolean` | `false` | 自动重连 |
| `reconnectInterval` | `number` | `3000` | 重连间隔(ms) |
| `maxReconnectAttempts` | `number` | `3` | 最大重连次数 |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `device` | `Ref<BluetoothDeviceInfo \| null>` | 设备信息 |
| `connected` | `Ref<boolean>` | 连接状态 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `connect` | `(deviceId, options?) => Promise<boolean>` | 连接设备 |
| `disconnect` | `() => Promise<void>` | 断开连接 |

## 自动重连

```ts
const { connect } = useBluetooth({
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
});
```

连接失败时自动尝试重连，达到最大次数后停止。

## 自动清理

组件卸载时自动断开连接并取消重连定时器。
