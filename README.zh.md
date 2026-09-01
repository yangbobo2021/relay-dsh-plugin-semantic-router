# 面向 DeepSeek Harness 的 Relay Semantic Router

> **现已支持最新 DSH `0.1.2-alpha.3`。** 插件 `0.2.1` 已在 DSH `0.1.2-alpha.3`、`0.1.2-alpha.2` 与 `0.1.1-rc.2` 上完成兼容验证。[安装插件，立即体验最新版 DSH](https://www.npmjs.com/package/relay-dsh-plugin-semantic-router) · [兼容性详情](docs/dsh-0.1.2-alpha.3.md)。

```bash
npx @deepseek-ai/dsh@0.1.2-alpha.3 plugin --profile web add relay-dsh-plugin-events@0.2.1 relay-dsh-plugin-semantic-router@0.2.1
npx @deepseek-ai/dsh@0.1.2-alpha.3 web
```

[![DSH 兼容版本](https://img.shields.io/badge/DSH-0.1.1--rc.2%20%7C%200.1.2--alpha.2%20%7C%200.1.2--alpha.3-2f7d68)](https://github.com/deepseek-ai/deepseek-harness)

[English](README.md) | 中文

`relay-dsh-plugin-semantic-router` 为 `relay-dsh-plugin-events` 注册一个偏重召回的
模型 Router。它根据规范化 Event 与精简的活动 Wait 快照决定 `deliver`、`escalate`
或 `dismiss`。它自身不存储数据，也不会准入 DSH Session。

旧的 `internal` npm 通道继续用于集成测试，不包含此次兼容保证。请使用上方最新版
DSH 命令中精确的 `0.2.1` 版本，不要替换为 `@internal`。

```bash
dsh plugin --profile web add --save-exact \
  relay-dsh-plugin-events@internal \
  relay-dsh-plugin-semantic-router@internal
```

通过 `RELAY_ROUTER_PROVIDER` 与 `RELAY_ROUTER_MODEL` 配置已有 DSH LLM 路由。缺少
配置时插件进入受控的未启用状态，Events 继续使用精确匹配的回退路由。

构建时将 `DSH_ROOT` 指向准备好的官方 DSH 只读检出，然后执行
`npm ci --ignore-scripts && npm run verify && npm pack`，并同时安装生成的 tarball。
npm 包包含已构建的 `lib/`，原始 GitHub 源码不包含。每次模型尝试最长 60 秒，共
1–3 次；卸载会取消当前请求，不会再发起一次重试。

详见 [SPEC.md](SPEC.md) 与[投递场景](docs/acceptance-scenarios.md)。

已验证的官方 DSH：`0.1.1-rc.2` / `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`
、`0.1.2-alpha.2` / `0a53fb55bea101816fa226bb964ae2bed71c343b`，以及 `0.1.2-alpha.3` / `dd6322d604e00eec1ba5e0c8541159906a21094a`。
