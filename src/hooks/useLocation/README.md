# useLocation

GPS 单次/持续定位 Hook。

## 基本用法

```ts
import { useLocation } from "@robot/h5-core";

const { position, loading, error, getCurrentPosition } = useLocation();

const pos = await getCurrentPosition();
// pos → { longitude, latitude, altitude?, accuracy, timestamp }
```

## 高级用法

```ts
// 持续定位（实时追踪）
const { position, watchPosition, stopWatch } = useLocation({
  timeout: 15000,
  enableHighAccuracy: true,
});

watchPosition();
// position.value 实时更新
// 停止追踪
stopWatch();

// 配合坐标转换
import { gcj02ToWgs84 } from "@robot/h5-core";
const pos = await getCurrentPosition();
if (pos) {
  const wgs = gcj02ToWgs84(pos.longitude, pos.latitude);
}
```

## 全局配置

```ts
defineAppConfig(app, {
  location: { coordType: "gcj02", timeout: 10000 },
});
```

## API

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `position` | `Ref<Coordinates \| null>` | 当前坐标 |
| `loading` | `Ref<boolean>` | 定位中 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `getCurrentPosition()` | `() => Promise<Coordinates \| null>` | 单次定位 |
| `watchPosition()` | `() => void` | 开始持续定位 |
| `stopWatch()` | `() => void` | 停止持续定位 |

## 注意事项

- HTTPS 必需
- 中国大陆使用 GCJ-02 坐标系，海外使用 WGS-84
- 组件卸载时自动停止 watchPosition
- iOS Safari 首次定位需用户授权，可配合 `usePermission` 预请求
