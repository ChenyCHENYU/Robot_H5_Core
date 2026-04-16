# 业务需求 → h5-core 功能映射

> 本文档按系统（功能入口）维度，列举各业务需求所需的 h5-core Hook 能力。

---

## 一、APP（原生 WebView）

> 适配器：`NativeBridge`（需原生协议对接）

| 领域 | 场景 | 所需 Hook | 是否需原生 |
|------|------|-----------|-----------|
| 设备管理 | 点检结果上传（拍照/录像） | `useCamera` `useVideoRecorder` `useFileUpload` | ✅ 是 |
| 设备管理 | 点检/检修/保养附件上传 | `useFileUpload` `useFilePreview` | 否 |
| 设备管理 | 备件流程跟踪（扫码） | `useQrScanner` | ✅ 是 |
| 设备管理 | 点检区域刷卡（NFC） | `useNfc` | ✅ 是 |
| 物流管理 | 仓储入库/移库/出库/盘库（扫码） | `useQrScanner` | ✅ 是 |

### APP 能力汇总

| Hook | 使用频次 |
|------|---------|
| `useQrScanner` | ★★★ 高（扫码是 APP 核心场景） |
| `useFileUpload` | ★★★ 高 |
| `useCamera` | ★★ 中 |
| `useNfc` | ★★ 中（仅设备巡检） |
| `useVideoRecorder` | ★ 低 |
| `useFilePreview` | ★ 低 |

---

## 二、微信小程序

> 适配器：`WechatBridge`（需 weixin-js-sdk 对接）

| 领域 | 场景 | 所需 Hook |
|------|------|-----------|
| 物流管理 | 手机位置信息 | `useLocation` |
| 物流管理 | 手机拍照上传 | `useCamera` `useFileUpload` |
| 物流管理 | 承运商/供货商派车、司机接单 | 文本录入（表单，非 Hook） |
| 物流管理 | 车辆预约排队 | 文本录入（表单，非 Hook） |
| 安防管理 | 访客预约（扫码+人脸拍照） | `useQrScanner` `useCamera` |
| 安防管理 | 扫码巡检 + 定位打卡 + 拍照上报 | `useQrScanner` `useLocation` `useCamera` `useFileUpload` `useWatermark` |
| 安防管理 | 监装拍照 | `useCamera` `useQrScanner` |
| 安防管理 | 携出单登记（物资拍照） | `useCamera` `useFileUpload` |
| 安防管理 | 交通安全考试（视频播放） | 原生 `<video>` 标签（非 Hook） |

### 微信小程序能力汇总

| Hook | 使用频次 |
|------|---------|
| `useCamera` | ★★★ 高（几乎每个场景都要拍照） |
| `useQrScanner` | ★★★ 高 |
| `useLocation` | ★★ 中（巡检 + 物流） |
| `useFileUpload` | ★★ 中 |
| `useWatermark` | ★ 低（巡检拍照叠加水印） |

---

## 三、钉钉

> 适配器：`DingtalkBridge`（需 dingtalk-jsapi 对接）

| 领域 | 场景 | 所需 Hook |
|------|------|-----------|
| **计量管理** | 报表查询 | 文本录入（表单，非 Hook） |
| | 调拨任务查询、状态展示 | 文本录入 |
| | 巡检任务执行（NFC） | `useNfc` |
| | 校磅任务执行 | 文本录入 |
| | 磅单查询 | 文本录入 |
| **安全管理** | 承揽商危险作业监护 | 文本录入 |
| | 正式工危险作业申请/审批/监护 | 文本录入 |
| | 正式工隐患排查 | 文本录入 |
| | 正式工安全检查 | 文本录入 |
| | 正式工学习考试 | 文本录入 |
| **能源管理** | 经济运行规则异常推送 | `usePushNotification` |
| **环保管理** | 危固废台账填报 | 文本录入 |
| | 危固废厂商信息 | `useCamera` `useFileUpload` |
| | 内部转移/外委处置确认 | 文本录入 |
| | 环境监测方案/报告查看 | `useFilePreview` |
| | 预警推送处置闭环 | `usePushNotification` `useFileUpload` |
| | 环境监测整改信息填报 | 文本录入 |
| | 应急演练填报 | `useFileUpload` |
| | 隐患整改 | `useFileUpload` |
| | 隐患随手拍 | `useCamera` `useWatermark` `useFileUpload` |
| | 业务流程审批 | 文本录入 |
| **品质管控** | 检验样品二维码识别接收确认 | `useQrScanner` |
| | 库存/在制品巡检扫码查验 + 不良拍照 | `useQrScanner` `useCamera` `useFileUpload` |
| **营销管理** | 临时客户管理、询单、报表、审批、消息推送 | `useCamera` `useFileUpload` `useLocation` `useVideoRecorder` `usePushNotification` |
| **公共需求** | 泛微OA移动端集成审批 | 文本录入 |
| | 移动端消息推送 | `usePushNotification` |

### 钉钉能力汇总

| Hook | 使用频次 |
|------|---------|
| `useFileUpload` | ★★★ 高（附件上传贯穿多系统） |
| `useCamera` | ★★★ 高（隐患拍照、巡检拍照、厂商资料） |
| `usePushNotification` | ★★ 中（能源预警、消息推送、环保预警） |
| `useQrScanner` | ★★ 中（品质管控扫码） |
| `useWatermark` | ★ 低（隐患随手拍） |
| `useNfc` | ★ 低（计量巡检） |
| `useFilePreview` | ★ 低（环境监测报告） |
| `useLocation` | ★ 低（营销管理） |
| `useVideoRecorder` | ★ 低（营销管理） |

---

## 四、全平台 Hook 优先级总览

| Hook | APP | 小程序 | 钉钉 | 综合优先级 |
|------|-----|--------|------|-----------|
| `useCamera` | ★★ | ★★★ | ★★★ | **P0 核心** |
| `useFileUpload` | ★★★ | ★★ | ★★★ | **P0 核心** |
| `useQrScanner` | ★★★ | ★★★ | ★★ | **P0 核心** |
| `useLocation` | — | ★★ | ★ | **P1 重要** |
| `usePushNotification` | — | — | ★★ | **P1 重要** |
| `useNfc` | ★★ | — | ★ | **P1 重要** |
| `useWatermark` | — | ★ | ★ | **P2 增强** |
| `useFilePreview` | ★ | — | ★ | **P2 增强** |
| `useVideoRecorder` | ★ | — | ★ | **P2 增强** |
| `useSignature` | — | — | — | **P3 备用**（合同/验收签字） |
| `useAudioRecorder` | — | — | — | **P3 备用**（语音备忘） |
| `useBluetooth` | — | — | — | **P3 备用**（蓝牙打印） |
| `useOfflineStorage` | — | — | — | **P3 备用**（离线巡检数据缓存） |
| `usePermission` | ★ | ★ | ★ | **P1 基础**（权限预请求，各平台通用） |

---

## 五、不涉及移动端的领域

| 领域 | 负责人 |
|------|--------|
| 01.生产管理 | 杨航 |
| 11.成本管理 | 陈晖 |
| 14.开发与数据平台 | 薛灿 |
| 15.数据治理 | 王娇 |
| 16.炼钢智能化 | 周伟 |
| 17.轧钢智能化 | 厉明鹏 |
