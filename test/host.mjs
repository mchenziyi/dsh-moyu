import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { apply, buildAiPrompt, parseAiJson, normalizeAiResult } from '../index.js';

const dir = mkdtempSync(join(tmpdir(), 'moyu-'));
const utf8Path = join(dir, '测试小说.txt');
const gbkPath = join(dir, 'gbk小说.txt');

const utf8 = [
  '书名：测试小说',
  '',
  '第一章 开端',
  '这是第一章的正文。',
  '第二行内容。',
  '',
  '第二章 发展',
  '这是第二章的正文。',
  '',
  '番外 小记',
  '这是番外的内容。',
  '',
].join('\n');
writeFileSync(utf8Path, utf8);
writeFileSync(gbkPath, execFileSync('iconv', ['-f', 'UTF-8', '-t', 'GBK'], { input: utf8 }));

// ---------------------------------------------------------------------------
// AI endpoint fixtures: a fake LLM that answers one stage per prompt.
// ---------------------------------------------------------------------------

const AI_REPLIES = {
  homepage: '```json\n{"name":"测试书源","baseUrl":"https://site.test","searchUrl":"https://site.test/search?q={{keyword}}","sampleBookUrl":"https://site.test/book/1"}\n```',
  search: '{"search":{"url":"","list":".result-item","title":".title","author":".author","bookUrl":"a@href"}}',
  toc: '{"toc":{"list":"#list dd a","title":"@text","chapterUrl":"@href","bookTitle":"h1"}}',
  content: '{"content":{"text":"#content","remove":[".ads"]}}',
};

let llmMode = 'ok';
let lastPrompt = '';

function stageOf(text) {
  if (text.includes('页面类型：站点首页')) return 'homepage';
  if (text.includes('页面类型：搜索结果页')) return 'search';
  if (text.includes('页面类型：书籍详情')) return 'toc';
  return 'content';
}

const fakeLlm = {
  async *stream(options) {
    const user = String(options?.messages?.[0]?.content?.[0]?.text ?? '');
    lastPrompt = user;
    if (llmMode === 'throw') throw new Error('provider exploded');
    if (llmMode === 'empty') {
      yield { type: 'finish', reason: { kind: 'stop' } };
      return;
    }
    const reply = AI_REPLIES[stageOf(user)];
    yield { type: 'text-delta', index: 0, text: reply };
    yield { type: 'finish', reason: { kind: 'stop' } };
  },
  listProviders: () => (llmMode === 'no-model' ? [] : [{ id: 'test-provider', name: 'Test' }]),
  async listModels() {
    return [{ id: 'test-model', name: 'Test' }];
  },
};

function makeContext(options = {}) {
  const routes = new Map();
  const ctx = {
    get: (name) => {
      if (name === 'agentDefaultModel') {
        if (options.defaultModel === false) return undefined;
        return { currentSelection: () => ({ provider: 'test-provider', model: 'test-model' }) };
      }
      if (name === 'connection') return options.connection;
      return undefined;
    },
    effect: (fn) => fn(),
    llm: options.llm ?? fakeLlm,
    webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {}; } },
  };
  apply(ctx);
  return { ctx, routes };
}

function callGetRaw(routes, path, query = '') {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) { this.headers[key] = value; },
      end(body) { resolve({ status: this.statusCode, body: body === undefined || body === '' ? null : JSON.parse(body) }); },
    };
    routes.get(path)({ method: 'GET', url: `${path}${query}` }, res);
  });
}

async function callGet(routes, path, query = '') {
  return (await callGetRaw(routes, path, query)).body;
}

function callPost(routes, path, payload, options = {}) {
  return new Promise((resolve) => {
    const body = Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
    const req = {
      method: 'POST',
      url: path,
      async *[Symbol.asyncIterator]() {
        if (options.chunks === undefined) {
          yield body;
          return;
        }
        for (const chunk of options.chunks) yield chunk;
      },
    };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) { this.headers[key] = value; },
      end(text) { resolve({ status: this.statusCode, body: text === undefined || text === '' ? null : JSON.parse(text) }); },
    };
    routes.get(path)(req, res);
  });
}

// ---------------------------------------------------------------------------
// local books and proxy (unchanged behaviour)
// ---------------------------------------------------------------------------

const main = makeContext();
const routes = main.routes;
const callPath = (path, query) => callGet(routes, path, query);
const call = (kind, query) => callPath(`/moyu/local/${kind}`, query);

const toc = await call('toc', `?path=${encodeURIComponent(utf8Path)}`);
const chapter = await call('chapter', `?path=${encodeURIComponent(utf8Path)}&index=2`);
const gbk = await call('toc', `?path=${encodeURIComponent(gbkPath)}`);
const gbkChapter = await call('chapter', `?path=${encodeURIComponent(gbkPath)}&index=3`);
const bad = await call('toc', '?path=relative.txt');

// online proxy: utf-8, gbk, redirect
const pageHtml = '<html><head><meta charset="utf-8"><title>t</title></head><body><p>中文内容</p></body></html>';
const gbkHtml = '<html><head><meta charset="gbk"><title>g</title></head><body><p>中文内容</p></body></html>';
const gbkBytes = execFileSync('iconv', ['-f', 'UTF-8', '-t', 'GBK'], { input: gbkHtml });
const server = http.createServer((req, res) => {
  if (req.url === '/gbk') {
    res.writeHead(200, { 'content-type': 'text/html; charset=GBK' });
    res.end(gbkBytes);
  } else if (req.url === '/redirect') {
    res.writeHead(302, { location: '/utf8' });
    res.end();
  } else {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(pageHtml);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const proxied = await callPath('/moyu/online/proxy', `?url=${encodeURIComponent(`http://127.0.0.1:${port}/gbk`)}`);
const redirected = await callPath('/moyu/online/proxy', `?url=${encodeURIComponent(`http://127.0.0.1:${port}/redirect`)}`);
const badProtocol = await callPath('/moyu/online/proxy', `?url=${encodeURIComponent('file:///etc/passwd')}`);
server.close();

// ---------------------------------------------------------------------------
// AI rules endpoint
// ---------------------------------------------------------------------------

const aiPath = '/moyu/online/ai';
const html = '<html><body><div class="result-list"><a href="/book/1">书</a></div></body></html>';

const aiHome = await callPost(routes, aiPath, { stage: 'homepage', url: 'https://site.test/', keyword: '测试', html });
const aiSearch = await callPost(routes, aiPath, { stage: 'search', url: 'https://site.test/search?q=x', keyword: '测试', html });
const aiToc = await callPost(routes, aiPath, { stage: 'toc', url: 'https://site.test/book/1', html, hints: '重复块候选：.list' });
const aiContent = await callPost(routes, aiPath, { stage: 'content', url: 'https://site.test/book/1/1', html });
const aiBadStage = await callPost(routes, aiPath, { stage: 'nope', url: 'https://site.test/', html });
const aiNoBody = await callPost(routes, aiPath, '');
const aiGet = await callGetRaw(routes, aiPath);
const aiTruncated = await callPost(routes, aiPath, { stage: 'homepage', url: 'https://site.test/', html: 'x'.repeat(200_000) });
const truncatedPrompt = lastPrompt;

// no model / failing model / empty output
llmMode = 'no-model';
const noModelCtx = makeContext({ defaultModel: false });
const noModel = await callPost(noModelCtx.routes, aiPath, { stage: 'homepage', url: 'https://site.test/', html });
llmMode = 'throw';
const failing = await callPost(routes, aiPath, { stage: 'homepage', url: 'https://site.test/', html });
llmMode = 'empty';
const empty = await callPost(routes, aiPath, { stage: 'homepage', url: 'https://site.test/', html });
llmMode = 'ok';

// trust fence
const fenced = makeContext({ connection: { requestRejection: () => 403 } });
const fencedReply = await callPost(fenced.routes, aiPath, { stage: 'homepage', url: 'https://site.test/', html });

// body too large (iterated in chunks)
const large = await callPost(routes, aiPath, '{}', { chunks: [Buffer.alloc(2 * 1024 * 1024, 0x61), Buffer.alloc(3 * 1024 * 1024, 0x61)] });

// ---------------------------------------------------------------------------
// exported AI helpers
// ---------------------------------------------------------------------------

const failures = [];
const fencedJson = parseAiJson('```json\n{"a":1}\n```');
const withProse = parseAiJson('好的，结果如下：{"stage":"toc"} 希望有帮助');
const trailingComma = parseAiJson('{"a":1,}');
let invalidJson = false;
try { parseAiJson('not json at all'); } catch { invalidJson = true; }
let incompleteJson = false;
try { parseAiJson('{"a":{"b":1}'); } catch { incompleteJson = true; }

const normalizedSearch = normalizeAiResult('search', {
  search: { list: '.item', title: 'a@text', extra: 'ignored', author: 42 },
  junk: 'ignored',
});
const normalizedContent = normalizeAiResult('content', {
  content: { text: '#content', remove: ['.ads', 7, '', '  .nav  '] },
});
const feedbackPrompt = buildAiPrompt('content', {
  url: 'https://site.test/book/1/1.html',
  keyword: '测试',
  hints: '推荐正文容器：#content',
  html: '<html><body><div id="content">正文</div></body></html>',
  previous: { content: { text: '.wrong' } },
  error: '正文选择器没有匹配到内容',
});

if (fencedJson.a !== 1) failures.push('parseAiJson fenced');
if (withProse.stage !== 'toc') failures.push('parseAiJson prose');
if (trailingComma.a !== 1) failures.push('parseAiJson trailing comma');
if (!invalidJson) failures.push('parseAiJson accepted garbage');
if (!incompleteJson) failures.push('parseAiJson accepted incomplete object');
if (normalizedSearch.search.extra !== undefined) failures.push('normalizeAiResult kept unknown search field');
if (normalizedSearch.junk !== undefined) failures.push('normalizeAiResult kept unknown root field');
if (normalizedSearch.search.author !== '') failures.push('normalizeAiResult author type');
if (normalizedContent.content.remove.join(',') !== '.ads,.nav') failures.push(`normalizeAiResult remove ${JSON.stringify(normalizedContent.content.remove)}`);
if (!feedbackPrompt.includes('<page_html>')) failures.push('prompt html fence');
if (!feedbackPrompt.includes('正文选择器没有匹配到内容')) failures.push('prompt feedback error');
if (!feedbackPrompt.includes('上一次返回')) failures.push('prompt feedback previous');
if (!feedbackPrompt.includes('推荐正文容器')) failures.push('prompt hints');

if (toc.encoding !== 'utf-8') failures.push(`utf8 encoding ${toc.encoding}`);
if (toc.title !== '测试小说') failures.push(`title ${toc.title}`);
if (!Array.isArray(toc.chapters) || toc.chapters.length !== 4) failures.push(`chapters ${JSON.stringify(toc.chapters)}`);
if (!chapter.text.includes('这是第二章的正文')) failures.push('chapter text');
if (gbk.encoding !== 'gb18030') failures.push(`gbk encoding ${gbk.encoding}`);
if (!gbkChapter.text.includes('这是番外')) failures.push('gbk chapter');
if (bad.error === undefined) failures.push('relative path accepted');
if (proxied.status !== 200 || !String(proxied.text).includes('中文内容')) failures.push('proxy gbk decode');
if (!String(proxied.charset).includes('gb')) failures.push(`proxy charset ${proxied.charset}`);
if (redirected.finalUrl === undefined || !String(redirected.finalUrl).includes('/utf8')) failures.push('proxy redirect');
if (badProtocol.error === undefined) failures.push('proxy accepted file://');

if (aiHome.status !== 200) failures.push(`ai homepage status ${aiHome.status}`);
if (aiHome.body?.result?.name !== '测试书源') failures.push(`ai homepage name ${JSON.stringify(aiHome.body)}`);
if (aiHome.body?.result?.searchUrl !== 'https://site.test/search?q={{keyword}}') failures.push('ai homepage search template');
if (aiHome.body?.model?.model !== 'test-model') failures.push('ai model echo');
if (aiSearch.body?.result?.search?.list !== '.result-item') failures.push('ai search result');
if (aiToc.body?.result?.toc?.bookTitle !== 'h1') failures.push('ai toc result');
if (aiContent.body?.result?.content?.text !== '#content') failures.push('ai content result');
if (!Array.isArray(aiContent.body?.result?.content?.remove)) failures.push('ai content remove array');
if (aiBadStage.status !== 400 || aiBadStage.body?.error !== 'bad-request') failures.push(`ai bad stage ${aiBadStage.status} ${JSON.stringify(aiBadStage.body)}`);
if (aiNoBody.status !== 400) failures.push(`ai empty body ${aiNoBody.status}`);
if (aiGet.status !== 405) failures.push(`ai GET ${aiGet.status}`);
if (aiTruncated.status !== 200) failures.push('ai truncated html failed');
if (!truncatedPrompt.includes('页面 HTML 已截断')) failures.push('ai html not truncated');
if (truncatedPrompt.length > 130_000) failures.push(`ai prompt too large ${truncatedPrompt.length}`);
if (noModel.status !== 503 || noModel.body?.error !== 'ai-unavailable') failures.push(`ai no model ${noModel.status} ${JSON.stringify(noModel.body)}`);
if (failing.status !== 502 || failing.body?.error !== 'ai-failed') failures.push(`ai failure ${failing.status}`);
if (empty.status !== 502) failures.push(`ai empty output ${empty.status}`);
if (fencedReply.status !== 403) failures.push(`ai trust fence ${fencedReply.status}`);
if (large.status !== 413) failures.push(`ai large body ${large.status}`);

console.log('toc:', toc.title, toc.encoding, toc.chapters.map((c) => c.title).join(' | '));
console.log('chapter:', chapter.chapterTitle, JSON.stringify(chapter.text.slice(0, 20)));
console.log('gbk:', gbk.encoding, gbkChapter.chapterTitle);
console.log('bad path:', JSON.stringify(bad));
console.log('proxy:', proxied.charset, proxied.status, proxied.finalUrl);
console.log('proxy redirect:', redirected.finalUrl, redirected.charset);
console.log('ai home:', JSON.stringify(aiHome.body?.result));
console.log('ai search:', JSON.stringify(aiSearch.body?.result));
console.log('ai toc:', JSON.stringify(aiToc.body?.result));
console.log('ai content:', JSON.stringify(aiContent.body?.result));
console.log('ai guards:', aiBadStage.status, aiGet.status, noModel.status, failing.status, empty.status, fencedReply.status, large.status);
console.log(failures.length === 0 ? 'host OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
