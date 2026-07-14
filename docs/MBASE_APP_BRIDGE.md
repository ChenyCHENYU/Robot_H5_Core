# mbase App WebView 桥接

## 目标

`MbaseBridge` 使用同一套业务 Hook 同时支持两种宿主：

- 钉钉 H5：iframe 子应用通过 `window.parent.postMessage` 请求基座调用钉钉 JSAPI。
- mbase App：远程 H5 通过 `uni.postMessage` 请求基座调用 App 原生能力。

普通浏览器、微信和独立 Native 适配器保持原有检测与降级行为。

## 宿主识别

mbase App 打开远程 H5 时必须追加：

```text
mbase_host=app
```

core 也识别宿主提前注入的 `window.__MBASE_BRIDGE_HOST__ = "app"`。未出现显式标记时，不会把普通顶层 H5 误判为 mbase App。

## 协议

请求字段保持向后兼容：

```ts
{
  source: "mbase-bridge",
  type: "capability:invoke",
  id: string,
  api: "takePhoto" | "scan" | "getLocation",
  payload: Record<string, unknown>,
  protocol: 1,
  host: "iframe" | "app"
}
```

响应仍为：

```ts
{
  source: "mbase-bridge",
  type: "capability:result",
  id: string,
  ok: boolean,
  data?: unknown,
  error?: string,
  reason?: string
}
```

App 基座通过 WebView `evalJS` 派发 `mbase:bridge-result` 自定义事件回包；core 同时保留原 `message` 响应监听，兼容钉钉 iframe。

## App 侧要求

1. `<web-view @message>` 接收 `event.detail.data`，逐条处理能力请求。
2. 仅允许已注册子应用和能力白名单，校验 `source`、`type`、`id`、`api` 与载荷大小。
3. 原生能力完成后，用当前子 WebView 的 `evalJS` 派发响应事件。
4. 定位明确返回 `coordinateSystem`、`rawCoordinateSystem`、`provider`、`platform`、`sampleCount` 和时间戳。
5. 权限拒绝、用户取消和超时应返回稳定错误码，不返回伪造结果。

## 网页侧行为

core 内置官方 `uni.webview.1.5.8.js`，仅在 App 宿主首次调用桥接能力时懒加载。业务代码继续使用：

```ts
const { getCurrentPosition } = useLocation();
const { capture } = useCamera();
const { scan } = useQrScanner();
```

无需直接访问 `plus`、`uni` 或修改业务调用点。
