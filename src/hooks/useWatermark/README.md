# useWatermark

为当前页面能够读取的图片 `File` 添加文字水印，适合普通 H5、App/PDA WebView 中已取得的本地文件与预览。支持单点/平铺、多行文字、旧 WebView 解码降级、输出尺寸保护和结构化错误。

> 钉钉 `chooseImageAndUpload` 返回客户端虚拟路径并由原生能力直传，子应用拿不到图片字节。跨钉钉、App、PDA、H5 的正式业务水印应使用服务端 `watermarkPolicy`；不要在 iframe 中 `fetch` 钉钉虚拟路径。

## 基本用法

```ts
import { useWatermark } from '@robot-h5/core'

const { loading, error, addWatermark } = useWatermark({
  text: ['气体检测', '本地预览'],
  position: 'bottomRight',
})

const watermarked = await addWatermark(photoFile)
// watermarked 为新的 File；原 File 不会被修改。
```

## 必须带水印的业务

历史兼容模式下处理失败返回 `null`。业务规定“开启后必须成功”时使用 `failureMode: 'throw'`，避免调用方误把原图继续上传：

```ts
const { addWatermark } = useWatermark({
  text: ['巡检照片', new Date().toLocaleString()],
  failureMode: 'throw',
})

try {
  const file = await addWatermark(photoFile)
  await upload(file)
} catch (cause) {
  const error = cause as { code?: string; message?: string }
  // invalid_file / invalid_options / decode_failed /
  // canvas_unavailable / encode_failed
  showError(error.message || '水印处理失败')
}
```

## 服务端权威水印

需要覆盖钉钉原生直传和相册历史照片时，将策略放入现有上传 `formData`。`enabled=false` 时不会添加 `watermarkPolicy` 字段：

```ts
import { buildWatermarkFormData } from '@robot-h5/core'

const formData = buildWatermarkFormData(
  { businessType: 'inspection', businessId },
  watermarkEnabled
    ? {
        enabled: true,
        required: true,
        templateId: 'inspection-photo-v1',
        source: 'album',
        clientCapturedAt: new Date(),
        context: { businessName: '气体检测' },
      }
    : { enabled: false },
)

await window.WLPortalMedia.chooseImageAndUpload({
  source: 'album',
  max: 1,
  url: mediaUploadUrl,
  formData,
  header,
})
```

服务端必须从登录态和服务器时钟取得真实用户、公司及上传时间；客户端时间、位置和 `context` 只能作为待校验的业务输入。完整契约见[图片水印与服务端接入](../../../docs/WATERMARK_INTEGRATION.md)。

## Options

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string \| readonly string[]` | `''` | 支持换行字符串或多行数组 |
| `fontSize` | `number` | `48` | 750px 参考宽度下的字号 |
| `fontColor` | `string` | `#ffffff` | 字色 |
| `position` | `WatermarkPosition` | `bottomRight` | 单点水印位置 |
| `opacity` | `number` | `0.8` | 透明度 0～1 |
| `mode` | `single \| tiled` | `single` | 单点或平铺 |
| `tileGap` | `number` | `1.5` | 平铺横向间距系数，限制 0.25～10 |
| `autoScale` | `boolean` | `true` | 根据输出宽度缩放字号 |
| `stroke` | `boolean` | `true` | 绘制对比色描边 |
| `lineHeight` | `number` | `1.25` | 多行行高倍数 |
| `maxLines` | `number` | `6` | 最大行数 |
| `maxLineLength` | `number` | `120` | 单行最大字符数 |
| `maxWidth` / `maxHeight` | `number` | `4096` | 输出单边上限 |
| `maxPixels` | `number` | `12000000` | 输出像素总数上限 |
| `outputType` | `jpeg \| png \| webp` | 受支持的原图格式 | 不支持的原图格式回退 JPEG |
| `quality` | `number` | `0.92` | 有损输出质量 0～1 |
| `failureMode` | `return-null \| throw` | `return-null` | 兼容模式或强制失败模式 |

## 注意事项

- 优先使用 `createImageBitmap`，失败或不可用时降级到 `HTMLImageElement`，解码 15 秒超时。
- 大图会等比缩小到配置上限，防止移动端 Canvas 内存异常。
- Canvas 重绘不会保留 EXIF；正式审计信息应由服务端写入水印及附件元数据。
- HEIC 等 WebView 无法解码的格式会返回 `decode_failed`，不应静默当作已加水印。
- 并发调用会正确维护 `loading`，但移动端多图仍建议逐张处理，避免瞬时内存峰值。
