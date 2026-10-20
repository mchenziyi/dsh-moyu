/**
 * Cloudflare Worker entry for the 炸金花 DSH plugin mode.
 *
 * Routes:
 *   POST /api/rooms                     create a room
 *   POST /api/rooms/:code/join          join a room
 *   GET  /api/rooms/:code/state?token=  state snapshot (reconnect)
 *   GET  /api/rooms/:code/ws?token=     WebSocket upgrade
 *   POST /api/rooms/:code/action        HTTP action fallback
 *   POST /api/rooms/:code/start|next    host controls
 *   POST /api/rooms/:code/leave
 *   GET  /api/health
 *
 * No Pages or KV is required. Room state lives in the Room Durable Object.
 */

import { Room } from './room.js';

export { Room };

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_BODY_BYTES = 32 * 1024;

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, corsHeaders()),
  });
}

function roomCode() {
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const byte of bytes) code += ROOM_ALPHABET[byte % ROOM_ALPHABET.length];
  return code;
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('body too large');
  return text === '' ? {} : JSON.parse(text);
}

function roomStub(env, code) {
  return env.ROOMS.get(env.ROOMS.idFromName(code));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ ok: true, name: 'moyu-zjh', version: 1 });
    }

    try {
      if (request.method === 'POST' && url.pathname === '/api/rooms') {
        const body = await readJson(request);
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const code = roomCode();
          const stub = roomStub(env, code);
          const response = await stub.fetch('https://room/create', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ roomCode: code, name: body.name, config: body.config }),
          });
          if (response.status === 409) continue;
          const payload = await response.json();
          return json(Object.assign({}, payload, {
            roomCode: code,
            transport: 'ws',
            share: { url: url.origin },
          }), response.status);
        }
        return json({ error: '房间号生成失败，请重试' }, 503);
      }

      const match = /^\/api\/rooms\/([A-Z0-9]+)\/(join|state|ws|action|start|next|leave)$/.exec(url.pathname);
      if (match === null) return json({ error: 'not found' }, 404);
      const code = match[1];
      const action = match[2];
      const stub = roomStub(env, code);

      if (action === 'ws') {
        if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected websocket' }, 426);
        return stub.fetch(new Request(`https://room/ws${url.search}`, request));
      }

      if (action === 'join') {
        const body = await readJson(request);
        const response = await stub.fetch('https://room/join', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = await response.json();
        return json(Object.assign({}, payload, { transport: 'ws', share: { url: url.origin } }), response.status);
      }

      if (action === 'state' && request.method === 'GET') {
        const response = await stub.fetch(`https://room/state${url.search}`);
        return json(await response.json(), response.status);
      }

      if (request.method === 'POST') {
        const body = await readJson(request);
        const response = await stub.fetch(`https://room/${action}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        return json(await response.json(), response.status);
      }

      return json({ error: 'method not allowed' }, 405);
    } catch (error) {
      return json({ error: String(error?.message ?? error) }, 400);
    }
  },
};
