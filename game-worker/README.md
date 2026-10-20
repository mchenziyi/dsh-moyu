# moyu-zjh Worker

Cloudflare 托管版炸金花的后端：一个 Worker + 每个房间一个 Durable Object。

- Worker：创建/加入房间、WebSocket 入口、状态查询；
- `Room` Durable Object：权威牌局状态、私有手牌、轮次、断线、超时；
- 规则直接复用 `../game/zhajinhua.js`；
- 不需要 Pages，不需要 KV；
- 只允许 DSH 插件客户端连接。

## 本地开发

```bash
cd game-worker
npm install
npm run dev
# http://127.0.0.1:8787
```

测试（会自己起一个临时 wrangler dev，端口 8790）：

```bash
npm test
```

## API

```text
GET  /api/health
POST /api/rooms
POST /api/rooms/:code/join
GET  /api/rooms/:code/state?token=
GET  /api/rooms/:code/ws?token=      WebSocket
POST /api/rooms/:code/action
POST /api/rooms/:code/start|next|leave
```

WebSocket 消息：

```json
{ "type": "state", "state": { ... } }
{ "type": "action", "action": "look" }
{ "type": "action", "action": { "kind": "compare", "target": 2 } }
{ "type": "start" }
{ "type": "next" }
{ "type": "error", "error": "..." }
```

## 部署（尚未执行）

需要 Workers 写权限的 API Token，且先取得明确批准：

```bash
npx wrangler deploy
```

部署后地址形如：

```text
https://moyu-zjh.<your-subdomain>.workers.dev
```

然后在 DSH 插件 → 游戏 → 高级设置 → Cloudflare Worker 地址里填入该地址。

## 免费额度

- Durable Objects 在 Workers Free 可用（仅 SQLite 后端）；
- Free：100,000 DO 请求/天、13,000 GB-s/天、5GB 存储；
- 6 人小局远低于额度；使用 WebSocket 后注意免费额度。

## 安全

- 所有者 token / 玩家 token 保存在 DO 中；
- 未看牌前不会把牌发给客户端；
- 仅筹码/积分，不涉及真钱；
- 不修改现有 `my-cf-node` 或 `cf-node-kv`；
- 公网 Worker 可能被扫描，后续可加房间创建限频/访问密钥。
