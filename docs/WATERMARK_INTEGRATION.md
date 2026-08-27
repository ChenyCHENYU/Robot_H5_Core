# 图片水印与服务端接入

## 1. 目标与边界

统一支持以下场景，且不改变任何既有上传默认行为：

- 拍照后由用户选择是否带水印。
- 从手机相册选择历史照片后添加水印。
- 对系统中已经保存的原图生成新的水印衍生图。
- 钉钉、App/PDA、普通 H5 使用同一服务端契约。

`useWatermark` 只处理子应用已经取得的真实 `File`，适合本地预览或纯 H5 上传。钉钉原生直传只暴露虚拟路径，正式跨端水印必须由服务端完成。

## 2. 无污染约定

水印策略使用 multipart 普通字段 `watermarkPolicy`，值为 JSON 字符串：

- 不传策略或 `enabled=false`：Core 不添加该字段，服务端完全走原上传逻辑。
- `enabled=true`：服务端解析策略、保存原图并生成水印衍生图。
- `required=true`：水印失败时本次业务上传必须失败，不得静默返回原图。
- 原图不可覆盖；重试不得在已有水印图上再次叠加。

```json
{
  "enabled": true,
  "required": true,
  "templateId": "inspection-photo-v1",
  "source": "album",
  "clientCapturedAt": "2026-08-24T01:00:00.000Z",
  "location": {
    "longitude": 120.12,
    "latitude": 30.28,
    "accuracy": 15,
    "address": "现场区域"
  },
  "context": {
    "businessName": "气体检测"
  }
}
```

客户端传入的时间、地址和上下文均不可信。服务端必须从认证上下文取得用户、公司，从服务器时钟取得上传时间，并以服务端模板决定最终文字和样式。

## 3. 子应用接入

```ts
import { buildWatermarkFormData } from '@robot-h5/core'

type ImageSource = 'camera' | 'album'

async function selectAndUpload(source: ImageSource, watermarkEnabled: boolean) {
  const formData = buildWatermarkFormData(
    {
      businessType: 'inspection',
      businessId,
    },
    watermarkEnabled
      ? {
          enabled: true,
          required: true,
          templateId: 'inspection-photo-v1',
          source,
          clientCapturedAt: new Date(),
          location: currentLocation,
          context: { businessName: '气体检测' },
        }
      : { enabled: false },
  )

  return window.WLPortalMedia.chooseImageAndUpload({
    source,
    max: 1,
    url: import.meta.env.VITE_MEDIA_UPLOAD_URL,
    formData,
    header: { Authorization: `Bearer ${getToken()}` },
  })
}
```

钉钉新增页无业务 ID 时，选择阶段只保存 `pendingId`；取得业务 ID 后，在真正上传时构造水印策略：

```ts
const formData = buildWatermarkFormData(
  { businessType: 'inspection', businessId },
  { enabled: true, required: true, templateId: 'inspection-photo-v1', source: 'album' },
)

await window.WLPortalMedia.uploadPendingPhotos({
  pendingIds,
  url: import.meta.env.VITE_MEDIA_UPLOAD_URL,
  formData,
  header,
})
```

不要在选择图片时把水印状态永久绑定到 `pendingId`；以实际上传时的用户选择为准。

## 4. 服务端接口

现有上传接口继续接收：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | multipart file | 是 | 原图，字段名保持不变 |
| `businessType` / `businessId` | string | 按业务 | 原有关联字段 |
| `watermarkPolicy` | JSON string | 否 | 不传即完全走旧逻辑 |

建议响应：

```json
{
  "fileId": "display-file-id",
  "displayUrl": "https://files.example.com/watermarked/xxx.jpg",
  "originalFileId": "original-file-id",
  "watermarkStatus": "success",
  "watermarkTemplateId": "inspection-photo-v1",
  "watermarkTemplateVersion": "3",
  "requestId": "server-request-id"
}
```

关闭水印时可保持原响应；如果统一响应结构，`originalFileId` 与 `fileId` 可以相同，`watermarkStatus` 为 `disabled`。

## 5. Spring Boot 参考结构

DTO 只表达客户端允许声明的字段：

```java
public record ClientWatermarkPolicy(
    Boolean enabled,
    Boolean required,
    String templateId,
    String source,
    Instant clientCapturedAt,
    ClientLocation location,
    Map<String, Object> context
) {}

public record ClientLocation(
    BigDecimal longitude,
    BigDecimal latitude,
    BigDecimal accuracy,
    String address
) {}
```

Controller 保持 `file` 字段不变，将 JSON 普通表单字段交给业务服务：

```java
@PostMapping(value = "/api/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public FileUploadResult upload(
    @RequestPart("file") MultipartFile file,
    @RequestParam("businessType") String businessType,
    @RequestParam("businessId") String businessId,
    @RequestParam(value = "watermarkPolicy", required = false) String rawPolicy
) {
    ClientWatermarkPolicy policy = watermarkPolicyParser.parseOptional(rawPolicy);
    AuthenticatedUser operator = currentUser.required();
    return imageAttachmentService.upload(
        file, businessType, businessId, policy, operator
    );
}
```

Service 推荐流程：

```java
public FileUploadResult upload(
    MultipartFile file,
    String businessType,
    String businessId,
    ClientWatermarkPolicy clientPolicy,
    AuthenticatedUser operator
) {
    ValidatedImage image = imageValidator.validate(file); // 魔数、格式、尺寸、大小
    StoredFile original = storage.saveOriginal(image);

    if (!watermarkPolicyService.isEnabled(clientPolicy)) {
        return attachmentService.bindOriginal(original, businessType, businessId);
    }

    TrustedWatermarkContext context = watermarkPolicyService.resolve(
        clientPolicy,
        operator,             // 服务端登录人和公司
        clock.instant(),      // 服务端上传时间
        businessType,
        businessId
    );

    String idempotencyKey = watermarkFingerprint.of(
        original.sha256(), context.templateId(), context.templateVersion(), context.values()
    );

    try {
        StoredFile display = watermarkJobService.findOrCreate(
            idempotencyKey,
            () -> watermarkProcessor.renderAndStore(original, context)
        );
        return attachmentService.bindDerivative(original, display, context);
    } catch (Exception error) {
        if (context.required()) {
            throw new WatermarkRequiredException("水印生成失败", error);
        }
        return attachmentService.bindOriginalWithWarning(original, context, error);
    }
}
```

原图建议先写入“暂存/未绑定”区：只有业务附件绑定成功后才转为正式记录；水印失败或数据库事务回滚时，由补偿任务清理孤立对象。小图可同步生成并直接返回；大图或高并发场景可返回 `processing` 和任务 ID，由后台任务生成，但 `required=true` 时业务提交必须等待最终 `success`，不能把处理中误判为成功。

`watermarkProcessor` 必须完成：EXIF 方向校正、尺寸/像素保护、固定中文字体、模板渲染、输出格式规范化和资源释放。仅接受 JPEG/PNG 时可使用 Java 图片库；需要覆盖 HEIC/WebP 或高并发大图时，建议使用经过隔离和限额的 libvips/ImageMagick 服务或对象存储图片处理能力。禁止把用户输入直接拼成命令行参数。

`watermarkPolicyParser` 应限制 JSON 长度、拒绝未知模板、校验字段白名单/枚举/经纬度边界，并在解析失败时返回 `watermark_policy_invalid`。服务端不要信任 multipart 的 MIME 或扩展名，应同时校验文件魔数、实际解码结果、像素数和文件大小。

## 6. 模板与可信数据

模板由服务端配置，例如 `inspection-photo-v1`：

```text
业务：{businessName}
上传人：{serverUserName}（{serverUserNo}）
上传时间：{serverUploadedAt}
上传位置：{clientAddress}（精度 {clientAccuracy}m）
```

- `serverUser*`、`serverUploadedAt`、公司信息只能来自服务端。
- 相册历史照片应写“上传时间/上传位置”，不能冒充“拍摄时间/拍摄地点”。
- EXIF 时间如需展示，必须标注“原图拍摄时间（仅供参考）”。
- 模板需要版本号；响应和附件记录保存实际版本。
- 涉及人员、位置等敏感信息时，业务必须明确展示范围与访问权限。

## 7. 已上传历史图片

对系统内既有照片使用独立接口，不重新上传、不覆盖原图：

```http
POST /api/files/{originalFileId}/watermark-derivatives
Content-Type: application/json

{
  "enabled": true,
  "required": true,
  "templateId": "inspection-photo-v1",
  "source": "existing",
  "context": { "businessName": "气体检测" }
}
```

服务端校验当前用户是否有权读取该原图和业务记录，再生成或返回同一幂等衍生图。原附件历史、原图哈希和操作审计均需保留。

## 8. 状态、错误与幂等

| code/status | 含义 | 客户端处理 |
| --- | --- | --- |
| `disabled` | 未请求水印 | 按旧上传成功处理 |
| `success` | 水印图已生成 | 使用 `displayUrl/fileId` |
| `watermark_policy_invalid` | 策略或模板非法 | 修正配置，不自动重试 |
| `watermark_format_unsupported` | 服务端无法解码 | 提示更换图片或转为 JPEG |
| `watermark_required_failed` | 必须水印但处理失败 | 阻止业务提交，保留重试入口 |
| `watermark_optional_fallback` | 可选水印失败并返回原图 | 必须明确提示，不能显示“已加水印” |

推荐以“原图 SHA-256 + 模板 ID/版本 + 规范化可信上下文摘要”作为幂等指纹。重试先查询已有成功衍生图，永远从原图处理，不能从 `displayFileId` 再次叠加。

## 9. 验收清单

1. `enabled=false` 或未传策略时，请求字段、响应和图片与旧链路一致。
2. 拍照、相册分别在钉钉 Android/iOS、App/PDA、普通 H5 验证。
3. 相册照片显示“上传时间/位置”，不会伪装成可信拍摄信息。
4. 中文、长文本、深色/浅色背景、横竖图和 EXIF 旋转均正确。
5. JPEG/PNG、超大图、损坏文件、伪造扩展名、HEIC/WebP 策略符合约定。
6. 同一请求重复提交只产生一份水印衍生图，不出现双重水印。
7. `required=true` 时处理失败阻止提交；关闭水印不进入图片处理器。
8. 原图始终可追溯，普通用户只能访问业务允许展示的版本。
9. 日志记录 requestId、原图 ID、模板版本和状态，但不输出 Token 或完整敏感水印内容。
