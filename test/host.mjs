import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { apply } from '../index.js';

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

const routes = new Map();
const ctx = {
  get: () => undefined,
  effect: (fn) => fn(),
  webServer: { register: (route) => { routes.set(route.path, route.handler); return () => {}; } },
};
apply(ctx);

const callPath = (path, query) => new Promise((resolve) => {
  const res = { statusCode: 200, setHeader() {}, end(body) { resolve(JSON.parse(body)); } };
  routes.get(path)({ method: 'GET', url: `${path}${query}` }, res);
});
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

const failures = [];
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

console.log('toc:', toc.title, toc.encoding, toc.chapters.map((c) => c.title).join(' | '));
console.log('chapter:', chapter.chapterTitle, JSON.stringify(chapter.text.slice(0, 20)));
console.log('gbk:', gbk.encoding, gbkChapter.chapterTitle);
console.log('bad path:', JSON.stringify(bad));
console.log('proxy:', proxied.charset, proxied.status, proxied.finalUrl);
console.log('proxy redirect:', redirected.finalUrl, redirected.charset);
console.log(failures.length === 0 ? 'host OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
