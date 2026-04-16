# usePushNotification

统一推送通知 Hook — 通过 Bridge 对接原生推送通道。

## 用法

```ts
import { usePushNotification } from "@robot/h5-core/hooks";

const { messages, loading, error, register, onMessage, clearMessages } = usePushNotification();

// 注册推送
await register("device-token-xxx");

// 监听消息
onMessage((msg) => {
  console.log(msg.title, msg.body);
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `messages` | `Ref<PushMessage[]>` | 已接收消息列表 |
| `loading` | `Ref<boolean>` | 注册中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `register()` | `(token: string) => Promise<boolean>` | 注册设备推送 |
| `onMessage()` | `(callback) => void` | 注册消息回调 |
| `clearMessages()` | `() => void` | 清空消息列表 |

## 注意事项

- **仅 Bridge 通道**：当前通过 Native/钉钉/微信 Bridge 实现推送注册和消息接收
- **无 Service Worker**：当前版本不支持 Web Push，如需浏览器推送需自行实现
- **组件卸载自动清理**：自动取消消息监听
- **钉钉/微信**：推送通过各平台 SDK 通道实现，需在平台后台配置

## 测试说明

- 单元测试通过 Mock Bridge 验证注册/消息回调/清空逻辑
- **推送功能需要在真实 APP 环境中测试**（钉钉/微信/APP WebView）
- 建议搭配后端推送服务进行端到端测试
