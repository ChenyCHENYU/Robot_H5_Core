# useBluetooth

蓝牙设备连接 Hook。

## 基本用法

```ts
import { useBluetooth } from "@robot/h5-core";

const { device, connected, loading, error, connect, disconnect } = useBluetooth();

const info = await connect("device-001");
// info → { id, name, connected }

await disconnect();
```

## 高级用法

```ts
// 通过 overrides 注入原生蓝牙实现
defineAppConfig(app, {
  bridge: {
    overrides: {
      bluetooth: {
        async connect(deviceId) {
          return await NativeBLE.connect(deviceId);
        },
        async disconnect() {
          await NativeBLE.disconnect();
        },
      },
    },
  },
});

// 配合 extendHook 连接后自动初始化设备
extendHook("useBluetooth", {
  after: async (device, ctx) => {
    await initDevice(device.id);
    return device;
  },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `device` | `Ref<BluetoothDeviceInfo \| null>` | 已连接设备 |
| `connected` | `Ref<boolean>` | 连接状态 |
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `connect()` | `(deviceId: string) => Promise<BluetoothDeviceInfo \| null>` | 连接设备 |
| `disconnect()` | `() => Promise<void>` | 断开连接 |

## 注意事项

- Web Bluetooth：Chrome Desktop/Android 支持，iOS/Firefox 不支持
- 跨平台蓝牙必须通过 Native Bridge 或 `overrides` 注入
- BrowserBridge 降级直接抛出"不支持"错误
