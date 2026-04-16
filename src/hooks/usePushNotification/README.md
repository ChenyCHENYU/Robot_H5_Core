# usePushNotification

统一推送消息注册与监听。

## 引入

```ts
import { usePushNotification } from "@robot/h5-core/hooks";
```

## 基本用法

```vue
<script setup lang="ts">
const { lastMessage, messages, register, startListening, stopListening, clearMessages } =
  usePushNotification();

onMounted(async () => {
  await register("fcm-token-xxx");
  startListening();
});
</script>

<template>
  <p v-if="lastMessage">新消息: {{ lastMessage.title }}</p>
  <ul>
    <li v-for="msg in messages" :key="msg.timestamp">{{ msg.body }}</li>
  </ul>
</template>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `token` | `string` | — | 推送 token（可在 register 时传入） |

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `lastMessage` | `Ref<PushMessage \| null>` | 最新消息 |
| `messages` | `Ref<PushMessage[]>` | 所有已接收消息 |
| `loading` | `Ref<boolean>` | 加载状态 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `register` | `(token?) => Promise<boolean>` | 注册推送 |
| `startListening` | `() => void` | 开始监听 |
| `stopListening` | `() => void` | 停止监听 |
| `clearMessages` | `() => void` | 清空消息 |

## PushMessage 类型

```ts
interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
}
```

## 自动清理

组件卸载时自动停止消息监听。
