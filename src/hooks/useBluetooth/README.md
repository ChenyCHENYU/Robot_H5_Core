# useBluetooth

蓝牙设备连接 Hook。

## 用法

```ts
import { useBluetooth } from "@robot/h5-core/hooks";

const { device, connected, loading, error, connect, disconnect } = useBluetooth();

const info = await connect("device-001");
// info = { id: 'device-001', name: 'My Device', connected: true }

await disconnect();
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `device` | `Ref<BluetoothDeviceInfo \| null>` | 已连接设备信息 |
| `connected` | `Ref<boolean>` | 连接状态 |
| `loading` | `Ref<boolean>` | 操作中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `connect()` | `(deviceId: string) => Promise<BluetoothDeviceInfo \| null>` | 连接设备 |
| `disconnect()` | `() => Promise<void>` | 断开连接 |

## 注意事项

- **Web Bluetooth 兼容性极差**：
  - ✅ Chrome Desktop / Chrome Android
  - ❌ **iOS 完全不支持**（Safari、Chrome iOS 均不支持）
  - ❌ Firefox 不支持
- **必须通过 Native Bridge 实现跨平台蓝牙功能**
- **BrowserBridge 降级**：直接抛出"不支持"错误
- 实际场景（如设备巡检中的蓝牙打印机）建议使用 APP 环境

## 测试说明

- 单元测试通过 Mock Bridge 验证连接/断开/错误处理
- **蓝牙无法在模拟器中测试**，必须使用真实设备和蓝牙外设
- 建议使用 Android 真机 + BLE 设备进行集成测试
