# moyu-zjh-pages

用于绕过部分网络对 `*.workers.dev` 的 TLS 重置：Pages 只做 HTTP/WebSocket 反向代理，游戏逻辑仍在 `moyu-zjh` Worker + Durable Object 中。

- 线上：`https://moyu-zjh-pages.pages.dev`
- 上游：`moyu-zjh.chenziyi17673412583.workers.dev`
- 不托管前端；DSH 插件仍然只连 API/WS。

## 重新部署

```bash
cd game-pages
npx wrangler pages deploy . --project-name moyu-zjh-pages --commit-dirty=true
```

本项目与现有 `my-cf-node` 完全独立。
