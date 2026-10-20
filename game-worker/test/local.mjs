/**
 * Local integration test for the Cloudflare Worker + Durable Object room.
 * Run after `npm run dev` is listening on 8787 (or set WORKER_URL).
 */

const base = process.env.WORKER_URL ?? 'http://127.0.0.1:8787';
const wsBase = base.replace(/^http/i, 'ws');
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

function connect(code, token) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${wsBase}/api/rooms/${code}/ws?token=${token}`);
    const messages = [];
    const waiters = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      messages.push(message);
      for (const waiter of [...waiters]) {
        if (waiter.predicate(message)) {
          waiters.splice(waiters.indexOf(waiter), 1);
          waiter.resolve(message);
        }
      }
    });
    socket.addEventListener('open', () => resolve({
      socket,
      messages,
      wait(predicate, timeoutMs = 3000) {
        const existing = messages.find(predicate);
        if (existing !== undefined) return Promise.resolve(existing);
        return new Promise((resolveWait, rejectWait) => {
          const timer = setTimeout(() => {
            const index = waiters.findIndex((entry) => entry.resolve === resolveWait);
            if (index >= 0) waiters.splice(index, 1);
            rejectWait(new Error('timeout waiting for state'));
          }, timeoutMs);
          waiters.push({
            predicate,
            resolve: (message) => { clearTimeout(timer); resolveWait(message); },
          });
        });
      },
      send(payload) { socket.send(JSON.stringify(payload)); },
      close() { try { socket.close(); } catch { /* closed */ } },
    }));
    socket.addEventListener('error', () => reject(new Error('websocket error')));
  });
}

const health = await call('GET', '/api/health');
check('health', health.status === 200 && health.payload.ok === true);

const created = await call('POST', '/api/rooms', { name: '房主' });
check('create', created.status === 200 && typeof created.payload.roomCode === 'string', JSON.stringify(created.payload));
const code = created.payload.roomCode;
const ownerToken = created.payload.token;
check('create transport ws', created.payload.transport === 'ws');

const joined = await call('POST', `/api/rooms/${code}/join`, { name: '玩家B' });
check('join', joined.status === 200 && joined.payload.seat === 1, JSON.stringify(joined.payload));
const guestToken = joined.payload.token;

const owner = await connect(code, ownerToken);
const guest = await connect(code, guestToken);
const state = await owner.wait((message) => message.type === 'state' && message.state.players.length === 2);
check('ws state', state.state.status === 'waiting' && state.state.players.length === 2);
check('own hand hidden', state.state.yourCards.length === 0);
check('other hand hidden', state.state.players[1].cards.length === 0);

owner.send({ type: 'start' });
const playing = await owner.wait((message) => message.type === 'state' && message.state.status === 'playing');
check('started', playing.state.status === 'playing');
check('dealt', playing.state.yourCards.length === 0); // still hidden until look

let snapshot = playing.state;

const tokens = [ownerToken, guestToken];
for (let step = 0; step < 8 && snapshot.status === 'playing'; step += 1) {
  const seat = snapshot.turnSeat;
  const active = seat === 0 ? owner : guest;
  if (step === 0) {
    active.send({ type: 'action', action: 'look' });
    const looked = await active.wait((message) => message.type === 'state' && message.state.yourSeen === true);
    check('look reveals own hand', looked.state.yourCards.length === 3);
    snapshot = looked.state;
    continue;
  }
  active.send({ type: 'action', action: 'fold' });
  const next = await owner.wait((message) => message.type === 'state' && message.state.status === 'settled');
  snapshot = next.state;
}

check('settled', snapshot.status === 'settled');
check('result', snapshot.result !== null && Array.isArray(snapshot.result.winners));
const next = await call('POST', `/api/rooms/${code}/next`, { token: ownerToken });
check('next via http', next.status === 200, JSON.stringify(next.payload));

owner.close();
guest.close();
await new Promise((resolve) => setTimeout(resolve, 50));

console.log('room:', code, 'status:', snapshot.status, 'winners:', JSON.stringify(snapshot.result?.winners));
console.log(failures.length === 0 ? 'cloud game worker OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
