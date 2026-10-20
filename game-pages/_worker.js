/**
 * Pages edge proxy for the moyu-zjh Worker.
 *
 * workers.dev is blocked by some networks (TLS reset), while pages.dev is
 * reachable. This Pages project does not host the game; it forwards HTTP and
 * WebSocket traffic to the existing Worker/Durable Object deployment.
 */

const UPSTREAM = 'moyu-zjh.chenziyi17673412583.workers.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(request.url);
    target.protocol = 'https:';
    target.hostname = UPSTREAM;
    return fetch(new Request(target.toString(), request));
  },
};
