<div align="center">

# Karin ImageBed

_给 Karin Bot 一条稳定、可回退、可观测的图片外链通道_

![License](https://img.shields.io/github/license/MimoKit/karin-plugin-imagebed?style=for-the-badge&color=blue)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Karin](https://img.shields.io/badge/Karin-Bot-7c3aed?style=for-the-badge)
![Branch](https://img.shields.io/badge/default-lin-0ea5e9?style=for-the-badge)

[快速开始](#快速开始) · [配置](#配置) · [QQ-官方机器人](#qq-官方机器人) · [贡献](#贡献)

</div>

Karin ImageBed 将多个图床统一成一个上传服务：按优先级尝试，失败自动切换；在 QQ 官方机器人上，可将公网图片地址渲染成原生 Markdown 消息。

> [!NOTE]
> 图床凭据只保存在本地配置中。免费图床、第三方接口和临时链接都有时效与稳定性限制，生产环境建议使用自己控制的对象存储或 CDN。

## 特性

| 能力 | 说明 |
| --- | --- |
| 统一上传链 | 其他 Karin 插件只需要调用 `globalThis.KarinImageBed.upload()` |
| 自动回退 | 按 `priority` 顺序尝试启用的 provider，单个失败不会阻断整条链 |
| QQ Markdown | QQ 官方机器人优先发送 Markdown 图片，其他适配器自动降级为图片段或文本 |
| 轻量配置 | 首次运行自动生成 JSON 配置，不把 token 写进代码或仓库 |
| 可扩展 provider | 每个图床只需实现统一的 `upload(buffer, name, options)` 接口 |

## 快速开始

```bash
git clone -b lin https://github.com/MimoKit/karin-plugin-imagebed.git plugins/karin-plugin-imagebed
cd plugins/karin-plugin-imagebed
pnpm install
```

重启 Karin 后，插件会自动创建 `config/config.json`。在 QQ 官方机器人群聊或私聊中发送：

```text
#图床
```

消息中附带图片，或在命令后提供图片 URL，即可测试上传链。

## 配置

配置文件：`config/config.json`

```json
{
  "priority": ["cnb", "picgo", "cliim"],
  "markdown": {
    "enabled": true,
    "maxImageWidth": 720,
    "fallbackText": true
  },
  "providers": {
    "cliim": { "enabled": true },
    "picgo": { "enabled": false, "apiKey": "" },
    "cnb": { "enabled": false, "token": "", "repo": "" }
  }
}
```

- `priority`：图床尝试顺序
- `markdown.enabled`：QQ 官方机器人是否优先输出 Markdown
- `providers.*.enabled`：单独启用或停用图床
- token、API Key 等敏感信息只写入本地配置，不要提交到 Git

## QQ 官方机器人

插件使用 Karin 的 `segment.markdown()`，不手拼 QQ API 请求。QQBot 适配器会负责：

1. 将 Markdown 内容转换为 QQ 官方消息
2. 处理公网图片 URL
3. 在频道 Markdown 权限不足时降级
4. 处理按钮与其他消息元素的兼容性

图片地址必须能被 QQ 服务端访问。自定义图床应返回公网 HTTPS URL；本地路径不能直接嵌入 Markdown。

参考：[QQ 机器人 Markdown 消息文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/type/markdown.html) · [Karin QQBot 适配器](https://github.com/KarinJS/karin-plugin-adapter-qqbot)

## 开发

```text
src/
├── apps/imagebed.js       # Karin 命令
├── providers/              # 图床 provider
├── service.js              # 优先级与故障回退
├── markdown.js             # QQ Markdown 内容
├── config.js               # 本地配置
└── index.js                # 插件初始化
```

新增图床时，实现 `ImageProvider` 的 `upload()`，在 `src/providers/index.js` 注册，并将配置加入 `config/config.example.json`。

## 贡献

1. Fork 仓库并创建分支：`git checkout -b feat/provider-name`
2. 完成功能并验证 `node --check`、测试和 QQBot 实际消息
3. 提交 Pull Request，说明 provider 限制、凭据需求和失败回退行为

## 许可证

MimoKit. Licensed under [MIT](LICENSE).

## Contributors

<a href="https://github.com/MimoKit/karin-plugin-imagebed/graphs/contributors"><img src="https://contributors-img.web.app/image?repo=MimoKit/karin-plugin-imagebed" alt="Karin ImageBed contributors" width="280"></a>
