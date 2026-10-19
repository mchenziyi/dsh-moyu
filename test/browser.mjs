/**
 * Optional browser test for the AI source parser.
 *
 * Runs the real client half in headless Chromium with a real DOM, a mocked
 * `/moyu/online/proxy` (fixture pages) and a mocked `/moyu/online/ai` (canned
 * selectors). It covers the browser-side pipeline: GET-form detection,
 * model-assisted homepage analysis, page evidence, selector probing, retry
 * feedback, and rule assembly. The model itself is stubbed; the Host endpoint
 * has its own tests in `test/host.mjs`.
 *
 * Run with:
 *   npm install --no-save playwright-core
 *   node test/browser.mjs
 *
 * Set `CHROME_PATH` if the cached Playwright Chromium is not under the default
 * cache directory.
 */
import http from 'node:http';
import { readdir, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = join(repo, 'client.js');

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.log('browser test skipped: playwright-core is not installed');
  process.exit(0);
}

async function findChromium() {
  if (typeof process.env.CHROME_PATH === 'string' && process.env.CHROME_PATH !== '') return process.env.CHROME_PATH;
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH
    ?? (process.platform === 'darwin'
      ? join(process.env.HOME, 'Library/Caches/ms-playwright')
      : join(process.env.HOME, '.cache/ms-playwright'));
  let entries = [];
  try {
    entries = await readdir(cache);
  } catch {
    return undefined;
  }
  const candidates = entries
    .filter((entry) => entry.startsWith('chromium-'))
    .sort()
    .reverse()
    .flatMap((entry) => [
      join(cache, entry, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      join(cache, entry, 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      join(cache, entry, 'chrome-linux/chrome'),
      join(cache, entry, 'chrome-linux64/chrome'),
    ]);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* try the next layout */
    }
  }
  return undefined;
}

const executablePath = await findChromium();
if (executablePath === undefined) {
  console.log('browser test skipped: no Playwright Chromium found');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const searchFormHome = `<!doctype html><html><head><title>测试小说网 - 首页</title></head><body>
<form method="get" action="/search.php"><input name="keyword" placeholder="搜索书名"></form>
<div class="hot"><a href="/book/1/">斗破苍穹</a></div>
</body></html>`;

const llmSearchHome = `<!doctype html><html><head><title>LLM 小说网 - 首页</title></head><body>
<header class="nav"><a href="/">首页</a><a href="/sort/1/">玄幻</a></header>
<div class="hot"><a href="/book/9/">遮天</a></div>
</body></html>`;

function bookPage(chapterCount = 6) {
  return `<!doctype html><html><head><title>测试书 - 测试小说网</title></head><body>
<h1 class="bookname">斗破苍穹</h1>
<div id="list"><dl>
${Array.from({ length: chapterCount }, (_, index) => `<dd><a href="${index + 1}.html">第${index + 1}章 标题${index + 1}</a></dd>`).join('')}
</dl></div>
</body></html>`;
}

function chapterPage(title = '第1章 标题1') {
  const text = Array.from({ length: 40 }, (_, index) => `这是第${index + 1}段正文内容，写得足够长以便通过校验。`).join('<br>');
  return `<!doctype html><html><head><title>${title} - 斗破苍穹</title></head><body>
<h1>${title}</h1>
<div class="read-ad">广告位</div>
<div id="content">${text}</div>
</body></html>`;
}

const searchPage = (keyword) => `<!doctype html><html><head><title>搜索 ${keyword}</title></head><body>
<div class="result-list">
  <div class="result-item"><a class="title" href="/book/1/">斗破苍穹</a><span class="author">天蚕土豆</span></div>
  <div class="result-item"><a class="title" href="/book/2/">武动乾坤</a><span class="author">天蚕土豆</span></div>
  <div class="result-item"><a class="title" href="/book/3/">大主宰</a><span class="author">天蚕土豆</span></div>
</div>
</body></html>`;

const paddedSearchPage = (keyword) => searchPage(keyword).replace('</body>', `<div style="display:none">${'填充内容'.repeat(400)}</div></body>`);

const AI_REPLIES = {
  homepage: { name: '测试小说网', baseUrl: 'https://site.test', searchUrl: 'https://site.test/search.php?keyword={{keyword}}', sampleBookUrl: 'https://site.test/book/1/' },
  search: { search: { url: '', list: '.result-item', title: '.title', author: '.author', bookUrl: 'a@href' } },
  toc: { toc: { list: '#list dd a', title: '@text', chapterUrl: '@href', bookTitle: 'h1' } },
  content: { content: { text: '#content', remove: ['.read-ad'] } },
};

const shell = '<!doctype html><html><head><meta charset="utf-8"><title>moyu harness</title></head><body></body></html>';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(shell);
});
await new Promise((resolveStart) => server.listen(0, '127.0.0.1', resolveStart));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath, headless: true });

async function runInPage({ pages, replies, startUrl, keyword, failFirstSearch = false, homepageReply, bookUrl }) {
  const page = await browser.newPage();
  await page.goto(origin);
  await page.addScriptTag({ content: 'window.__ModuleLoader__ = { load(registration) { window.__captured = registration; } };' });
  await page.addScriptTag({ path: clientPath });
  const result = await page.evaluate(async ({ pages, replies, startUrl, keyword, failFirstSearch, homepageReply, bookUrl }) => {
    const loader = window.__captured;
    if (loader === undefined) throw new Error('client bundle did not register');
    const React = {
      Fragment: Symbol('Fragment'),
      createElement(type, props, ...children) { return { type, props: props ?? {}, children }; },
      useState(initial) { return [typeof initial === 'function' ? initial() : initial, () => {}]; },
      useEffect() {},
      useRef(initial) { return { current: initial }; },
      useMemo(fn) { return fn(); },
    };
    const plugin = loader.factory((name) => {
      if (name === 'react') return React;
      throw new Error(`unexpected require ${name}`);
    });
    const scope = {
      effect: (fn) => fn(),
      slots: { inject: (_owner, callback) => callback(), register: () => () => {} },
      locale: { register: () => () => {}, bind: () => (key) => key, getLocale: () => ({ active: 'zh' }), subscribe: () => () => {} },
      shortcuts: { register: () => () => {} },
      sidebarRight: { openTab() {}, close() {}, active: () => null },
      sidebarRightTabs: { register: () => () => {} },
    };
    const provided = {};
    const ctx = {
      effect: (fn) => fn(),
      provide: (name, value) => { provided[name] = value; return () => {}; },
      inject: (_names, callback) => callback(scope),
      slots: scope.slots,
      locale: scope.locale,
      get: () => undefined,
    };
    plugin.apply(ctx);
    const service = provided.moyu;
    if (service === undefined) throw new Error('moyu service missing');

    const calls = { ai: [], proxy: [] };
    window.fetch = async (input, init) => {
      const url = new URL(String(input), location.href);
      if (url.pathname === '/moyu/online/proxy') {
        const target = url.searchParams.get('url');
        calls.proxy.push(target);
        const body = pages[target];
        if (body === undefined) return { ok: false, status: 404, json: async () => ({ message: `no fixture ${target}` }) };
        return { ok: true, status: 200, json: async () => ({ ok: true, status: 200, finalUrl: target, contentType: 'text/html; charset=utf-8', charset: 'utf-8', bytes: body.length, text: body }) };
      }
      if (url.pathname === '/moyu/online/ai') {
        const payload = JSON.parse(init?.body ?? '{}');
        calls.ai.push({
          stage: payload.stage,
          hasHints: typeof payload.hints === 'string' && payload.hints.length > 0,
          hasError: typeof payload.error === 'string' && payload.error !== '',
        });
        let reply = replies[payload.stage] ?? {};
        if (payload.stage === 'homepage' && homepageReply !== undefined) reply = homepageReply;
        if (payload.stage === 'search' && failFirstSearch && payload.error === undefined) {
          reply = { search: { url: '', list: '.does-not-exist', title: '', author: '', bookUrl: '' } };
        }
        return { ok: true, status: 200, json: async () => ({ stage: payload.stage, model: { provider: 'mock', model: 'mock' }, result: reply }) };
      }
      return { ok: false, status: 404, json: async () => ({ message: 'unexpected route' }) };
    };

    const parsed = await service.parseSourceWithAi(startUrl, keyword, bookUrl === undefined ? {} : { bookUrl });
    return { parsed, calls };
  }, { pages, replies, startUrl, keyword, failFirstSearch, homepageReply, bookUrl });
  await page.close();
  return result;
}

const failures = [];

// 1. homepage with a GET search form: detection → search → TOC → content,
//    including one validation retry for the search selectors.
const first = await runInPage({
  startUrl: 'https://site.test/',
  keyword: '斗破',
  failFirstSearch: true,
  replies: AI_REPLIES,
  pages: {
    'https://site.test/': searchFormHome,
    'https://site.test/search.php?keyword=%E6%96%97%E7%A0%B4': searchPage('斗破'),
    'https://site.test/book/1/': bookPage(),
    'https://site.test/book/1/1.html': chapterPage(),
  },
});
const parsed = first.parsed;
if (parsed?.rule?.search?.list !== '.result-item') failures.push(`search.list ${parsed?.rule?.search?.list}`);
if (parsed?.rule?.toc?.list !== '#list dd a') failures.push(`toc.list ${parsed?.rule?.toc?.list}`);
if (parsed?.rule?.content?.text !== '#content') failures.push(`content.text ${parsed?.rule?.content?.text}`);
if (parsed?.rule?.content?.remove?.[0] !== '.read-ad') failures.push('content.remove');
if (parsed?.rule?.search?.url !== 'https://site.test/search.php?keyword={{keyword}}') failures.push(`search.url ${parsed?.rule?.search?.url}`);
if (parsed?.book?.url !== 'https://site.test/book/1/') failures.push(`book.url ${parsed?.book?.url}`);
if (parsed?.book?.author !== '天蚕土豆') failures.push(`book.author ${parsed?.book?.author}`);
if (!String(parsed?.log ?? '').includes('目录：6 章')) failures.push('TOC count missing');
if (!String(parsed?.log ?? '').includes('搜索模板：https://site.test/search.php?keyword={{keyword}}')) failures.push('search template lost placeholder');
if (!String(parsed?.log ?? '').includes('正文：')) failures.push('content length missing');
if (parsed?.rule?.baseUrl !== 'https://site.test') failures.push(`baseUrl ${parsed?.rule?.baseUrl}`);
if (parsed?.rule?.name !== '测试小说网') failures.push(`name ${parsed?.rule?.name}`);
const firstStages = first.calls.ai.map((call) => call.stage);
if (!firstStages.includes('search') || !firstStages.includes('toc') || !firstStages.includes('content')) failures.push(`stages ${firstStages.join(',')}`);
if (firstStages.filter((stage) => stage === 'search').length < 2) failures.push('search retry not attempted');
if (!first.calls.ai.every((call) => call.hasHints)) failures.push('hints missing from a request');
if (!first.calls.ai.some((call) => call.hasError)) failures.push('retry feedback missing');

// 2. homepage without a GET form: the model supplies the search template.
const second = await runInPage({
  startUrl: 'https://site3.test/',
  keyword: '遮天',
  replies: AI_REPLIES,
  homepageReply: { name: 'LLM 书源', baseUrl: 'https://site3.test', searchUrl: 'https://site3.test/s?q={{keyword}}', sampleBookUrl: 'https://site3.test/book/9/' },
  pages: {
    'https://site3.test/': llmSearchHome,
    'https://site3.test/s?q=%E9%81%AE%E5%A4%A9': searchPage('遮天'),
    'https://site3.test/book/1/': bookPage(),
    'https://site3.test/book/1/1.html': chapterPage(),
  },
});
if (second.parsed?.rule?.search?.url !== 'https://site3.test/s?q={{keyword}}') failures.push(`llm search.url ${second.parsed?.rule?.search?.url}`);
if (second.parsed?.rule?.name !== 'LLM 书源') failures.push(`llm name ${second.parsed?.rule?.name}`);
if (!second.calls.ai.some((call) => call.stage === 'homepage')) failures.push('homepage stage not called');
if (second.parsed?.book?.url !== 'https://site3.test/book/1/') failures.push(`llm book.url ${second.parsed?.book?.url}`);

// 3. the URL itself is a book page: no search form and no homepage hints, so
//    the pipeline falls back to a TOC/content-only source.
const third = await runInPage({
  startUrl: 'https://book.test/7/',
  keyword: '无',
  replies: AI_REPLIES,
  homepageReply: { name: '书页源', baseUrl: 'https://book.test', searchUrl: '', sampleBookUrl: '' },
  pages: {
    'https://book.test/7/': bookPage(4),
    'https://book.test/7/1.html': chapterPage(),
  },
});
if (third.parsed?.rule?.search !== null) failures.push(`book-page search ${JSON.stringify(third.parsed?.rule?.search)}`);
if (third.parsed?.book?.url !== 'https://book.test/7/') failures.push(`book-page url ${third.parsed?.book?.url}`);
if (third.parsed?.rule?.toc?.list !== '#list dd a') failures.push('book-page toc');
if (!String(third.parsed?.log ?? '').includes('未识别到搜索入口')) failures.push('book-page note missing');

// 4. homepage has no form and the model finds no search URL: the client probes
//    conventional GET search URLs and uses the first one that returns the keyword.
const fourth = await runInPage({
  startUrl: 'https://probe.test/',
  keyword: '遮天',
  replies: AI_REPLIES,
  homepageReply: { name: '探测书源', baseUrl: 'https://probe.test', searchUrl: '', sampleBookUrl: '' },
  pages: {
    'https://probe.test/': `<html><head><title>探测小说网</title></head><body><div class="hot"><a href="/book/1/">遮天</a></div></body></html>`,
    'https://probe.test/search?q=%E9%81%AE%E5%A4%A9': paddedSearchPage('遮天'),
    'https://probe.test/book/1/': bookPage(),
    'https://probe.test/book/1/1.html': chapterPage(),
  },
});
if (fourth.parsed?.rule?.search?.url !== 'https://probe.test/search?q={{keyword}}') failures.push(`probe search.url ${fourth.parsed?.rule?.search?.url}`);
if (!String(fourth.parsed?.log ?? '').includes('探测到搜索地址')) failures.push('probe log missing');
if (fourth.parsed?.book?.url !== 'https://probe.test/book/1/') failures.push(`probe book.url ${fourth.parsed?.book?.url}`);

await browser.close();
server.close();

console.log('1 rule:', JSON.stringify(parsed?.rule));
console.log('2 rule:', JSON.stringify(second.parsed?.rule));
console.log('3 rule:', JSON.stringify(third.parsed?.rule));
console.log('4 rule:', JSON.stringify(fourth.parsed?.rule));
console.log(failures.length === 0 ? 'browser OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
