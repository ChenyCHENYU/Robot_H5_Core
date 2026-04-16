# useLocation

GPS 单次/持续定位 Hook，自动坐标系转换。

## 用法

```ts
import { useLocation } from "@robot/h5-core/hooks";

const { position, loading, error, getCurrentPosition, watchPosition, stopWatch } = useLocation({
  timeout: 10000,
  enableHighAccuracy: true,
});

// 单次定位
const pos = await getCurrentPosition();

// 持续定位
watchPosition();
// 停止监听
stopWatch();
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

## 配置

```ts
defineAppConfig(app, {
  location: { coordType: "gcj02", timeout: 10000 },
});
```

## 注意事项

- **HTTPS 必需**：Geolocation API 要求 HTTPS（localhost 除外）
- **坐标系**：中国大陆使用 GCJ-02，海外使用 WGS-84，可用 `coord.ts` 工具转换
- **组件卸载时自动停止** watchPosition，无需手动清理
- **iOS Safari**：首次定位需要用户授权，可配合 `usePermission` 预请求

## 测试说明

- 单元测试通过 Mock Bridge 覆盖核心流程
- **真机测试建议**：GPS 定位精度受设备和环境影响，室内可能定位失败或精度低，建议在室外环境验证 `enableHighAccuracy` 模式
