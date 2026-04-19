# 平台 SDK 集成示例

本目录提供各宿主平台的 `h5.config.ts` 参考配置。

| 目录 | 平台 | 说明 |
|------|------|------|
| [dingtalk/](dingtalk/) | 钉钉 | dingtalk-jsapi 注入 |
| [wechat/](wechat/) | 微信/企微 | weixin-js-sdk 注入 |
| [native/](native/) | APP WebView | 原生协议桥接 |

## 使用方式

1. 将对应平台目录中的 `h5.config.ts` 复制到你的项目 `src/` 目录
2. 安装平台 SDK 依赖（如 `pnpm add dingtalk-jsapi`）
3. 在 `main.ts` 中注册插件：

```ts
import { createApp } from "vue";
import { h5Core } from "@robot-h5/core";
import h5Config from "./h5.config";

createApp(App).use(h5Core, h5Config).mount("#app");
```

> 未通过 `overrides` 覆盖的能力会自动降级到浏览器标准 API。
