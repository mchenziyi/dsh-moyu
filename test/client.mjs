/* Minimal React + DOM harness for the moyu client half. */
const errors = [];
const Fragment = Symbol('Fragment');
const hookStates = new Map();
let currentSlots = null;
let hookIndex = 0;
let pendingEffects = [];
let dirty = false;

function slotsAt(path) {
  let slots = hookStates.get(path);
  if (slots === undefined) { slots = { values: [], effects: [], refs: [] }; hookStates.set(path, slots); }
  return slots;
}
function depsEqual(a, b) {
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (!Object.is(a[i], b[i])) return false;
  return true;
}
const React = {
  Fragment,
  createElement(type, props, ...children) {
    const next = Object.assign({}, props);
    if (children.length > 0) next.children = children.length === 1 ? children[0] : children;
    return { type, props: next };
  },
  useState(initial) {
    const slots = currentSlots; const index = hookIndex++;
    if (!(index in slots.values)) slots.values[index] = typeof initial === 'function' ? initial() : initial;
    return [slots.values[index], (next) => { slots.values[index] = typeof next === 'function' ? next(slots.values[index]) : next; dirty = true; }];
  },
  useEffect(fn, deps) {
    const slots = currentSlots; const index = hookIndex++;
    const previous = slots.effects[index];
    if (previous === undefined || !depsEqual(previous.deps, deps)) { slots.effects[index] = { deps }; pendingEffects.push(fn); }
  },
  useRef(initial) {
    const slots = currentSlots; const index = hookIndex++;
    if (!(index in slots.refs)) slots.refs[index] = { current: initial };
    return slots.refs[index];
  },
  useMemo(fn) { return fn(); },
};

let output = [];
function renderNode(node, path) {
  if (node === null || node === undefined || node === false || node === true) return;
  if (Array.isArray(node)) { node.forEach((child, index) => renderNode(child, `${path}[${index}]`)); return; }
  if (typeof node === 'string' || typeof node === 'number') { output.push(String(node)); return; }
  if (typeof node !== 'object') return;
  const { type, props } = node;
  if (type === Fragment) { renderNode(props.children, path); return; }
  if (typeof type === 'function') {
    const savedSlots = currentSlots; const savedIndex = hookIndex;
    currentSlots = slotsAt(`${path}#${type.name || 'anonymous'}`);
    hookIndex = 0;
    let result;
    try { result = type(props); } catch (error) { errors.push(error); }
    currentSlots = savedSlots; hookIndex = savedIndex;
    renderNode(result, `${path}>${type.name || 'anonymous'}`);
    return;
  }
  if (typeof type === 'string') renderNode(props.children, path);
}
async function renderTree(Component, props, passes = 10) {
  for (let pass = 0; pass < passes; pass += 1) {
    dirty = false; output = []; pendingEffects = []; hookIndex = 0;
    renderNode(React.createElement(Component, props), 'root');
    for (const effect of pendingEffects) { try { effect(); } catch (error) { errors.push(error); } }
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (!dirty) break;
  }
  return output.join(' ');
}

// ---------------- environment ----------------
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.document = { baseURI: 'http://127.0.0.1:49605/', addEventListener() {}, removeEventListener() {}, body: { setAttribute() {}, removeAttribute() {} } };
globalThis.window = { location: { href: 'http://127.0.0.1:49605/' }, addEventListener() {}, removeEventListener() {}, __ModuleLoader__: { load(registration) { globalThis.window.__captured = registration; } } };

const chapterText = (index) => `${index === 0 ? '第一章内容开始。' : '第二章内容开始。'}${'测试内容句子。'.repeat(80)}`;

globalThis.fetch = async (url) => {
  const text = String(url);
  const path = new URL(text, 'http://x').pathname;
  if (path.endsWith('/moyu/local/toc')) {
    return { ok: true, json: async () => ({ available: true, title: '测试小说', encoding: 'utf-8', size: 100, chapters: [{ index: 0, title: '第一章', chars: 500 }, { index: 1, title: '第二章', chars: 500 }] }) };
  }
  if (path.endsWith('/moyu/local/chapter')) {
    const index = Number(new URL(text, 'http://x').searchParams.get('index') ?? '0');
    return { ok: true, json: async () => ({ title: '测试小说', chapter: index, chapterTitle: index === 0 ? '第一章' : '第二章', total: 2, text: chapterText(index) }) };
  }
  return { ok: false, status: 404, json: async () => ({ message: 'missing' }) };
};

await import(new URL('../client.js', import.meta.url));
const plugin = globalThis.window.__captured.factory((name) => { if (name === 'react') return React; throw new Error(`unexpected require ${name}`); });

// ---------------- fake client services ----------------
const slotRegistrations = [];
const dicts = new Map();
const provided = {};
const sidebarCalls = [];
const shortcuts = [];
const sidebarRight = {
  openTab: (kind, options) => sidebarCalls.push({ call: 'openTab', kind, options }),
  close: (id) => sidebarCalls.push({ call: 'close', id }),
  active: () => ({ id: 'tab-reader', kind: 'moyu-reader' }),
};
const sidebarRightTabs = { register: (definition) => { sidebarCalls.push({ call: 'registerType', kind: definition.kind }); return () => {}; } };
const shortcutService = { register: (command) => { shortcuts.push(command); return () => {}; } };
const locale = {
  register: (ns, lang, dict) => { dicts.set(lang, dict); return () => {}; },
  bind: () => (key, params) => {
    let value = (dicts.get('zh') ?? {})[key] ?? key;
    if (params) for (const name of Object.keys(params)) value = value.split(`{${name}}`).join(String(params[name]));
    return value;
  },
  getLocale: () => ({ active: 'zh' }),
  subscribe: () => () => {},
};
const scope = {
  effect: (fn) => fn(),
  slots: { inject: (_owner, callback) => callback(), register: (registration, component) => { slotRegistrations.push({ registration, component }); return () => {}; } },
  locale,
  sidebarRight,
  sidebarRightTabs,
  shortcuts: shortcutService,
};
const ctx = {
  effect: (fn) => fn(),
  provide: (name, value) => { provided[name] = value; return () => {}; },
  inject: (_names, callback) => callback(scope),
  slots: { inject: (_owner, callback) => callback(), register: (registration, component) => { slotRegistrations.push({ registration, component }); return () => {}; } },
  locale,
  get: () => undefined,
};
plugin.apply(ctx);

const t = (key, params) => {
  let value = dicts.get('zh')?.[key] ?? key;
  if (params) for (const name of Object.keys(params)) value = value.split(`{${name}}`).join(String(params[name]));
  return value;
};
const api = provided.moyu;
function storeActiveReset() { api.toggleReading(); api.toggleReading(); }
const failures = [];
if (api === undefined) failures.push('moyu service missing');
if (typeof api?.parseSourceWithAi !== 'function') failures.push('parseSourceWithAi missing');

// registration surface
const settingsIds = slotRegistrations
  .filter((entry) => entry.registration.name === 'settings.section')
  .map((entry) => entry.registration.id);
const names = slotRegistrations.map((entry) => entry.registration.name);
for (const expected of ['conversation.composer.dock', 'conversation.session.header.utilities', 'settings.section', 'sidebar.right.pane.tab']) {
  if (!names.includes(expected)) failures.push(`missing slot ${expected}`);
}
if (shortcuts.length !== 7) failures.push(`shortcuts ${shortcuts.length}`);
if (!shortcuts.some((command) => command.id === 'moyu.boss')) failures.push('boss shortcut missing');
if (!shortcuts.some((command) => command.id === 'moyu.toc')) failures.push('toc shortcut missing');
const byId = (id) => shortcuts.find((command) => command.id === id);
if (byId('moyu.nextPage')?.defaults?.['web:macos']?.code !== 'ArrowDown') failures.push('nextPage binding');
if (byId('moyu.prevPage')?.defaults?.['web:macos']?.code !== 'ArrowUp') failures.push('prevPage binding');
if (byId('moyu.nextChapter')?.defaults?.['web:macos']?.code !== 'ArrowRight') failures.push('nextChapter binding');
if (byId('moyu.prevChapter')?.defaults?.['web:macos']?.code !== 'ArrowLeft') failures.push('prevChapter binding');
if (!byId('moyu.boss')?.defaults?.['web:macos']?.modifiers?.includes('shift')) failures.push('boss shift binding');

// import a book through the api
await api.importBook('/tmp/测试小说.txt');
const statusEntry = slotRegistrations.find((entry) => entry.registration.name === 'conversation.composer.dock');
const Status = statusEntry.component;

// small pages so page turning is observable
api.setSettings({ charsPerPage: 40 });

const barText = await renderTree(Status, { t, api });
for (const needle of ['第一章内容开始', '第 1 章']) {
  if (!barText.includes(needle)) failures.push(`status missing ${needle}`);
}

api.nextPage();
const barText2 = await renderTree(Status, { t, api });
if (barText2 === barText) failures.push('page did not advance');
if (!barText2.includes('第 1 章')) failures.push('chapter meta missing');

// TOC panel
api.openToc();
const tocText = await renderTree(Status, { t, api });
if (!tocText.includes('目录')) failures.push('toc panel missing');
if (!tocText.includes('第一章')) failures.push('toc chapters missing');
api.closeToc();

// jump dialog state
api.jump();
if (storage.get('dsh.moyu.v1') === undefined) failures.push('progress not persisted');
storeActiveReset();

// boss key hides the bar and touches no sidebar tab
const callsBeforeBoss = sidebarCalls.length;
api.boss();
const hiddenBar = await renderTree(Status, { t, api });
if (hiddenBar.trim() !== '') failures.push('boss did not hide the status bar');
if (sidebarCalls.length !== callsBeforeBoss) failures.push('boss opened a sidebar tab');
// reopening restores the reading surface
api.toggleReading();
const restored = await renderTree(Status, { t, api });
if (!restored.includes('第一章内容开始') && !restored.includes('测试内容句子')) failures.push('reading not restored');

// settings page
const settingsEntry = slotRegistrations.find((entry) => entry.registration.name === 'settings.section');
const settingsText = await renderTree(settingsEntry.component, { t, api });
for (const needle of ['上班摸鱼才叫赚钱', '测试小说', '导入', '书架', '找书', '在线书源', '设置']) {
  if (!settingsText.includes(needle)) failures.push(`settings missing ${needle}`);
}

console.log('slots:', names.join(', '));
console.log('bar:', barText.replace(/\s+/g, ' '));
console.log('bar2:', barText2.replace(/\s+/g, ' '));
console.log('shortcuts:', shortcuts.map((command) => command.id).join(', '));
console.log('settings:', 'checked');
console.log('hidden bar:', JSON.stringify(hiddenBar));
console.log('errors:', errors.length);
for (const error of errors) console.log(' -', error?.stack ?? error);
console.log(failures.length === 0 ? 'client OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
