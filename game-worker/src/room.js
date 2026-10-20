/**
 * One Durable Object per 炸金花 room.
 *
 * The Worker routes room creation/join/WebSocket traffic here. This class is
 * authoritative: it owns the deck, hands, turn order and timeouts. Clients only
 * receive their own cards (after look) and public table state.
 */

import { ZhaJinHuaGame, DEFAULT_CONFIG } from '../../game/zhajinhua.js';

const MAX_BODY_BYTES = 32 * 1024;
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function cleanName(value, fallback) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return name === '' ? fallback : name;
}

function newToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('body too large');
  return text === '' ? {} : JSON.parse(text);
}

function normalizeConfig(value) {
  const config = value !== null && typeof value === 'object' ? value : {};
  return {
    ante: Number.isInteger(config.ante) && config.ante > 0 ? config.ante : DEFAULT_CONFIG.ante,
    initialChips: Number.isInteger(config.initialChips) && config.initialChips > 0 ? config.initialChips : DEFAULT_CONFIG.initialChips,
    raiseStep: Number.isInteger(config.raiseStep) && config.raiseStep > 0 ? config.raiseStep : DEFAULT_CONFIG.raiseStep,
    maxRounds: Number.isInteger(config.maxRounds) && config.maxRounds > 0 ? config.maxRounds : DEFAULT_CONFIG.maxRounds,
    compareFromRound: Number.isInteger(config.compareFromRound) && config.compareFromRound > 0 ? config.compareFromRound : DEFAULT_CONFIG.compareFromRound,
    turnTimeoutMs: Number.isInteger(config.turnTimeoutMs) && config.turnTimeoutMs >= 5000 ? config.turnTimeoutMs : DEFAULT_CONFIG.turnTimeoutMs,
    minPlayers: 2,
    maxPlayers: Math.min(6, Math.max(2, Number.isInteger(config.maxPlayers) ? config.maxPlayers : DEFAULT_CONFIG.maxPlayers)),
    seenMultiplier: 2,
  };
}

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.game = null;
    this.players = [];
    this.tokens = {};
    this.ownerSeat = 0;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get('room');
      if (stored !== undefined) this.restore(stored);
    });
  }

  restore(stored) {
    try {
      this.players = Array.isArray(stored.players) ? stored.players : [];
      this.tokens = stored.tokens !== null && typeof stored.tokens === 'object' ? stored.tokens : {};
      this.ownerSeat = Number.isInteger(stored.ownerSeat) ? stored.ownerSeat : 0;
      this.code = typeof stored.code === 'string' ? stored.code : this.code;
      this.createdAt = Number.isFinite(stored.createdAt) ? stored.createdAt : Date.now();
      this.updatedAt = Date.now();
      if (stored.game !== null && stored.game !== undefined) {
        this.game = ZhaJinHuaGame.fromJSON(stored.game);
      }
    } catch {
      this.players = [];
      this.tokens = {};
      this.game = null;
    }
  }

  persist() {
    const payload = {
      players: this.players,
      tokens: this.tokens,
      ownerSeat: this.ownerSeat,
      code: this.code ?? '',
      createdAt: this.createdAt,
      game: this.game === null ? null : this.game.toJSON(),
    };
    return this.ctx.storage.put('room', payload);
  }

  stateFor(seat) {
    const state = this.game === null
      ? { status: 'waiting', players: [], yourSeat: seat, yourCards: [], log: [], result: null, config: {} }
      : this.game.stateFor(seat);
    return Object.assign({}, state, {
      roomCode: this.code ?? '',
      ownerSeat: this.ownerSeat,
      transport: 'ws',
    });
  }

  publicInfo() {
    return {
      roomCode: this.code ?? '',
      status: this.game === null ? 'waiting' : this.game.status,
      players: this.players.filter((player) => player.online).length,
      maxPlayers: this.game?.config.maxPlayers ?? DEFAULT_CONFIG.maxPlayers,
      ante: this.game?.config.ante ?? DEFAULT_CONFIG.ante,
    };
  }

  playerByToken(value) {
    const seat = this.tokens[value];
    return seat === undefined ? undefined : this.players[seat];
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === 'POST' && path === '/create') {
        const body = await readJson(request);
        return await this.create(body);
      }
      if (request.method === 'POST' && path === '/join') {
        const body = await readJson(request);
        return await this.join(body);
      }
      if (request.method === 'GET' && path === '/state') {
        return this.state(url);
      }
      if (request.method === 'GET' && path === '/ws') {
        return this.websocket(request, url);
      }
      if (request.method === 'POST' && path === '/action') {
        const body = await readJson(request);
        return await this.action(body);
      }
      if (request.method === 'POST' && path === '/start') {
        const body = await readJson(request);
        return await this.hostAction(body, 'start');
      }
      if (request.method === 'POST' && path === '/next') {
        const body = await readJson(request);
        return await this.hostAction(body, 'next');
      }
      if (request.method === 'POST' && path === '/leave') {
        const body = await readJson(request);
        return await this.leave(body);
      }
      return jsonResponse({ error: 'not found' }, 404);
    } catch (error) {
      return jsonResponse({ error: String(error?.message ?? error) }, 400);
    }
  }

  async create(body) {
    if (this.game !== null) return jsonResponse({ error: '房间已存在' }, 409);
    this.code = body.roomCode ?? this.code ?? '';
    const player = {
      seat: 0,
      name: cleanName(body.name, '房主'),
      token: newToken(),
      online: true,
    };
    this.players = [player];
    this.tokens[player.token] = 0;
    this.ownerSeat = 0;
    this.game = new ZhaJinHuaGame([{
      seat: 0,
      name: player.name,
      chips: normalizeConfig(body.config).initialChips,
    }], normalizeConfig(body.config));
    await this.persist();
    return jsonResponse({
      roomCode: this.code,
      token: player.token,
      seat: 0,
      state: this.stateFor(0),
      transport: 'ws',
      ownerSeat: 0,
    });
  }

  async join(body) {
    if (this.game === null) return jsonResponse({ error: '房间不存在' }, 404);
    if (this.game.status === 'playing') return jsonResponse({ error: '本局进行中，请等这一局结束' }, 409);
    if (this.players.length >= this.game.config.maxPlayers) return jsonResponse({ error: '房间已满' }, 409);
    const seat = this.players.length;
    const player = {
      seat,
      name: cleanName(body.name, `玩家${seat + 1}`),
      token: newToken(),
      online: true,
    };
    this.players.push(player);
    this.tokens[player.token] = seat;
    this.game.players.push({
      seat,
      name: player.name,
      chips: this.game.config.initialChips,
      hand: [],
      seen: false,
      folded: false,
      inHand: false,
      acted: false,
      online: true,
    });
    this.updatedAt = Date.now();
    await this.persist();
    this.broadcast();
    return jsonResponse({
      roomCode: this.code,
      token: player.token,
      seat,
      state: this.stateFor(seat),
      transport: 'ws',
      ownerSeat: this.ownerSeat,
    });
  }

  state(url) {
    const player = this.playerByToken(url.searchParams.get('token') ?? '');
    if (player === undefined) return jsonResponse({ error: 'token 无效' }, 403);
    return jsonResponse({ state: this.stateFor(player.seat), transport: 'ws' });
  }

  websocket(request, url) {
    const player = this.playerByToken(url.searchParams.get('token') ?? '');
    if (player === undefined) return jsonResponse({ error: 'token 无效' }, 403);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ seat: player.seat });
    player.online = true;
    if (this.game !== null) this.game.setOnline(player.seat, true);
    server.send(JSON.stringify({ type: 'state', state: this.stateFor(player.seat) }));
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  socketsFor(seat) {
    const result = new Set();
    for (const socket of this.ctx.getWebSockets()) {
      try {
        const attachment = socket.deserializeAttachment();
        if (attachment !== null && attachment !== undefined && attachment.seat === seat) result.add(socket);
      } catch {
        /* ignore closed socket */
      }
    }
    return result;
  }

  async webSocketMessage(socket, raw) {
    let attachment;
    try { attachment = socket.deserializeAttachment(); } catch { attachment = null; }
    const seat = attachment?.seat;
    if (Number.isInteger(seat)) await this.onSocketMessage(seat, socket, raw);
  }

  async webSocketClose(socket, code, reason, wasClean) {
    let attachment;
    try { attachment = socket.deserializeAttachment(); } catch { attachment = null; }
    const seat = attachment?.seat;
    if (Number.isInteger(seat)) await this.onSocketClose(seat, socket);
  }

  async webSocketError(socket, error) {
    let attachment;
    try { attachment = socket.deserializeAttachment(); } catch { attachment = null; }
    const seat = attachment?.seat;
    if (Number.isInteger(seat)) await this.onSocketClose(seat, socket);
  }

  async onSocketMessage(seat, socket, raw) {
    let message;
    try {
      message = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch {
      this.sendError(seat, '消息格式错误');
      return;
    }
    try {
      if (message.type === 'action') {
        this.game.act(seat, message.action);
        await this.persist();
        this.broadcast();
        this.scheduleTurn();
        return;
      }
      if (message.type === 'start' || message.type === 'next') {
        if (this.ownerSeat !== seat) throw new Error('只有房主可以开始');
        if (this.game.status === 'playing') throw new Error('本局还在进行');
        if (this.players.filter((player) => player.online).length < this.game.config.minPlayers) {
          throw new Error(`至少需要 ${this.game.config.minPlayers} 名在线玩家`);
        }
        this.game.startHand();
        await this.persist();
        this.broadcast();
        this.scheduleTurn();
        return;
      }
      if (message.type === 'leave') {
        await this.leave({ token: this.tokensForSeat(seat) });
        try { socket.close(); } catch { /* closed */ }
        return;
      }
      if (message.type === 'ping') {
        this.send(seat, { type: 'pong', at: Date.now() });
        return;
      }
      throw new Error('未知消息');
    } catch (error) {
      this.sendError(seat, String(error?.message ?? error));
    }
  }

  tokensForSeat(seat) {
    return Object.keys(this.tokens).find((key) => this.tokens[key] === seat) ?? '';
  }

  async onSocketClose(seat, socket) {
    if (this.socketsFor(seat).size > 1) return;
    const player = this.players[seat];
    if (player === undefined) return;
    player.online = false;
    if (this.game !== null) {
      this.game.setOnline(seat, false);
      this.game.forceFold(seat);
      if (this.ownerSeat === seat) {
        const next = this.players.find((entry) => entry.online && entry.seat !== seat);
        if (next !== undefined) this.ownerSeat = next.seat;
      }
      await this.persist();
      this.broadcast();
      this.scheduleTurn();
    }
  }

  async action(body) {
    const player = this.playerByToken(body.token ?? '');
    if (player === undefined) return jsonResponse({ error: 'token 无效' }, 403);
    this.game.act(player.seat, body.action);
    await this.persist();
    this.broadcast();
    this.scheduleTurn();
    return jsonResponse({ ok: true });
  }

  async hostAction(body, kind) {
    const player = this.playerByToken(body.token ?? '');
    if (player === undefined) return jsonResponse({ error: 'token 无效' }, 403);
    if (this.ownerSeat !== player.seat) return jsonResponse({ error: '只有房主可以操作' }, 403);
    if (this.game.status === 'playing') return jsonResponse({ error: '本局还在进行' }, 409);
    if (this.players.filter((entry) => entry.online).length < this.game.config.minPlayers) {
      return jsonResponse({ error: `至少需要 ${this.game.config.minPlayers} 名在线玩家` }, 409);
    }
    this.game.startHand();
    await this.persist();
    this.broadcast();
    this.scheduleTurn();
    return jsonResponse({ ok: true });
  }

  async leave(body) {
    const player = this.playerByToken(body.token ?? '');
    if (player === undefined) return jsonResponse({ error: 'token 无效' }, 403);
    player.online = false;
    this.game.setOnline(player.seat, false);
    this.game.forceFold(player.seat);
    if (this.ownerSeat === player.seat) {
      const next = this.players.find((entry) => entry.online && entry.seat !== player.seat);
      if (next !== undefined) this.ownerSeat = next.seat;
    }
    await this.persist();
    this.broadcast();
    this.scheduleTurn();
    return jsonResponse({ ok: true });
  }

  scheduleTurn() {
    if (this.game === null) return;
    if (this.game.status === 'playing' && this.game.turnSeat >= 0) {
      this.ctx.storage.setAlarm(Date.now() + this.game.config.turnTimeoutMs);
    } else {
      this.ctx.storage.deleteAlarm();
    }
  }

  async alarm() {
    if (this.game === null || this.game.status !== 'playing' || this.game.turnSeat < 0) return;
    const seat = this.game.turnSeat;
    try {
      this.game.act(seat, 'fold');
      await this.persist();
      this.broadcast();
      this.scheduleTurn();
    } catch {
      /* already acted */
    }
  }

  broadcast() {
    for (const player of this.players) {
      this.send(player.seat, { type: 'state', state: this.stateFor(player.seat) });
    }
  }

  send(seat, payload) {
    const frame = JSON.stringify(payload);
    for (const socket of this.socketsFor(seat)) {
      try { socket.send(frame); } catch { /* closed */ }
    }
  }

  sendError(seat, message) {
    this.send(seat, { type: 'error', error: message });
  }
}
