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
4. 定位明确返回 `coordinateSystem`、`rawCoordinateSystem`、`converted`、`sourceApi`、`provider`、`platform`、`sampleCount` 和时间戳。
5. 权限拒绝、用户取消和超时应返回稳定错误码，不返回伪造结果。

## 网页侧行为

core 内置官方 `uni.webview.1.5.8.js`，仅在 App 宿主首次调用桥接能力时懒加载。业务代码继续使用：

```ts
const { getCurrentPosition } = useLocation();
const { capture } = useCamera();
const { scan } = useQrScanner();
```

无需直接访问 `plus`、`uni` 或修改业务调用点。

## 能力覆盖

适配器（`bridge/adapters/mbase.ts`）在宿主为 mbase 时自动启用，未覆盖能力沿用 browser 降级：

| 基座能力        | Core 集成点                                       | 说明                                                       |
| --------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| takePhoto       | `useCamera().capture`                             | 拍照返回 File                                              |
| scan            | `useQrScanner().scan`                             | 扫码                                                       |
| getLocation     | `useLocation().getCurrent`                        | 含坐标质量元数据                                           |
| filePreview     | `useFilePreview().preview`                        | App 容器内自动委托基座下载并用系统查看器打开                |
| nfcRead         | `useNfc().read`                                   | 标签 ID（HEX）；设备不支持时返回 `unsupported`              |
| signature       | `useSignature({ preferHostBridge: true })`        | 拉起基座签名板，返回签名 PNG File；否则本地 Canvas          |
| audioRecord     | `useAudioRecorder({ preferHostBridge: true })`    | 三段式 start/stop，返回 mp3/aac Blob；否则 MediaRecorder     |
| fileDownload    | `useFileDownload({ useHostBridge: true })`        | 基座下载 + 系统查看器存储菜单；成功后返回 null（无 File）    |

Hook 级委托（signature/audioRecord/fileDownload）均为 **opt-in**：不开启时行为与旧版完全一致；iframe（钉钉）宿主不注册 App 专属能力，自动回退浏览器实现。

## 子应用错误上报

```ts
import { reportErrorToHost } from "@robot-h5/core/bridge";

window.addEventListener("error", (e) => {
  reportErrorToHost({ message: e.message, stack: e.error?.stack, page: location.pathname });
});
```

基座将消息脱敏（token/openid 打码）、限长后并入本机错误队列，在「设置 → 网络诊断」页统一查看与导出；转发失败静默，不影响业务。微信小程序宿主暂不支持该通道。

## 统一坐标输出

- mbase App/钉钉宿主由基座返回目标坐标系，core 透传坐标质量元数据。
- 独立 H5、微信和 Native 降级路径的 Web Geolocation 原始值固定标记为 WGS-84；当 `coordType` 为 `gcj02` 时，core 在本地转换后返回。
- 坐标转换只解决坐标基准差异，`accuracy` 仍表示设备定位精度，业务应结合允许半径判断，不应把转换当作精度修正。
