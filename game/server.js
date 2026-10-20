/**
 * LAN game server for the moyu 炸金花 module.
 *
 * One Host process owns one server; rooms live in memory. Clients are DSH
 * plugin instances on the same LAN or behind the host's tunnel. State is
 * authoritative here: opponents' hands never leave this process until a
 * player looks or the hand is settled.
 *
 * Transport: JSON over HTTP + Server-Sent Events. No third-party deps, so it
 * runs in the DSH Host exactly as installed.
 */

import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { ZhaJinHuaGame, DEFAULT_CONFIG } from './zhajinhua.js';

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ROOMS = 30;
const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text === '' ? {} : JSON.parse(text));
      } catch {
        reject(new Error('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function cleanName(value, fallback) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return name === '' ? fallback : name;
}

function roomCode() {
  let code = '';
  const bytes = randomBytes(6);
  for (const byte of bytes) code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length];
  return code;
}

function token() {
  return randomBytes(24).toString('hex');
}

export function lanAddresses(port) {
  const result = [];
  const interfaces = networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      result.push(`http://${entry.address}:${port}`);
    }
  }
  return [...new Set(result)];
}

function fire(base, info) {
  try {
    base(info);
  } catch {
    /* listeners are best effort */
  }
}

class Room {
  constructor(code, host, creatorName, config) {
    this.code = code;
    this.host = host;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.ownerSeat = 0;
    this.players = [{
      seat: 0,
      name: cleanName(creatorName, '房主'),
      token: token(),
      online: true,
      streams: new Set(),
    }];
    this.tokens = new Map([[this.players[0].token, 0]]);
    this.config = Object.assign({}, DEFAULT_CONFIG, config ?? {});
    this.game = new ZhaJinHuaGame([{ seat: 0, name: this.players[0].name, chips: this.config.initialChips }], this.config);
    this.turnTimer = null;
  }

  get status() {
    if (this.game.status === 'playing' || this.game.status === 'settled') return this.game.status;
    return 'waiting';
  }

  publicInfo() {
    return {
      roomCode: this.code,
      status: this.status,
      players: this.players.filter((player) => player.online).length,
      maxPlayers: this.config.maxPlayers,
      ante: this.config.ante,
      createdAt: this.createdAt,
    };
  }

  playerByToken(value) {
    const seat = this.tokens.get(value);
    return seat === undefined ? undefined : this.players[seat];
  }

  stateFor(seat) {
    return Object.assign(this.game.stateFor(seat), {
      roomCode: this.code,
      ownerSeat: this.ownerSeat,
      roomStatus: this.status,
    });
  }

  broadcast() {
    this.updatedAt = Date.now();
    for (const player of this.players) {
      if (player.streams.size === 0) continue;
      const state = this.stateFor(player.seat);
      const frame = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
      for (const stream of [...player.streams]) {
        try {
          stream.write(frame);
        } catch {
          player.streams.delete(stream);
        }
      }
    }
  }

  scheduleTurn() {
    if (this.turnTimer !== null) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.game.status !== 'playing' || this.game.turnSeat < 0) return;
    const seat = this.game.turnSeat;
    this.turnTimer = setTimeout(() => {
      this.turnTimer = null;
      if (this.game.status !== 'playing' || this.game.turnSeat !== seat) return;
      try {
        this.game.act(seat, 'fold');
        this.broadcast();
        this.scheduleTurn();
      } catch {
        /* the player may have acted in the same tick */
      }
    }, this.config.turnTimeoutMs);
  }

  close() {
    if (this.turnTimer !== null) clearTimeout(this.turnTimer);
    for (const player of this.players) {
      for (const stream of player.streams) {
        try { stream.end(); } catch { /* closed */ }
      }
      player.streams.clear();
    }
  }
}

export async function createGameServer(options = {}) {
  const host = options.host ?? '0.0.0.0';
  const requestedPort = Number.isInteger(options.port) ? options.port : 17890;
  const rooms = new Map();
  let closed = false;

  const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    try {
      const url = new URL(String(req.url ?? '/'), 'http://127.0.0.1');
      const pathname = url.pathname;

      if (req.method === 'GET' && pathname === '/api/health') {
        json(res, 200, { ok: true, name: 'moyu-zjh', version: 1 });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/rooms') {
        json(res, 200, {
          rooms: [...rooms.values()]
            .filter((room) => room.status !== 'playing')
            .map((room) => room.publicInfo()),
        });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/rooms') {
        if (rooms.size >= MAX_ROOMS) {
          json(res, 429, { error: '房间数量已达上限' });
          return;
        }
        const body = await readBody(req);
        let code = roomCode();
        while (rooms.has(code)) code = roomCode();
        const room = new Room(code, host, body.name, body.config);
        rooms.set(code, room);
        const player = room.players[0];
        const currentPort = server.address().port;
        json(res, 200, {
          roomCode: code,
          token: player.token,
          seat: player.seat,
          state: room.stateFor(0),
          share: { port: currentPort, lanUrls: lanAddresses(currentPort) },
        });
        return;
      }

      const joinMatch = /^\/api\/rooms\/([A-Z0-9]+)\/join$/.exec(pathname);
      if (req.method === 'POST' && joinMatch !== null) {
        const room = rooms.get(joinMatch[1]);
        if (room === undefined) {
          json(res, 404, { error: '房间不存在' });
          return;
        }
        const body = await readBody(req);
        if (room.status === 'playing') {
          json(res, 409, { error: '本局进行中，请等这一局结束' });
          return;
        }
        if (room.players.length >= room.config.maxPlayers) {
          json(res, 409, { error: '房间已满' });
          return;
        }
        const seat = room.players.length;
        const name = cleanName(body.name, `玩家${seat + 1}`);
        const player = { seat, name, token: token(), online: true, streams: new Set() };
        room.players.push(player);
        room.tokens.set(player.token, seat);
        room.game.players.push({
          seat,
          name,
          chips: room.config.initialChips,
          hand: [],
          seen: false,
          folded: false,
          inHand: false,
          acted: false,
          online: true,
        });
        room.broadcast();
        const currentPort = server.address().port;
        json(res, 200, {
          roomCode: room.code,
          token: player.token,
          seat,
          state: room.stateFor(seat),
          share: { port: currentPort, lanUrls: lanAddresses(currentPort) },
        });
        return;
      }

      const stateMatch = /^\/api\/rooms\/([A-Z0-9]+)\/state$/.exec(pathname);
      if (req.method === 'GET' && stateMatch !== null) {
        const room = rooms.get(stateMatch[1]);
        if (room === undefined) {
          json(res, 404, { error: '房间不存在' });
          return;
        }
        const player = room.playerByToken(url.searchParams.get('token') ?? '');
        if (player === undefined) {
          json(res, 403, { error: 'token 无效' });
          return;
        }
        json(res, 200, { state: room.stateFor(player.seat) });
        return;
      }

      const eventsMatch = /^\/api\/rooms\/([A-Z0-9]+)\/events$/.exec(pathname);
      if (req.method === 'GET' && eventsMatch !== null) {
        const room = rooms.get(eventsMatch[1]);
        if (room === undefined) {
          json(res, 404, { error: '房间不存在' });
          return;
        }
        const player = room.playerByToken(url.searchParams.get('token') ?? '');
        if (player === undefined) {
          json(res, 403, { error: 'token 无效' });
          return;
        }
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
        });
        res.write('retry: 3000\n\n');
        player.online = true;
        player.streams.add(res);
        res.write(`event: state\ndata: ${JSON.stringify(room.stateFor(player.seat))}\n\n`);
        room.game.setOnline(player.seat, true);
        room.broadcast();
        const keepAlive = setInterval(() => {
          try { res.write(': ping\n\n'); } catch { /* closed */ }
        }, 25000);
        req.on('close', () => {
          clearInterval(keepAlive);
          player.streams.delete(res);
          if (player.streams.size === 0) {
            player.online = false;
            room.game.setOnline(player.seat, false);
            room.game.forceFold(player.seat);
          }
          room.broadcast();
        });
        return;
      }

      const actionMatch = /^\/api\/rooms\/([A-Z0-9]+)\/(action|start|next|leave)$/.exec(pathname);
      if (req.method === 'POST' && actionMatch !== null) {
        const room = rooms.get(actionMatch[1]);
        if (room === undefined) {
          json(res, 404, { error: '房间不存在' });
          return;
        }
        const body = await readBody(req);
        const player = room.playerByToken(body.token ?? '');
        if (player === undefined) {
          json(res, 403, { error: 'token 无效' });
          return;
        }
        const kind = actionMatch[2];
        if (kind === 'leave') {
          player.online = false;
          room.game.setOnline(player.seat, false);
          room.game.forceFold(player.seat);
          if (room.ownerSeat === player.seat) {
            const next = room.players.find((entry) => entry.online && entry.seat !== player.seat);
            if (next !== undefined) room.ownerSeat = next.seat;
          }
          room.broadcast();
          json(res, 200, { ok: true });
          return;
        }
        if (kind === 'start' || kind === 'next') {
          if (room.ownerSeat !== player.seat) {
            json(res, 403, { error: '只有房主可以操作' });
            return;
          }
          if (room.status === 'playing') {
            json(res, 409, { error: '本局还在进行' });
            return;
          }
          if (room.players.filter((entry) => entry.online).length < room.config.minPlayers) {
            json(res, 409, { error: `至少需要 ${room.config.minPlayers} 名在线玩家` });
            return;
          }
          room.game.startHand();
          room.broadcast();
          room.scheduleTurn();
          json(res, 200, { ok: true });
          return;
        }
        room.game.act(player.seat, body.action);
        room.broadcast();
        room.scheduleTurn();
        json(res, 200, { ok: true });
        return;
      }

      json(res, 404, { error: 'not found' });
    } catch (error) {
      json(res, 400, { error: String(error?.message ?? error) });
    }
  });

  const listen = (port) => new Promise((resolve, reject) => {
    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });

  let port = requestedPort;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await listen(port);
      break;
    } catch (error) {
      if (error?.code !== 'EADDRINUSE' || attempt === 9) {
        if (closed) return undefined;
        throw error;
      }
      port += 1;
    }
  }

  const actualPort = server.address().port;
  const lanUrls = lanAddresses(actualPort);
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const onlyOffline = room.players.every((player) => !player.online);
      if (now - room.createdAt > ROOM_TTL_MS
        || (onlyOffline && now - room.updatedAt > EMPTY_ROOM_TTL_MS)) {
        room.close();
        rooms.delete(code);
      }
    }
  }, 60_000);
  sweeper.unref?.();

  return {
    port: actualPort,
    host,
    lanUrls,
    rooms,
    createRoom(name, config) {
      let code = roomCode();
      while (rooms.has(code)) code = roomCode();
      const room = new Room(code, host, name, config);
      rooms.set(code, room);
      const player = room.players[0];
      return {
        roomCode: code,
        token: player.token,
        seat: player.seat,
        state: room.stateFor(0),
        share: { port: actualPort, lanUrls },
      };
    },
    close() {
      closed = true;
      clearInterval(sweeper);
      for (const room of rooms.values()) room.close();
      rooms.clear();
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}
