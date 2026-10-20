import { createGameServer } from '../game/server.js';

const server = await createGameServer({ port: 0, host: '127.0.0.1' });
const base = `http://127.0.0.1:${server.port}`;
const failures = [];
const check = (name, condition, detail) => {
  if (!condition) failures.push(`${name}${detail === undefined ? '' : ` (${detail})`}`);
};

async function call(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

const health = await call('GET', '/api/health');
check('health', health.status === 200 && health.payload.ok === true);

const created = await call('POST', '/api/rooms', { name: '房主' });
check('create', created.status === 200 && typeof created.payload.roomCode === 'string', JSON.stringify(created.payload));
const roomCode = created.payload.roomCode;
const ownerToken = created.payload.token;

const joined = await call('POST', `/api/rooms/${roomCode}/join`, { name: '玩家B' });
check('join', joined.status === 200 && joined.payload.seat === 1);
const guestToken = joined.payload.token;

const lobby = await call('GET', '/api/rooms');
check('lobby', lobby.payload.rooms.some((room) => room.roomCode === roomCode && room.players === 2));

const badToken = await call('POST', `/api/rooms/${roomCode}/start`, { token: 'nope' });
check('bad token', badToken.status === 403);

const notOwner = await call('POST', `/api/rooms/${roomCode}/start`, { token: guestToken });
check('non-owner start', notOwner.status === 403);

const started = await call('POST', `/api/rooms/${roomCode}/start`, { token: ownerToken });
check('start', started.status === 200, JSON.stringify(started.payload));

const tokens = [ownerToken, guestToken];
let snapshot = (await call('GET', `/api/rooms/${roomCode}/state?token=${ownerToken}`)).payload.state;
check('playing', snapshot.status === 'playing' && snapshot.players.length === 2);
check('own hand hidden before look', snapshot.yourCards.length === 0);
check('other hand hidden', snapshot.players[1].cards.length === 0);

// Take a look, call once, then fold until the hand settles.
const active = snapshot.turnSeat;
const activeToken = tokens[active];
await call('POST', `/api/rooms/${roomCode}/action`, { token: activeToken, action: 'look' });
snapshot = (await call('GET', `/api/rooms/${roomCode}/state?token=${activeToken}`)).payload.state;
check('look reveals own hand', snapshot.yourCards.length === 3 && snapshot.yourSeen === true);
check('opponent still hidden', snapshot.players[1 - active].cards.length === 0);

// Whoever's turn it is folds; once only one player remains the hand settles.
for (let step = 0; step < 4; step += 1) {
  snapshot = (await call('GET', `/api/rooms/${roomCode}/state?token=${ownerToken}`)).payload.state;
  if (snapshot.status !== 'playing') break;
  const seat = snapshot.turnSeat;
  const result = await call('POST', `/api/rooms/${roomCode}/action`, { token: tokens[seat], action: 'fold' });
  check(`fold ${step}`, result.status === 200, JSON.stringify(result.payload));
}

snapshot = (await call('GET', `/api/rooms/${roomCode}/state?token=${ownerToken}`)).payload.state;
check('settled after folds', snapshot.status === 'settled');
check('result present', snapshot.result !== null && Array.isArray(snapshot.result.winners));
check('settled reveals hands', snapshot.players.every((player) => player.cards.length === 0 || player.cards.length === 3));

const next = await call('POST', `/api/rooms/${roomCode}/next`, { token: ownerToken });
check('next hand', next.status === 200, JSON.stringify(next.payload));

const leave = await call('POST', `/api/rooms/${roomCode}/leave`, { token: guestToken });
check('leave', leave.status === 200);

server.close();
await new Promise((resolve) => setTimeout(resolve, 20));

console.log('room:', roomCode, 'seats:', snapshot.players.map((player) => `${player.name}:${player.chips}`).join(', '));
console.log('state:', snapshot.status, 'pot', snapshot.pot, 'result', JSON.stringify(snapshot.result?.winners));
console.log(failures.length === 0 ? 'game server OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
