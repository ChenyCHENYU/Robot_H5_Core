# usePushNotification

统一推送通知 Hook — 通过 Bridge 对接原生推送通道。

## 基本用法

```ts
import { usePushNotification } from "@robot/h5-core";

const { messages, loading, error, register, onMessage, clearMessages } =
  usePushNotification();

// 注册设备推送
await register("device-token-xxx");

// 监听消息
onMessage((msg) => {
  console.log(msg.title, msg.body, msg.data);
});
```

## 高级用法

```ts
// 显示消息列表
// messages.value → PushMessage[]
// 每条: { title, body, data?, timestamp }

// 清空已读消息
clearMessages();

// 通过 overrides 注入钉钉推送
defineAppConfig(app, {
  bridge: {
    platform: "dingtalk",
    overrides: {
      notification: {
        async register(token) {
          await dd.biz.util.registerDevice({ token });
        },
        onMessage(callback) {
          return dd.biz.util.onMessage((msg) => {
            callback({ title: msg.title, body: msg.content, timestamp: Date.now() });
          });
        },
      },
    },
  },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `messages` | `Ref<PushMessage[]>` | 已接收消息列表 |
| `loading` | `Ref<boolean>` | 注册中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `register()` | `(token: string) => Promise<boolean>` | 注册设备推送 |
| `onMessage()` | `(callback: (msg: PushMessage) => void) => void` | 注册消息回调 |
| `clearMessages()` | `() => void` | 清空消息列表 |

## 注意事项

- 推送依赖 Bridge 通道（Native/钉钉/微信），浏览器降级不可用
- 组件卸载自动清理消息监听
- 钉钉/微信推送需在对应平台后台配置
