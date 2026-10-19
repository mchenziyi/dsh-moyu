/**
 * Host half of the 上班摸鱼才叫赚钱 bundle.
 *
 * Serves the local-novel endpoints under `/moyu/*`: one book's table of
 * contents (encoding already resolved, chapters split) and one chapter's text.
 * Files stay on the Host; the browser holds only the bookshelf and progress.
 *
 * Every route answers through the composition's `connection` trust fence and
 * carries `cache-control: no-store`.
 */

import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, extname, isAbsolute } from 'node:path';

export const name = 'moyu';

export const inject = ['webServer', 'connection'];

const PREFIX = '/moyu';
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const CACHE_LIMIT = 6;

/** path -> parsed book, keyed by mtime and size. */
const bookCache = new Map();

function route(ctx, path, handler) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: PREFIX + path,
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('allow', 'GET');
          res.end();
          return;
        }
        const rejection = rejectUntrusted(ctx, req);
        if (rejection !== undefined) {
          res.statusCode = rejection;
          res.end();
          return;
        }
        const url = new URL(String(req.url ?? '/'), 'http://127.0.0.1');
        sendJson(res, 200, await handler(ctx, url));
      } catch (error) {
        const code = typeof error?.code === 'string' ? error.code : 'internal';
        const message = typeof error?.message === 'string' ? error.message : String(error);
        const status = code === 'bad-request' ? 400 : code === 'not-found' ? 404 : 500;
        sendJson(res, status, { error: code, message });
      }
    },
  }), `moyu: GET ${PREFIX}${path}`);
}

function rejectUntrusted(ctx, req) {
  const connection = ctx.get('connection');
  if (connection === undefined || typeof connection.requestRejection !== 'function') return undefined;
  try {
    return connection.requestRejection(req);
  } catch {
    return 403;
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function failure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/** Resolve the `path` request parameter into an absolute file path. */
function resolvePath(url) {
  const raw = url.searchParams.get('path');
  if (raw === null || raw.trim() === '') throw failure('bad-request', 'path is required');
  let value = raw.trim();
  if (value === '~') value = homedir();
  else if (value.startsWith('~/')) value = homedir() + value.slice(1);
  if (!isAbsolute(value)) throw failure('bad-request', 'path must be absolute');
  return value;
}

// ---------------------------------------------------------------------------
// decoding and chapter splitting
// ---------------------------------------------------------------------------

function decode(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return { encoding: 'utf-8', text: new TextDecoder('utf-8').decode(buffer.subarray(3)) };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { encoding: 'utf-16le', text: new TextDecoder('utf-16le').decode(buffer.subarray(2)) };
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return { encoding: 'utf-16be', text: new TextDecoder('utf-16be').decode(buffer.subarray(2)) };
  }
  try {
    return { encoding: 'utf-8', text: new TextDecoder('utf-8', { fatal: true }).decode(buffer) };
  } catch {
    /* not valid UTF-8 */
  }
  try {
    return { encoding: 'gb18030', text: new TextDecoder('gb18030').decode(buffer) };
  } catch {
    /* no gb18030 support */
  }
  return { encoding: 'latin1', text: buffer.toString('latin1') };
}

const CHAPTER_PATTERN = /^[ \t]*(第[0-9零〇一二三四五六七八九十百千万两]+[章节回卷部篇集][^\n]{0,40}|序章[^\n]{0,40}|楔子[^\n]{0,40}|前言[^\n]{0,40}|序言[^\n]{0,40}|后记[^\n]{0,40}|尾声[^\n]{0,40}|番外[^\n]{0,40})[ \t]*$/gm;

/** Split one book into chapter ranges; a book without chapter headings is one chapter. */
function splitChapters(text) {
  const matches = [...text.matchAll(CHAPTER_PATTERN)];
  if (matches.length < 2) {
    return [{ index: 0, title: '全文', start: 0, end: text.length }];
  }
  const chapters = [];
  const firstStart = matches[0].index;
  const preface = text.slice(0, firstStart).trim();
  if (preface !== '') {
    chapters.push({ index: 0, title: '前言', start: 0, end: firstStart });
  }
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    chapters.push({
      index: chapters.length,
      title: matches[i][1].trim(),
      start,
      end,
    });
  }
  return chapters;
}

async function loadBook(url) {
  const filePath = resolvePath(url);
  let info;
  try {
    info = await stat(filePath);
  } catch {
    throw failure('not-found', `cannot read ${filePath}`);
  }
  if (!info.isFile()) throw failure('bad-request', 'path is not a file');
  if (info.size > MAX_FILE_BYTES) throw failure('bad-request', 'file is larger than 64 MiB');

  const cached = bookCache.get(filePath);
  if (cached !== undefined && cached.mtimeMs === info.mtimeMs && cached.size === info.size) {
    return cached;
  }

  const buffer = await readFile(filePath);
  const decoded = decode(buffer);
  const text = decoded.text.replace(/\r\n?/g, '\n');
  const encoding = decoded.encoding;
  const chapters = splitChapters(text);
  const book = {
    path: filePath,
    title: basename(filePath, extname(filePath)),
    encoding,
    size: info.size,
    mtimeMs: info.mtimeMs,
    text,
    chapters,
  };
  bookCache.set(filePath, book);
  while (bookCache.size > CACHE_LIMIT) {
    const oldest = bookCache.keys().next().value;
    bookCache.delete(oldest);
  }
  return book;
}

// ---------------------------------------------------------------------------
// handlers
// ---------------------------------------------------------------------------

async function tocHandler(ctx, url) {
  const book = await loadBook(url);
  return {
    available: true,
    title: book.title,
    encoding: book.encoding,
    size: book.size,
    chapters: book.chapters.map((chapter) => ({
      index: chapter.index,
      title: chapter.title,
      chars: chapter.end - chapter.start,
    })),
  };
}

async function chapterHandler(ctx, url) {
  const book = await loadBook(url);
  const raw = Number(url.searchParams.get('index') ?? '0');
  const index = Number.isInteger(raw) && raw >= 0 ? raw : 0;
  const chapter = book.chapters[index];
  if (chapter === undefined) throw failure('bad-request', `chapter ${index} does not exist`);
  return {
    title: book.title,
    chapter: chapter.index,
    chapterTitle: chapter.title,
    total: book.chapters.length,
    text: book.text.slice(chapter.start, chapter.end),
  };
}

// ---------------------------------------------------------------------------
// online sources: authenticated fetch proxy
// ---------------------------------------------------------------------------

const PROXY_MAX_BYTES = 8 * 1024 * 1024;
const PROXY_TIMEOUT_MS = 15000;

function normalizeCharset(value) {
  const lower = String(value).toLowerCase();
  if (lower === 'gb2312' || lower === 'gbk') return 'gb18030';
  if (lower === 'utf8') return 'utf-8';
  return lower;
}

function detectCharset(contentType, buffer) {
  const fromHeader = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? '');
  if (fromHeader !== null) return normalizeCharset(fromHeader[1]);
  const head = buffer.subarray(0, 4096).toString('latin1');
  const fromMeta = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head);
  if (fromMeta !== null) return normalizeCharset(fromMeta[1]);
  return 'utf-8';
}

async function proxyHandler(ctx, url) {
  const target = url.searchParams.get('url');
  if (target === null || target === '') throw failure('bad-request', 'url is required');
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    throw failure('bad-request', 'url is not valid');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw failure('bad-request', 'only http(s) URLs are allowed');
  }

  let response;
  try {
    response = await fetch(parsed, {
      redirect: 'follow',
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.6',
      },
    });
  } catch (error) {
    throw failure('fetch-failed', String(error?.message ?? error));
  }

  const contentType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > PROXY_MAX_BYTES) throw failure('too-large', 'response is larger than 8 MiB');

  const charset = detectCharset(contentType, buffer);
  let text;
  try {
    text = new TextDecoder(charset).decode(buffer);
  } catch {
    text = new TextDecoder('utf-8').decode(buffer);
  }

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType,
    charset,
    bytes: buffer.length,
    text,
  };
}

export function apply(ctx) {
  route(ctx, '/local/toc', tocHandler);
  route(ctx, '/local/chapter', chapterHandler);
  route(ctx, '/online/proxy', proxyHandler);
}
