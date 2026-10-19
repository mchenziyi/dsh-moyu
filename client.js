/**
 * Client half of the 上班摸鱼才叫赚钱 bundle.
 *
 * The reading surface is the bottom status bar: one page per line, page turns
 * by shortcut or by clicking the bar. There is no reader tab; the bar is the
 * whole stealth surface and disappears with the boss key.
 *
 * Seats: `shell.overlay` (status bar), `conversation.session.header.utilities`
 * (entry), `settings.section` (bookshelf and preferences), and shortcuts.
 */

window.__ModuleLoader__.load({
  id: '@mchenziyi/dsh-moyu',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'moyu';
    const STORAGE_KEY = 'dsh.moyu.v1';

    /** Official DSH fish mark (viewBox 23.16 x 17.04), used as the entry glyph. */
    const FISH_LOGO_PATH = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z";

    // ------------------------------------------------------------------
    // copy
    // ------------------------------------------------------------------

    const ZH = {
      'entry.label': '构建日志',
      'entry.tooltip': '构建日志',
      'tab.title': '构建日志',
      'status.running': '构建中',
      'status.idle': '空闲',
      'reader.empty': '没有正在运行的任务',
      'reader.emptyHint': '在「设置 → 上班摸鱼才叫赚钱」里导入一本 TXT 小说',
      'reader.loading': '正在读取输出…',
      'reader.error': '读取失败：{message}',
      'reader.chapterMeta': '第 {n} 章 · {p}/{total}',
      'jump.placeholder': '页码，或 c章节号；回车确认，Esc 取消',
      'settings.nav': '上班摸鱼才叫赚钱',
      'settings.title': '上班摸鱼才叫赚钱',
      'settings.subtitle': '摸鱼套件：小说只是第一个模块',
      'settings.bookshelf': '书架',
      'settings.importPath': 'TXT 文件绝对路径，例如 ~/novels/book.txt',
      'settings.import': '导入',
      'settings.importing': '导入中…',
      'settings.importFailed': '导入失败：{message}',
      'settings.empty': '书架是空的，先导入一本本地 TXT。',
      'settings.read': '开始摸鱼',
      'settings.remove': '删除',
      'settings.chapters': '{n} 章',
      'settings.progress': '第 {c} 章',
      'settings.reading': '阅读设置',
      'settings.charsPerPage': '每页字数',
      'settings.charsPerPageHint': '状态栏一次显示这么多字，翻页按这个长度切分。',
      'settings.shortcuts': '快捷键',
      'debug.nav': '规则调试',
      'debug.title': '规则调试',
      'debug.hint': '粘贴书源规则 JSON，填页面 URL，直接看解析结果（不保存，不内置站点）。',
      'debug.rule': '规则 JSON',
      'debug.url': '页面 URL（目录 / 正文测试）',
      'debug.keyword': '关键词（搜索测试）',
      'debug.search': '测搜索',
      'debug.toc': '测目录',
      'debug.content': '测正文',
      'debug.busy': '调试中…',
      'debug.failed': '调试失败：{message}',
      'debug.invalid': '规则无效：{message}',
      'debug.empty': '（没有结果）',
      'settings.sources': '在线书源',
      'source.empty': '还没有书源。',
      'source.new': '新建书源',
      'source.editTitle': '编辑书源',
      'source.name': '书源名称',
      'source.baseUrl': '站点地址',
      'source.searchUrl': '搜索地址模板（用 {{keyword}} 占位）',
      'source.searchList': '搜索结果项',
      'source.searchTitle': '结果标题',
      'source.searchAuthor': '结果作者',
      'source.searchBookUrl': '结果书籍链接',
      'source.tocList': '目录项',
      'source.tocTitle': '章节标题',
      'source.tocChapterUrl': '章节链接',
      'source.tocBookTitle': '书名',
      'source.contentText': '正文容器',
      'source.contentRemove': '去除节点（逗号分隔）',
      'source.test': '测试书源',
      'source.testing': '测试中…',
      'source.save': '保存书源',
      'source.clear': '清空',
      'source.testKeyword': '测试关键词（书名或作者）',
      'source.testBookUrl': '（可选）书籍页 URL，搜索不可用时直接测目录',
      'source.testPassed': '测试通过',
      'source.testFailed': '测试失败：{message}',
      'source.saved': '已保存书源：{name}',
      'source.invalid': '书源配置无效：{message}',
      'source.edit': '编辑',
      'source.remove': '删除',
      'source.advanced': '高级选项（标题/链接/作者/去除节点，默认自动推导）',
      'source.detectSearch': '从首页识别搜索',
      'source.detected': '已识别搜索地址',
      'source.noSearchForm': '首页没有找到 GET 搜索表单，请手动填写搜索地址',
      'source.minimal': '最少只需要：站点地址、搜索地址、搜索结果项、目录项、正文容器；标题和链接会自动推导。',
      'source.hint': '填好下面的表单，点「测试书源」验证 搜索 → 目录 → 正文 链路，再保存；也可以先用上面的 AI 解析自动生成。选择器支持 selector@text、selector@href，以及 a || b 多候选。',
      'ai.title': 'AI 解析书源',
      'ai.hint': '粘贴书源地址（首页或书籍页），用当前默认模型自动生成选择器规则；页面 HTML 会发送给模型。',
      'ai.url': '书源地址，例如 https://example.com',
      'ai.keyword': '测试关键词（可选，默认「小说」）',
      'ai.button': 'AI 解析',
      'ai.busy': '解析中…',
      'ai.stageHome': '读取首页…',
      'ai.stageAnalyzeHome': '分析首页，识别搜索入口…',
      'ai.stageSearch': '分析搜索结果…',
      'ai.stageBook': '读取书籍页…',
      'ai.stageToc': '分析目录…',
      'ai.stageChapter': '读取章节页…',
      'ai.stageContent': '分析正文…',
      'ai.needUrl': '先填书源地址',
      'ai.noBookPage': '没能找到书籍页：把书籍页 URL 填到下面的「书籍页 URL」再解析一次',
      'ai.done': '解析完成：{name}',
      'ai.failed': 'AI 解析失败：{message}',
      'ai.retry': '选择器校验失败，正在让模型修正…',
      'ai.saveRead': '保存并开始阅读',
      'ai.saving': '保存中…',
      'ai.saved': '已保存书源并加入书架',
      'ai.searchEmpty': '搜索页没有匹配到结果',
      'ai.tocEmpty': '目录页没有匹配到章节',
      'ai.contentEmpty': '正文页没有匹配到内容',
      'ai.model': '模型：{model}',
      'switch.title': '换源',
      'switch.source': '目标书源',
      'switch.keyword': '书名或作者',
      'switch.search': '搜索',
      'switch.use': '用这个源',
      'switch.busy': '处理中…',
      'switch.failed': '换源失败：{message}',
      'switch.done': '已切换书源',
      'switch.cancel': '取消',
      'switch.needSource': '没有其他带搜索规则的书源',
      'book.source': '来源：{name}',
      'settings.sourceHint': '粘贴书源规则 JSON，或从文件导入。规则格式见 README；插件不内置任何站点。',
      'settings.sourceAdd': '添加书源',
      'settings.sourceFile': '从文件导入',
      'settings.sourceEmpty': '还没有书源。',
      'settings.sourceInvalid': '书源规则无效：{message}',
      'settings.sourceRemove': '删除',
      'search.keyword': '搜索关键词',
      'search.button': '搜索',
      'search.searching': '搜索中…',
      'search.empty': '没有结果',
      'search.failed': '搜索失败：{message}',
      'search.add': '加入书架',
      'search.adding': '加入中…',
      'search.needSource': '先添加一个带搜索规则的书源',
      'reader.tocFailed': '目录读取失败：{message}',
      'reader.chapterFailed': '章节读取失败：{message}',
      'shortcut.nextPage': '下一页',
      'shortcut.prevPage': '上一页',
      'shortcut.nextChapter': '下一章',
      'shortcut.prevChapter': '上一章',
      'shortcut.jump': '跳转',
      'shortcut.boss': '老板键',
      'shortcut.toc': '章节列表',
      'toc.title': '目录',
      'toc.filter': '筛选章节…',
      'toc.loading': '正在读取目录…',
      'toc.empty': '没有匹配的章节',
      'toc.hint': '↑↓ 选择 · Enter 跳转 · Esc 关闭',
    };

    const EN = {
      'entry.label': 'Build log',
      'entry.tooltip': 'Build log',
      'tab.title': 'Build Log',
      'status.running': 'BUILDING',
      'status.idle': 'IDLE',
      'reader.empty': 'No running task',
      'reader.emptyHint': 'Import a TXT novel in Settings → Slack Off to Earn',
      'reader.loading': 'Reading output…',
      'reader.error': 'Read failed: {message}',
      'reader.chapterMeta': 'Chapter {n} · {p}/{total}',
      'jump.placeholder': 'page, or c<chapter>; Enter to confirm, Esc to cancel',
      'settings.nav': 'Slack Off to Earn',
      'settings.title': 'Slack Off to Earn',
      'settings.subtitle': 'A slack-off suite; novels are only the first module',
      'settings.bookshelf': 'Bookshelf',
      'settings.importPath': 'Absolute path to a TXT file, e.g. ~/novels/book.txt',
      'settings.import': 'Import',
      'settings.importing': 'Importing…',
      'settings.importFailed': 'Import failed: {message}',
      'settings.empty': 'The bookshelf is empty. Import a local TXT first.',
      'settings.read': 'Start slacking',
      'settings.remove': 'Remove',
      'settings.chapters': '{n} chapters',
      'settings.progress': 'Chapter {c}',
      'settings.reading': 'Reading',
      'settings.charsPerPage': 'Chars per page',
      'settings.charsPerPageHint': 'One page is this many characters in the status bar.',
      'settings.shortcuts': 'Shortcuts',
      'debug.nav': 'Rule debugger',
      'debug.title': 'Rule debugger',
      'debug.hint': 'Paste a source rule JSON and a page URL to preview extracted data (nothing is saved; no site is bundled).',
      'debug.rule': 'Rule JSON',
      'debug.url': 'Page URL (TOC / content)',
      'debug.keyword': 'Keyword (search)',
      'debug.search': 'Test search',
      'debug.toc': 'Test TOC',
      'debug.content': 'Test content',
      'debug.busy': 'Debugging…',
      'debug.failed': 'Debug failed: {message}',
      'debug.invalid': 'Invalid rule: {message}',
      'debug.empty': '(no results)',
      'settings.sources': 'Online sources',
      'source.empty': 'No sources yet.',
      'source.new': 'New source',
      'source.editTitle': 'Edit source',
      'source.name': 'Source name',
      'source.baseUrl': 'Site URL',
      'source.searchUrl': 'Search URL template ({{keyword}})',
      'source.searchList': 'Search result item',
      'source.searchTitle': 'Result title',
      'source.searchAuthor': 'Result author',
      'source.searchBookUrl': 'Result book link',
      'source.tocList': 'TOC item',
      'source.tocTitle': 'Chapter title',
      'source.tocChapterUrl': 'Chapter link',
      'source.tocBookTitle': 'Book title',
      'source.contentText': 'Content container',
      'source.contentRemove': 'Remove nodes (comma separated)',
      'source.test': 'Test source',
      'source.testing': 'Testing…',
      'source.save': 'Save source',
      'source.clear': 'Clear',
      'source.testKeyword': 'Test keyword (title or author)',
      'source.testBookUrl': '(optional) book page URL for TOC when search is unavailable',
      'source.testPassed': 'Passed',
      'source.testFailed': 'Test failed: {message}',
      'source.saved': 'Saved source: {name}',
      'source.invalid': 'Invalid source config: {message}',
      'source.edit': 'Edit',
      'source.remove': 'Remove',
      'source.hint': 'Fill the form, run Test source to verify search → TOC → content, then save. Selectors accept selector@text, selector@href, and a || b fallbacks.',
      'source.advanced': 'Advanced (title/link/author/remove nodes; derived by default)',
      'source.detectSearch': 'Detect search from homepage',
      'source.detected': 'Search URL detected',
      'source.noSearchForm': 'No GET search form on the homepage; fill the search URL manually',
      'source.minimal': 'Minimum: site URL, search URL, search item, TOC item, content container. Titles and links are derived.',
      'ai.title': 'AI source parser',
      'ai.hint': 'Paste a source URL (homepage or book page) and let the current default model generate the selectors. Page HTML is sent to the model.',
      'ai.url': 'Source URL, e.g. https://example.com',
      'ai.keyword': 'Test keyword (optional; defaults to 小说)',
      'ai.button': 'Parse with AI',
      'ai.busy': 'Parsing…',
      'ai.stageHome': 'Reading homepage…',
      'ai.stageAnalyzeHome': 'Finding the search entry…',
      'ai.stageSearch': 'Analyzing search results…',
      'ai.stageBook': 'Reading book page…',
      'ai.stageToc': 'Analyzing contents…',
      'ai.stageChapter': 'Reading chapter page…',
      'ai.stageContent': 'Analyzing content…',
      'ai.needUrl': 'Fill the source URL first',
      'ai.noBookPage': 'No book page found: put one in the book page URL field below and parse again',
      'ai.done': 'Parsed: {name}',
      'ai.failed': 'AI parse failed: {message}',
      'ai.retry': 'Selector check failed; asking the model to fix it…',
      'ai.saveRead': 'Save and start reading',
      'ai.saving': 'Saving…',
      'ai.saved': 'Source saved and book added to the shelf',
      'ai.searchEmpty': 'No results matched on the search page',
      'ai.tocEmpty': 'No chapters matched on the contents page',
      'ai.contentEmpty': 'No content matched on the chapter page',
      'ai.model': 'Model: {model}',
      'switch.title': 'Switch source',
      'switch.source': 'Target source',
      'switch.keyword': 'Title or author',
      'switch.search': 'Search',
      'switch.use': 'Use this source',
      'switch.busy': 'Working…',
      'switch.failed': 'Switch failed: {message}',
      'switch.done': 'Source switched',
      'switch.cancel': 'Cancel',
      'switch.needSource': 'No other source with a search rule',
      'book.source': 'Source: {name}',
      'settings.sourceHint': 'Paste a source rule JSON, or import a file. See README for the format; no site is bundled.',
      'settings.sourceAdd': 'Add source',
      'settings.sourceFile': 'Import file',
      'settings.sourceEmpty': 'No sources yet.',
      'settings.sourceInvalid': 'Invalid source rule: {message}',
      'settings.sourceRemove': 'Remove',
      'search.keyword': 'Search keyword',
      'search.button': 'Search',
      'search.searching': 'Searching…',
      'search.empty': 'No results',
      'search.failed': 'Search failed: {message}',
      'search.add': 'Add to shelf',
      'search.adding': 'Adding…',
      'search.needSource': 'Add a source with a search rule first',
      'reader.tocFailed': 'TOC failed: {message}',
      'reader.chapterFailed': 'Chapter failed: {message}',
      'shortcut.nextPage': 'Next page',
      'shortcut.prevPage': 'Previous page',
      'shortcut.nextChapter': 'Next chapter',
      'shortcut.prevChapter': 'Previous chapter',
      'shortcut.jump': 'Jump',
      'shortcut.boss': 'Boss key',
      'shortcut.toc': 'Chapter list',
      'toc.title': 'Contents',
      'toc.filter': 'Filter chapters…',
      'toc.loading': 'Loading contents…',
      'toc.empty': 'No matching chapters',
      'toc.hint': '↑↓ select · Enter jump · Esc close',
    };

    // ------------------------------------------------------------------
    // styles
    // ------------------------------------------------------------------

    const CSS = `
body[data-moyu-reading="true"] [data-composer-stat]{display:none !important}
body[data-moyu-reading="true"] [class*="JObwrW_root"]{display:none !important}
body[data-moyu-reading="true"] button[aria-label*="上下文已用"]{display:none !important}
body[data-moyu-reading="true"] button[aria-label*="context used"]{display:none !important}
.my-entry-btn{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:8px;cursor:pointer;padding:0}
.my-entry-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.my-line-row{display:flex;align-items:center;gap:10px;width:100%;min-height:18px;padding:1px 4px 0;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;overflow:hidden;cursor:default;user-select:none}
.my-status-left{flex:none;color:var(--dsw-alias-state-success-primary)}
.my-status-line{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary)}
.my-status-right{flex:none;color:var(--dsw-alias-label-tertiary)}
.my-jumprow{gap:8px}
.my-prompt{color:var(--dsw-alias-state-success-primary);flex:none}
.my-input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit}
.my-settings{display:flex;flex-direction:column;gap:18px;padding:4px 0 24px;color:var(--dsw-alias-label-primary);font-size:13px}
.my-settings h2{margin:0;font-size:15px}
.my-settings h3{margin:0 0 8px;font-size:13px;color:var(--dsw-alias-label-primary)}
.my-sub{color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:2px}
.my-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.my-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.my-input-path{flex:1;min-width:220px;height:32px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}
.my-input-path:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.my-btn{height:32px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;cursor:pointer}
.my-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.my-btn:disabled{opacity:.55;cursor:default}
.my-btn.primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border-color:transparent}
.my-book{display:flex;align-items:center;gap:10px;padding:8px 4px;border-top:1px solid var(--dsw-alias-border-l1)}
.my-book:first-of-type{border-top:0}
.my-book-main{flex:1;min-width:0}
.my-book-title{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.my-book-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.my-form-section{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:10px;margin-top:4px}
.my-form-label{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.my-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.my-field{display:flex;flex-direction:column;gap:3px;min-width:0}
.my-field-label{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.my-field-input{height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}
.my-field-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.my-settings h4{margin:6px 0 0;font-size:12.5px;color:var(--dsw-alias-label-primary)}
.my-toc{position:fixed;right:16px;width:min(380px,calc(100vw - 32px));max-height:60vh;display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;box-shadow:var(--dsw-elevation-panel);z-index:47;overflow:hidden}
.my-toc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;color:var(--dsw-alias-label-secondary)}
.my-toc-title{font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.my-toc-count{flex:none;color:var(--dsw-alias-label-tertiary)}
.my-toc-filter{height:30px;margin:8px 10px 4px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px}
.my-toc-filter:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.my-toc-list{overflow:auto;min-height:0;padding:2px 6px 6px;display:flex;flex-direction:column;gap:1px}
.my-toc-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 8px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;border-radius:6px;cursor:pointer;text-align:left}
.my-toc-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.my-toc-row.selected{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.my-toc-row.current{color:var(--dsw-alias-label-primary);font-weight:600}
.my-toc-index{flex:none;width:42px;text-align:right;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}
.my-toc-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.my-toc-empty{padding:16px 12px;color:var(--dsw-alias-label-secondary);font-size:12px}
.my-toc-foot{padding:6px 12px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:11px}
.my-debug-output{max-height:260px;overflow:auto;margin:0;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.5;white-space:pre-wrap;word-break:break-all}
.my-textarea{min-height:96px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;resize:vertical}
.my-textarea:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.my-num{width:96px;height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px}
.my-error{color:var(--dsw-alias-state-error-primary);font-size:12px}
.my-kbd{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.my-kbd code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-primary);font-size:11.5px}
`;

    // ------------------------------------------------------------------
    // storage and store
    // ------------------------------------------------------------------

    function defaults() {
      return {
        books: [],
        progress: {},
        reading: { bookId: null, chapter: 0, page: 0 },
        settings: { charsPerPage: 72, sources: [] },
      };
    }

    function readStorage() {
      const base = defaults();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return base;
        const parsed = JSON.parse(raw);
        return {
          books: Array.isArray(parsed.books) ? parsed.books.filter((book) => typeof book?.id === 'string') : [],
          progress: parsed.progress !== null && typeof parsed.progress === 'object' ? parsed.progress : {},
          reading: parsed.reading !== null && typeof parsed.reading === 'object'
            ? {
              bookId: typeof parsed.reading.bookId === 'string' ? parsed.reading.bookId : null,
              chapter: Number(parsed.reading.chapter) || 0,
              page: Number(parsed.reading.page) || 0,
            }
            : base.reading,
          settings: (() => {
            const merged = Object.assign({}, base.settings, parsed.settings !== null && typeof parsed.settings === 'object' ? parsed.settings : {});
            merged.sources = Array.isArray(merged.sources) ? merged.sources.filter((source) => source !== null && typeof source === 'object') : [];
            return merged;
          })(),
        };
      } catch {
        return base;
      }
    }

    function createStore(initial) {
      let state = initial;
      const listeners = new Set();
      return {
        get: () => state,
        set(patch) {
          state = Object.assign({}, state, patch);
          for (const listener of [...listeners]) listener();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
      };
    }

    const store = createStore(Object.assign(readStorage(), {
      active: false,
      jumpOpen: false,
      tocOpen: false,
      pendingLast: false,
    }));

    function persist() {
      try {
        const snap = store.get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          books: snap.books,
          progress: snap.progress,
          reading: snap.reading,
          settings: snap.settings,
        }));
      } catch {
        /* storage unavailable */
      }
    }

    function persistedPatch(patch) {
      store.set(patch);
      persist();
    }

    function useStore(source) {
      const [snapshot, setSnapshot] = React.useState(() => source.get());
      React.useEffect(() => source.subscribe(() => setSnapshot(source.get())), [source]);
      return snapshot;
    }

    function makeT(locale) {
      let bound;
      try {
        bound = locale !== undefined && typeof locale.bind === 'function' ? locale.bind(NS) : undefined;
      } catch {
        bound = undefined;
      }
      let active = 'zh';
      try {
        const snapshot = locale?.getLocale?.();
        if (typeof snapshot?.active === 'string') active = snapshot.active;
      } catch {
        active = 'zh';
      }
      const dict = active === 'en' ? EN : ZH;
      return (key, params) => {
        if (bound !== undefined) {
          try { return bound(key, params); } catch { /* fall back */ }
        }
        let text = dict[key] ?? ZH[key] ?? key;
        if (params) for (const name of Object.keys(params)) text = text.split(`{${name}}`).join(String(params[name]));
        return text;
      };
    }

    function useT(locale) {
      const [, force] = React.useState(0);
      React.useEffect(() => {
        if (locale === undefined || typeof locale.subscribe !== 'function') return undefined;
        return locale.subscribe(() => force((value) => value + 1));
      }, [locale]);
      return makeT(locale);
    }

    // ------------------------------------------------------------------
    // network + text helpers
    // ------------------------------------------------------------------

    function apiUrl(path, params) {
      let url;
      try { url = new URL(path, document.baseURI); } catch { url = new URL(path, window.location.href); }
      if (params) for (const name of Object.keys(params)) {
        const value = params[name];
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value));
      }
      return url.toString();
    }

    async function getJson(path, params, signal) {
      const response = await fetch(apiUrl(path, params), { signal, credentials: 'same-origin' });
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try { const body = await response.json(); if (typeof body?.message === 'string') message = body.message; } catch { /* ignore */ }
        throw new Error(message);
      }
      return response.json();
    }

    function paginate(text, charsPerPage) {
      const size = Math.max(20, Number(charsPerPage) || 72);
      const pages = [];
      for (let offset = 0; offset < text.length; offset += size) pages.push(text.slice(offset, offset + size));
      return pages.length === 0 ? [''] : pages;
    }

    // ------------------------------------------------------------------
    // online source rule engine
    // ------------------------------------------------------------------

    const tocCache = new Map();
    const contentCache = new Map();

    function normalizeSource(raw) {
      if (raw === null || typeof raw !== 'object') throw new Error('规则必须是 JSON 对象');
      const text = (value) => (typeof value === 'string' ? value.trim() : '');
      const id = text(raw.id) !== '' ? text(raw.id) : text(raw.name);
      if (id === '') throw new Error('缺少 id 或 name');
      const name = text(raw.name) !== '' ? text(raw.name) : id;
      const ruleOf = (value) => (value !== null && typeof value === 'object' ? value : {});
      const searchRule = raw.search === undefined ? null : ruleOf(raw.search);
      const tocRule = ruleOf(raw.toc);
      const contentRule = ruleOf(raw.content);
      const search = searchRule === null ? null : {
        url: text(searchRule.url),
        list: text(searchRule.list),
        title: text(searchRule.title),
        author: text(searchRule.author),
        bookUrl: text(searchRule.bookUrl),
      };
      if (search !== null && (search.url === '' || search.list === '')) throw new Error('search.url 和 search.list 必填');
      const toc = {
        list: text(tocRule.list),
        title: text(tocRule.title),
        chapterUrl: text(tocRule.chapterUrl),
        bookTitle: text(tocRule.bookTitle),
      };
      const content = {
        text: text(contentRule.text),
        remove: Array.isArray(contentRule.remove) ? contentRule.remove.filter((value) => typeof value === 'string') : [],
      };
      if (toc.list === '' || content.text === '') throw new Error('toc.list 和 content.text 必填');
      return { id, name, baseUrl: text(raw.baseUrl), search, toc, content };
    }

    function emptySourceForm() {
      return {
        id: '', name: '', baseUrl: '',
        searchUrl: '', searchList: '', searchTitle: '', searchAuthor: '', searchBookUrl: '',
        tocList: '', tocTitle: '', tocChapterUrl: '', tocBookTitle: '',
        contentText: '', contentRemove: '',
      };
    }

    function formFromRule(source) {
      return {
        id: source.id,
        name: source.name,
        baseUrl: source.baseUrl,
        searchUrl: source.search?.url ?? '',
        searchList: source.search?.list ?? '',
        searchTitle: source.search?.title ?? '',
        searchAuthor: source.search?.author ?? '',
        searchBookUrl: source.search?.bookUrl ?? '',
        tocList: source.toc.list,
        tocTitle: source.toc.title,
        tocChapterUrl: source.toc.chapterUrl,
        tocBookTitle: source.toc.bookTitle,
        contentText: source.content.text,
        contentRemove: source.content.remove.join(', '),
      };
    }

    function ruleFromForm(form) {
      return normalizeSource({
        id: form.id !== '' ? form.id : form.name,
        name: form.name,
        baseUrl: form.baseUrl,
        search: form.searchUrl.trim() === '' ? undefined : {
          url: form.searchUrl,
          list: form.searchList,
          title: form.searchTitle,
          author: form.searchAuthor,
          bookUrl: form.searchBookUrl,
        },
        toc: {
          list: form.tocList,
          title: form.tocTitle,
          chapterUrl: form.tocChapterUrl,
          bookTitle: form.tocBookTitle,
        },
        content: {
          text: form.contentText,
          remove: form.contentRemove.split(',').map((part) => part.trim()).filter(Boolean),
        },
      });
    }

    function expandTemplate(template, vars) {
      return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => (typeof vars[key] === 'string' ? vars[key] : ''));
    }

    function resolveUrl(href, base) {
      if (typeof href !== 'string' || href === '') return '';
      try {
        return new URL(href, base).toString();
      } catch {
        return '';
      }
    }

    function textOf(node) {
      const clone = node.cloneNode(true);
      for (const br of [...clone.querySelectorAll('br')]) br.replaceWith('\n');
      for (const block of [...clone.querySelectorAll('p, div, li, tr')]) block.append('\n');
      return (clone.textContent ?? '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.replace(/\u00a0/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function pickOne(root, spec) {
      if (typeof spec !== 'string' || spec === '' || root === null) return '';
      let selector = spec.trim();
      let attribute = null;
      const suffix = /^(.*?)@([\w-]+)$/.exec(selector);
      if (suffix !== null) {
        selector = suffix[1].trim();
        attribute = suffix[2];
      }
      if (selector === '' && attribute === null) return '';
      let node;
      try {
        node = selector === '' ? root : root.querySelector(selector);
      } catch {
        return '';
      }
      if (node === null) return '';
      if (attribute === null || attribute === 'text') return textOf(node);
      if (attribute === 'html') return node.innerHTML ?? '';
      return (node.getAttribute(attribute) ?? '').trim();
    }

    function pickFrom(root, spec) {
      if (typeof spec !== 'string' || spec === '' || root === null) return '';
      for (const candidate of spec.split('||').map((part) => part.trim()).filter(Boolean)) {
        const value = pickOne(root, candidate);
        if (value !== '') return value;
      }
      return '';
    }

    function parseHtml(text) {
      return new DOMParser().parseFromString(String(text), 'text/html');
    }

    async function proxyFetch(url, signal) {
      const page = await getJson('moyu/online/proxy', { url }, signal);
      if (page.status >= 400) throw new Error(`HTTP ${page.status}`);
      return page;
    }

    async function searchSource(source, keyword, signal) {
      if (source.search === null || source.search.url === '') throw new Error('这个书源没有配置搜索规则');
      const url = expandTemplate(source.search.url, {
        base: source.baseUrl,
        keyword: encodeURIComponent(keyword.trim()),
      });
      const page = await proxyFetch(url, signal);
      const doc = parseHtml(page.text);
      return probeSearchResults(source.search, doc, page.finalUrl);
    }

    async function fetchToc(source, bookUrl, signal) {
      const page = await proxyFetch(bookUrl, signal);
      const doc = parseHtml(page.text);
      return probeToc(source.toc, doc, page.finalUrl);
    }

    async function fetchOnlineContent(source, chapterUrl, signal) {
      const page = await proxyFetch(chapterUrl, signal);
      const doc = parseHtml(page.text);
      return probeContent(source.content, doc);
    }

    const localTocCache = new Map();

    async function ensureToc(book, signal) {
      if (book.kind === 'online') {
        const cached = tocCache.get(book.id);
        if (cached !== undefined) return cached;
        const source = store.get().settings.sources.find((entry) => entry.id === book.sourceId);
        if (source === undefined) throw new Error('书源已删除');
        const parsed = await fetchToc(source, book.bookUrl, signal);
        if (parsed.chapters.length === 0) throw new Error('目录为空');
        tocCache.set(book.id, parsed.chapters);
        const snap = store.get();
        const books = snap.books.map((entry) => (entry.id === book.id
          ? Object.assign({}, entry, { chapterCount: parsed.chapters.length, title: parsed.title || entry.title })
          : entry));
        persistedPatch({ books });
        return parsed.chapters;
      }
      const cached = localTocCache.get(book.id);
      if (cached !== undefined) return cached;
      const toc = await getJson('moyu/local/toc', { path: book.id }, signal);
      const chapters = (Array.isArray(toc.chapters) ? toc.chapters : []).map((chapter) => ({ title: chapter.title, index: chapter.index }));
      localTocCache.set(book.id, chapters);
      return chapters;
    }

    async function loadChapterForBook(book, index, signal) {
      if (book.kind !== 'online') {
        const data = await fetchChapter(book.id, index, signal);
        return { text: data.text, chapterTitle: data.chapterTitle, total: data.total };
      }
      const chapters = await ensureToc(book, signal);
      const chapter = chapters[index];
      if (chapter === undefined) throw new Error('章节不存在');
      const cacheKey = `${book.id}@${index}`;
      let content = contentCache.get(cacheKey);
      if (content === undefined) {
        const source = store.get().settings.sources.find((entry) => entry.id === book.sourceId);
        if (source === undefined) throw new Error('书源已删除');
        content = await fetchOnlineContent(source, chapter.url, signal);
        contentCache.set(cacheKey, content);
      }
      return { text: content, chapterTitle: chapter.title, total: chapters.length };
    }

    // ------------------------------------------------------------------
    // book operations
    // ------------------------------------------------------------------

    const chapterCache = new Map();

    async function fetchChapter(bookId, chapter, signal) {
      const key = `${bookId}@${chapter}`;
      const cached = chapterCache.get(key);
      if (cached !== undefined) return cached;
      const data = await getJson('moyu/local/chapter', { path: bookId, index: chapter }, signal);
      chapterCache.set(key, data);
      return data;
    }

    async function importBook(path) {
      const toc = await getJson('moyu/local/toc', { path });
      const book = {
        id: path,
        kind: 'local',
        path,
        title: toc.title,
        encoding: toc.encoding,
        chapterCount: Array.isArray(toc.chapters) ? toc.chapters.length : 1,
        addedAt: Date.now(),
      };
      const snap = store.get();
      const books = [book, ...snap.books.filter((entry) => entry.id !== book.id)];
      persistedPatch({
        books,
        progress: Object.assign({}, snap.progress, { [book.id]: { chapter: 0, page: 0 } }),
        reading: { bookId: book.id, chapter: 0, page: 0 },
        active: true,
      });
      return book;
    }

    function addOnlineBookToShelf(source, result, toc) {
      const id = `online:${source.id}:${result.bookUrl}`;
      const book = {
        id,
        kind: 'online',
        title: toc.title || result.title || '未命名',
        author: result.author || '',
        sourceId: source.id,
        bookUrl: result.bookUrl,
        chapterCount: toc.chapters.length,
        addedAt: Date.now(),
      };
      const snap = store.get();
      const books = [book, ...snap.books.filter((entry) => entry.id !== id)];
      persistedPatch({
        books,
        progress: Object.assign({}, snap.progress, { [id]: { chapter: 0, page: 0 } }),
        reading: { bookId: id, chapter: 0, page: 0 },
        active: true,
      });
      tocCache.set(id, toc.chapters);
    }

    // ------------------------------------------------------------------
    // AI source parser
    // ------------------------------------------------------------------

    const AI_PAGE_HTML_LIMIT = 100_000;
    const AI_HINTS_LIMIT = 8_000;
    const AI_MAX_ATTEMPTS = 2;

    function cssEscape(value) {
      if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
      return String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
    }

    function collapseText(value, max = 120) {
      return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    }

    /** Build a short selector that points at one element of the page. */
    function selectorOf(node, doc) {
      if (node === null || node === undefined || node.nodeType !== 1) return '';
      if (typeof node.id === 'string' && node.id !== '') return `#${cssEscape(node.id)}`;
      const parts = [];
      let current = node;
      while (current !== null && current !== undefined && current.nodeType === 1 && current !== doc.body && parts.length < 6) {
        let part = current.tagName.toLowerCase();
        const classes = [...(current.classList ?? [])].filter((name) => /^[A-Za-z][\w-]*$/.test(name)).slice(0, 2);
        if (classes.length > 0) part += `.${classes.map(cssEscape).join('.')}`;
        const parent = current.parentElement;
        if (parent !== null && parent !== undefined) {
          const sameTag = [...parent.children].filter((sibling) => sibling.tagName === current.tagName);
          if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(current) + 1})`;
        }
        parts.unshift(part);
        if (typeof current.id === 'string' && current.id !== '') {
          parts[0] = `#${cssEscape(current.id)}`;
          break;
        }
        try {
          if (doc.querySelectorAll(parts.join(' > ')).length === 1) return parts.join(' > ');
        } catch {
          /* keep walking */
        }
        current = parent;
      }
      return parts.join(' > ');
    }

    function anchorsIn(root) {
      return [...root.querySelectorAll('a')].filter((anchor) => (anchor.getAttribute?.('href') ?? '') !== '');
    }

    /** Page HTML without scripts/styles, bounded for a model prompt. */
    function digestHtml(doc) {
      const clone = doc.cloneNode(true);
      for (const node of [...clone.querySelectorAll('script,style,noscript,iframe,svg,canvas,template')]) node.remove();
      const html = String(clone.body?.outerHTML ?? clone.documentElement?.outerHTML ?? '').replace(/<!--[\s\S]*?-->/g, '');
      return html.length > AI_PAGE_HTML_LIMIT ? `${html.slice(0, AI_PAGE_HTML_LIMIT)}\n<!-- truncated -->` : html;
    }

    function repeatedGroups(doc, limit = 8) {
      const groups = [];
      let inspected = 0;
      for (const parent of doc.querySelectorAll('body *')) {
        if (inspected >= 1500) break;
        inspected += 1;
        const children = [...(parent.children ?? [])].filter((child) => anchorsIn(child).length > 0);
        if (children.length < 3) continue;
        const selector = selectorOf(parent, doc);
        if (selector === '') continue;
        const signature = children[0].tagName.toLowerCase()
          + [...(children[0].classList ?? [])].slice(0, 2).map((name) => `.${name}`).join('');
        const samples = children.slice(0, 3).map((child) => {
          const anchor = anchorsIn(child)[0];
          return `${collapseText(child.textContent, 50)} → ${collapseText(anchor?.getAttribute('href') ?? '', 70)}`;
        });
        groups.push({ selector, signature, count: children.length, samples });
      }
      const seen = new Map();
      for (const group of groups) {
        const previous = seen.get(group.selector);
        if (previous === undefined || group.count > previous.count) seen.set(group.selector, group);
      }
      return [...seen.values()].sort((a, b) => b.count - a.count).slice(0, limit);
    }

    function linkContainers(doc, limit = 8) {
      const seen = new Set();
      const rows = [];
      let inspected = 0;
      for (const element of doc.querySelectorAll('body *')) {
        if (inspected >= 1500) break;
        inspected += 1;
        const links = anchorsIn(element);
        if (links.length < 5) continue;
        const selector = selectorOf(element, doc);
        if (selector === '' || seen.has(selector)) continue;
        seen.add(selector);
        rows.push({
          selector,
          count: links.length,
          samples: links.slice(0, 4).map((anchor) => `${collapseText(anchor.textContent, 40)} → ${collapseText(anchor.getAttribute('href') ?? '', 70)}`),
        });
      }
      return rows.sort((a, b) => b.count - a.count).slice(0, limit);
    }

    function textBlocks(doc, limit = 10) {
      const blocks = [];
      let inspected = 0;
      for (const element of doc.querySelectorAll('body *')) {
        if (inspected >= 2000) break;
        inspected += 1;
        if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) continue;
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (text.length < 180) continue;
        blocks.push({ element, text, linkText: linkTextLength(element) });
      }
      blocks.sort((a, b) => b.text.length - a.text.length);
      const kept = [];
      for (const block of blocks) {
        if (kept.some((entry) => block.element.contains(entry.element))) continue;
        kept.push(block);
        if (kept.length >= limit) break;
      }
      return kept.map((block) => ({
        selector: selectorOf(block.element, doc),
        length: block.text.length,
        linkRatio: block.text.length === 0 ? 0 : block.linkText / block.text.length,
        paragraphs: block.element.querySelectorAll('p').length,
        breaks: block.element.querySelectorAll('br').length,
        preview: collapseText(block.text, 120),
      }));
    }

    function linkTextLength(element) {
      let total = 0;
      for (const anchor of anchorsIn(element)) total += (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().length;
      return total;
    }

    /**
     * Pick one likely body container: an innermost element whose id/class
     * signals "content", else the densest large text block.
     */
    function recommendContentContainer(doc) {
      const named = [];
      for (const element of doc.querySelectorAll('body *')) {
        if (['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) continue;
        const name = `${typeof element.id === 'string' ? element.id : ''} ${[...(element.classList ?? [])].join(' ')}`.toLowerCase();
        if (!/content|read|article|chapter|txt|正文/.test(name)) continue;
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (text.length < 150) continue;
        const linkText = linkTextLength(element);
        named.push({ element, length: text.length, linkRatio: linkText / text.length });
      }
      const innermost = named.filter((candidate) => !named.some((other) => other !== candidate && candidate.element.contains(other.element)));
      const pool = innermost.length > 0 ? innermost : named;
      if (pool.length === 0) {
        const blocks = textBlocks(doc, 6);
        if (blocks.length === 0) return null;
        const best = [...blocks].sort((a, b) => (b.length * (1 - b.linkRatio)) - (a.length * (1 - a.linkRatio)))[0];
        return best === undefined ? null : best;
      }
      pool.sort((a, b) => (b.length * (1 - b.linkRatio)) - (a.length * (1 - a.linkRatio)));
      const best = pool[0];
      return { selector: selectorOf(best.element, doc), length: best.length, linkRatio: best.linkRatio };
    }

    function formatRows(title, rows) {
      return rows.length === 0 ? [] : [title, ...rows.map((row) => `- ${row}`)];
    }

    /** Compact page outline handed to the model beside the HTML digest. */
    function buildHints(stage, doc) {
      const lines = [];
      const title = collapseText(doc.title ?? '', 120);
      if (title !== '') lines.push(`页面标题：${title}`);
      if (stage === 'homepage') {
        const forms = [];
        for (const formElement of [...doc.querySelectorAll('form')].slice(0, 6)) {
          const inputs = [...formElement.querySelectorAll('input[name]')].slice(0, 4).map((input) => {
            const field = input.getAttribute('name') ?? '';
            const placeholder = collapseText(input.getAttribute('placeholder') ?? '', 30);
            return placeholder === '' ? field : `${field}（${placeholder}）`;
          });
          forms.push(`method=${(formElement.getAttribute('method') ?? 'get').toLowerCase()} action=${formElement.getAttribute('action') ?? ''} inputs=${inputs.join(', ')}`);
        }
        lines.push(...formatRows('表单：', forms));
        const searchLinks = [...doc.querySelectorAll('a')]
          .filter((anchor) => /search|so\.|s\.php|搜索/i.test(`${anchor.getAttribute('href') ?? ''} ${anchor.textContent ?? ''}`))
          .slice(0, 6);
        lines.push(...formatRows('搜索入口候选：', searchLinks.map((anchor) => `${collapseText(anchor.textContent, 20)} → ${collapseText(anchor.getAttribute('href') ?? '', 70)}`)));
        const navHref = /\/(sort|top|full|bookcase|modules|user|login|register|xuanhuanxiaoshuo|xiuzhenxiaoshuo|dushixiaoshuo|chuanyuexiaoshuo|wangyouxiaoshuo|kehuanxiaoshuo|lishi|junshi|paihangbang|xiaoshuodaquan)(\/|$)/i;
        const numericBookHref = /^\/\d+_\d+\/?$/;
        const namedBookHref = /\/(book|read|txt|novel|info|chapter|list)(\/|$)/i;
        const bookLinks = [...doc.querySelectorAll('a')]
          .map((anchor) => {
            const href = anchor.getAttribute('href') ?? '';
            const text = collapseText(anchor.textContent, 30);
            let score = 0;
            if (numericBookHref.test(href)) score += 3;
            if (namedBookHref.test(href)) score += 2;
            if (/小说|阅读|章节|全文/i.test(text) && text.length <= 20) score += 1;
            if (navHref.test(href)) score -= 4;
            if (text === '' || /首页|书架|排行|分类|登录|注册/.test(text)) score -= 2;
            return { href, text, score };
          })
          .filter((entry) => entry.score > 0 && entry.href !== '' && entry.href !== '#' && !/^javascript:/i.test(entry.href))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        lines.push(...formatRows('书籍链接候选：', bookLinks.map((entry) => `${entry.text} → ${collapseText(entry.href, 70)}`)));
        lines.push(...formatRows('重复块候选：', repeatedGroups(doc, 6).map((group) => `${group.selector} → ${group.count} 个 ${group.signature}，例：${group.samples[0] ?? ''}`)));
      } else if (stage === 'search') {
        lines.push(...formatRows('重复块候选：', repeatedGroups(doc, 8).map((group) => `${group.selector} → ${group.count} 个 ${group.signature}，例：${group.samples[0] ?? ''}`)));
        lines.push(...formatRows('链接较多的容器：', linkContainers(doc, 5).map((group) => `${group.selector} → ${group.count} 个链接，例：${group.samples[0] ?? ''}`)));
      } else if (stage === 'toc') {
        const headings = [...doc.querySelectorAll('h1,h2,h3')].slice(0, 5).map((node) => collapseText(node.textContent, 60)).filter((value) => value !== '');
        lines.push(...formatRows('标题候选：', headings));
        lines.push(...formatRows('链接较多的容器：', linkContainers(doc, 8).map((group) => `${group.selector} → ${group.count} 个链接，例：${group.samples[0] ?? ''}`)));
        lines.push(...formatRows('重复块候选：', repeatedGroups(doc, 6).map((group) => `${group.selector} → ${group.count} 个 ${group.signature}，例：${group.samples[0] ?? ''}`)));
      } else {
        const recommended = recommendContentContainer(doc);
        if (recommended !== null) {
          lines.push(`推荐正文容器：${recommended.selector}（${recommended.length} 字，链接占比 ${Math.round(recommended.linkRatio * 100)}%）`);
        }
        lines.push(...formatRows('正文候选（按文字长度）：', textBlocks(doc, 10).map((block) => `${block.selector} → ${block.length} 字，链接占比 ${Math.round(block.linkRatio * 100)}%，${block.paragraphs} 个 p，${block.breaks} 个 br，例：${block.preview}`)));
      }
      return lines.join('\n').slice(0, AI_HINTS_LIMIT);
    }

    function selectorsOf(spec) {
      return String(spec).split('||').map((part) => part.trim()).filter((part) => part !== '');
    }

    /** querySelectorAll with `a || b` selector fallbacks; invalid candidates are skipped. */
    function queryAllIn(root, spec) {
      for (const candidate of selectorsOf(spec)) {
        try {
          const nodes = [...root.querySelectorAll(candidate)];
          if (nodes.length > 0) return nodes;
        } catch {
          /* try the next candidate */
        }
      }
      return [];
    }

    /** querySelector with `a || b` selector fallbacks; invalid candidates are skipped. */
    function queryOneIn(root, spec) {
      for (const candidate of selectorsOf(spec)) {
        try {
          const node = root.querySelector(candidate);
          if (node !== null) return node;
        } catch {
          /* try the next candidate */
        }
      }
      return null;
    }

    function probeSearchResults(search, doc, baseUrl) {
      if (search === null || search === undefined || typeof search.list !== 'string' || search.list.trim() === '') {
        throw new Error('缺少搜索结果项选择器');
      }
      const items = queryAllIn(doc, search.list);
      return items.map((item) => ({
        title: pickFrom(item, search.title) || textOf(item) || pickFrom(item, 'a@text') || '',
        author: pickFrom(item, search.author),
        bookUrl: resolveUrl(pickFrom(item, search.bookUrl || 'a@href'), baseUrl),
      })).filter((result) => result.bookUrl !== '');
    }

    function probeToc(toc, doc, baseUrl) {
      if (toc === null || toc === undefined || typeof toc.list !== 'string' || toc.list.trim() === '') {
        throw new Error('缺少目录项选择器');
      }
      const items = queryAllIn(doc, toc.list);
      const chapters = items.map((item) => ({
        title: pickFrom(item, toc.title) || (item.textContent ?? '').trim(),
        url: resolveUrl(pickFrom(item, toc.chapterUrl || 'a@href'), baseUrl),
      })).filter((chapter) => chapter.url !== '');
      return {
        title: pickFrom(doc, toc.bookTitle),
        chapters,
      };
    }

    function probeContent(content, doc) {
      if (content === null || content === undefined || typeof content.text !== 'string' || content.text.trim() === '') {
        throw new Error('缺少正文容器选择器');
      }
      const clone = doc.cloneNode(true);
      const remove = Array.isArray(content.remove) ? content.remove : [];
      for (const selector of ['script', 'style', 'noscript', ...remove]) {
        let nodes = [];
        try { nodes = [...clone.querySelectorAll(selector)]; } catch { continue; }
        for (const node of nodes) node.remove();
      }
      const node = queryOneIn(clone, content.text);
      if (node === null) throw new Error('正文选择器没有匹配到内容');
      const text = textOf(node);
      if (text.length < 20) throw new Error('正文内容太少');
      return text;
    }

    async function postJson(path, body, signal) {
      const response = await fetch(apiUrl(path), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const payload = await response.json();
          if (typeof payload?.message === 'string') message = payload.message;
        } catch {
          /* keep the status line */
        }
        throw new Error(message);
      }
      return response.json();
    }

    async function aiStage(stage, payload, signal) {
      const data = await postJson('moyu/online/ai', Object.assign({ stage }, payload), signal);
      if (data === null || typeof data !== 'object' || data.result === null || typeof data.result !== 'object') {
        throw new Error('AI 服务返回了意外内容');
      }
      return data;
    }

    /** Ask the model for one stage; validation failures are fed back once. */
    async function aiStageWithRetry(stage, payload, validate, signal, onRetry) {
      let previous;
      let error = '';
      for (let attempt = 0; attempt < AI_MAX_ATTEMPTS; attempt += 1) {
        const data = await aiStage(stage, error === '' ? payload : Object.assign({}, payload, { previous, error }), signal);
        try {
          await validate(data.result);
          return data;
        } catch (failure) {
          previous = data.result;
          error = String(failure?.message ?? failure);
          if (attempt + 1 < AI_MAX_ATTEMPTS && typeof onRetry === 'function') onRetry(error);
        }
      }
      throw new Error(error);
    }

    /** Whether the page itself looks like a book detail / TOC page. */
    function looksLikeBookPage(doc, pageUrl) {
      const buckets = new Map();
      for (const anchor of anchorsIn(doc)) {
        const href = anchor.getAttribute('href') ?? '';
        const absolute = resolveUrl(href, pageUrl);
        if (absolute === '') continue;
        let path;
        try { path = new URL(absolute).pathname; } catch { continue; }
        const segments = path.split('/').filter((part) => part !== '');
        if (segments.length < 2) continue;
        const prefix = segments.slice(0, -1).join('/');
        if (prefix === '') continue;
        const bucket = buckets.get(prefix) ?? [];
        bucket.push(anchor);
        buckets.set(prefix, bucket);
      }
      for (const bucket of buckets.values()) {
        if (bucket.length < 20) continue;
        let chapterLike = 0;
        for (const anchor of bucket) {
          const text = (anchor.textContent ?? '').trim();
          if (/^第?[0-9零〇一二三四五六七八九十百千万两]+[章节回卷]/.test(text) || /^[0-9]+[\.、]/.test(text)) chapterLike += 1;
        }
        if (chapterLike >= 15) return true;
      }
      return false;
    }

    /** Extract the first GET search form on a page as a {{keyword}} template. */
    function detectSearchFromDoc(doc, pageUrl) {
      for (const formElement of [...doc.querySelectorAll('form')]) {
        const method = (formElement.getAttribute('method') ?? 'get').toLowerCase();
        if (method !== 'get') continue;
        const input = formElement.querySelector('input[name]');
        if (input === null) continue;
        const field = input.getAttribute('name');
        if (typeof field !== 'string' || field === '') continue;
        const action = resolveUrl(formElement.getAttribute('action') ?? '', pageUrl) || pageUrl;
        try {
          const url = new URL(action);
          url.searchParams.set(field, '{{keyword}}');
          // URLSearchParams encodes braces; the rule engine needs the literal placeholder.
          url.search = url.search.replace(/%7B%7Bkeyword%7D%7D/gi, '{{keyword}}');
          return url.toString();
        } catch {
          return '';
        }
      }
      return '';
    }

    function resolveTemplate(template, base) {
      const value = String(template ?? '').trim();
      if (value === '') return '';
      try {
        return new URL(value, base).toString();
      } catch {
        return '';
      }
    }

    /** Keep the search placeholder literal and derive it from a concrete test URL when needed. */
    function normalizeSearchTemplate(template, keyword) {
      const value = String(template ?? '').trim();
      if (value === '') return '';
      let next = value
        .replace(/%7B%7Bkeyword%7D%7D/gi, '{{keyword}}')
        .replace(/\{\{\s*keyword\s*\}\}/gi, '{{keyword}}');
      if (!next.includes('{{keyword}}')) {
        const encoded = encodeURIComponent(keyword);
        if (encoded !== '' && next.includes(encoded)) next = next.split(encoded).join('{{keyword}}');
        else if (keyword !== '' && next.includes(keyword)) next = next.split(keyword).join('{{keyword}}');
      }
      return next;
    }

    /**
     * Parse one site URL into a source rule: homepage → search → TOC → first
     * chapter, with the model generating selectors at each stage. The browser
     * owns the DOM, so every selector is validated against the real page before
     * it is accepted.
     */
    async function parseSourceWithAi(startUrl, keyword, options) {
      const opts = options ?? {};
      const signal = opts.signal;
      const report = typeof opts.onProgress === 'function' ? opts.onProgress : () => {};
      const log = [];
      const keywordText = String(keyword ?? '').trim() || '小说';

      const raw = String(startUrl ?? '').trim();
      if (raw === '') throw new Error('先填书源地址');
      const entry = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

      report('home');
      let homePage;
      try {
        homePage = await proxyFetch(entry, signal);
      } catch (failure) {
        throw new Error(`首页读取失败：${String(failure?.message ?? failure)}`);
      }
      const homeUrl = homePage.finalUrl || entry;
      const homeDoc = parseHtml(homePage.text);
      let baseUrl = homeUrl;
      try { baseUrl = new URL(homeUrl).origin; } catch { /* keep the page URL */ }
      const suppliedBookPage = looksLikeBookPage(homeDoc, homeUrl);
      log.push(suppliedBookPage ? '页面类型：书籍页' : '页面类型：站点首页');
      let name = '';
      if (!suppliedBookPage) name = collapseText(homeDoc.title ?? '', 80).split(/[-_|—]/)[0].trim();
      if (name === '') {
        try { name = new URL(homeUrl).hostname.replace(/^www\./, ''); } catch { name = '未命名书源'; }
      }
      let searchUrl = normalizeSearchTemplate(detectSearchFromDoc(homeDoc, homeUrl), keywordText);
      let sampleBookUrl = suppliedBookPage ? homeUrl : '';
      let model = '';

      if (searchUrl === '' && !suppliedBookPage) {
        report('analyze-home');
        const home = await aiStageWithRetry('homepage', {
          url: homeUrl,
          keyword: keywordText,
          html: digestHtml(homeDoc),
          hints: buildHints('homepage', homeDoc),
        }, () => undefined, signal, () => report('analyze-home'));
        model = `${home.model.provider}/${home.model.model}`;
        if (home.result.name !== '') name = home.result.name;
        if (home.result.baseUrl !== '') baseUrl = resolveTemplate(home.result.baseUrl, homeUrl) || baseUrl;
        if (home.result.searchUrl !== '') {
          searchUrl = normalizeSearchTemplate(resolveTemplate(home.result.searchUrl, homeUrl) || home.result.searchUrl, keywordText);
        }
        if (home.result.sampleBookUrl !== '') sampleBookUrl = resolveTemplate(home.result.sampleBookUrl, homeUrl);
      }
      log.push(`站点：${name} · ${baseUrl}`);

      let searchRule = null;
      let firstResult = null;
      if (searchUrl !== '') {
        report('search');
        log.push(`搜索模板：${searchUrl}`);
        try {
          const searchPage = await proxyFetch(expandTemplate(searchUrl, {
            base: baseUrl,
            keyword: encodeURIComponent(keywordText),
          }), signal);
          if (String(searchPage.text ?? '').trim().length < 100) {
            throw new Error('搜索页为空（站点可能不支持 GET 搜索）');
          }
          const searchDoc = parseHtml(searchPage.text);
          const searchUrlActual = searchPage.finalUrl || searchUrl;
          const parsed = await aiStageWithRetry('search', {
            url: searchUrlActual,
            keyword: keywordText,
            html: digestHtml(searchDoc),
            hints: buildHints('search', searchDoc),
          }, (result) => {
            if (probeSearchResults(result.search, searchDoc, searchUrlActual).length === 0) {
              throw new Error('搜索结果项选择器在本页没有匹配到任何结果');
            }
          }, signal, () => report('search'));
          searchRule = parsed.result.search;
          const results = probeSearchResults(searchRule, searchDoc, searchUrlActual);
          firstResult = results[0] ?? null;
          log.push(`搜索：${results.length} 条${firstResult === null ? '' : `，例：${firstResult.title}`}`);
        } catch (failure) {
          log.push(`搜索规则未解析：${String(failure?.message ?? failure)}`);
        }
      } else {
        log.push('未识别到搜索入口，将只生成目录 / 正文规则');
      }
      if (searchRule !== null) {
        const template = normalizeSearchTemplate(
          searchRule.url === '' ? searchUrl : (resolveTemplate(searchRule.url, baseUrl) || searchUrl),
          keywordText,
        );
        searchRule = Object.assign({}, searchRule, { url: template });
        if (!template.includes('{{keyword}}')) {
          log.push('警告：搜索地址没有 {{keyword}} 占位符，搜索可能固定为测试关键词');
        }
      }

      let bookUrl = '';
      let bookDoc = null;
      if (suppliedBookPage) {
        bookUrl = homeUrl;
        bookDoc = homeDoc;
      } else if (firstResult !== null && firstResult.bookUrl !== '') {
        bookUrl = firstResult.bookUrl;
      } else if (sampleBookUrl !== '') {
        bookUrl = sampleBookUrl;
      } else if (searchUrl === '') {
        // The supplied URL may itself be a book page: try it before asking for another URL.
        bookUrl = homeUrl;
        bookDoc = homeDoc;
      } else {
        const manual = typeof opts.bookUrl === 'string' ? opts.bookUrl.trim() : '';
        if (manual === '') throw new Error('没能找到书籍页：把书籍页 URL 填到下面的「书籍页 URL」再解析一次');
        bookUrl = /^https?:\/\//i.test(manual) ? manual : resolveUrl(manual, homeUrl);
      }

      if (bookDoc === null) {
        report('book');
        let tocPage;
        try {
          tocPage = await proxyFetch(bookUrl, signal);
        } catch (failure) {
          throw new Error(`书籍页读取失败：${String(failure?.message ?? failure)}`);
        }
        bookUrl = tocPage.finalUrl || bookUrl;
        bookDoc = parseHtml(tocPage.text);
      }

      report('toc');
      let tocStage;
      try {
        tocStage = await aiStageWithRetry('toc', {
          url: bookUrl,
          keyword: keywordText,
          html: digestHtml(bookDoc),
          hints: buildHints('toc', bookDoc),
        }, (result) => {
          if (probeToc(result.toc, bookDoc, bookUrl).chapters.length === 0) {
            throw new Error('目录项选择器在本页没有匹配到章节');
          }
        }, signal, () => report('toc'));
      } catch (failure) {
        if (!suppliedBookPage && bookDoc === homeDoc) {
          throw new Error('没能从当前地址识别目录：请把书籍页 URL 填到下面的「书籍页 URL」再解析一次');
        }
        throw failure;
      }
      model = `${tocStage.model.provider}/${tocStage.model.model}`;
      const tocRule = tocStage.result.toc;
      const toc = probeToc(tocRule, bookDoc, bookUrl);
      log.push(`目录：${toc.chapters.length} 章 · 《${toc.title || name}》`);

      report('chapter');
      const firstChapter = toc.chapters[0];
      let chapterPage;
      try {
        chapterPage = await proxyFetch(firstChapter.url, signal);
      } catch (failure) {
        throw new Error(`章节页读取失败：${String(failure?.message ?? failure)}`);
      }
      const chapterDoc = parseHtml(chapterPage.text);

      report('content');
      const contentStage = await aiStageWithRetry('content', {
        url: chapterPage.finalUrl || firstChapter.url,
        keyword: keywordText,
        html: digestHtml(chapterDoc),
        hints: buildHints('content', chapterDoc),
      }, (result) => {
        probeContent(result.content, chapterDoc);
      }, signal, () => report('content'));
      const contentRule = contentStage.result.content;
      const text = probeContent(contentRule, chapterDoc);
      log.push(`正文：${text.length} 字`);
      log.push(`预览：${text.slice(0, 80)}`);
      if (model !== '') log.push(`模型：${model}`);

      const rule = normalizeSource({
        id: name,
        name,
        baseUrl,
        search: searchRule ?? undefined,
        toc: tocRule,
        content: contentRule,
      });
      log.push('', JSON.stringify(rule, null, 2));
      return {
        rule,
        form: formFromRule(rule),
        book: {
          url: bookUrl,
          title: toc.title || name,
          author: firstResult?.author ?? '',
        },
        model,
        log: log.join('\n'),
      };
    }

    function removeBook(id) {
      const snap = store.get();
      const books = snap.books.filter((book) => book.id !== id);
      const progress = Object.assign({}, snap.progress);
      delete progress[id];
      const reading = snap.reading.bookId === id
        ? {
          bookId: books[0]?.id ?? null,
          ...(books[0] ? snap.progress[books[0].id] ?? { chapter: 0, page: 0 } : { chapter: 0, page: 0 }),
        }
        : snap.reading;
      persistedPatch({ books, progress, reading, active: reading.bookId !== null && snap.active });
    }

    function openBook(id) {
      const snap = store.get();
      const saved = snap.progress[id] ?? { chapter: 0, page: 0 };
      persistedPatch({ reading: { bookId: id, chapter: saved.chapter ?? 0, page: saved.page ?? 0 } });
    }

    function setReading(reading) {
      const snap = store.get();
      const progress = Object.assign({}, snap.progress, {
        [reading.bookId]: { chapter: reading.chapter, page: reading.page },
      });
      persistedPatch({ reading, progress });
    }

    function setSettings(patch) {
      const snap = store.get();
      persistedPatch({ settings: Object.assign({}, snap.settings, patch) });
    }

    const bus = {
      nextPage() {},
      prevPage() {},
      nextChapter() {},
      prevChapter() {},
      jump() {},
    };

    // ------------------------------------------------------------------
    // status bar = the reading surface
    // ------------------------------------------------------------------

    function StatusBar({ locale, api }) {
      const t = useT(locale);
      const snap = useStore(store);
      const book = snap.books.find((entry) => entry.id === snap.reading.bookId) ?? null;
      const [state, setState] = React.useState({ status: 'idle' });
      const [text, setText] = React.useState('');
      const [totalChapters, setTotalChapters] = React.useState(0);
      const inputRef = React.useRef(null);
      const barRef = React.useRef(null);
      const tocInputRef = React.useRef(null);
      const tocListRef = React.useRef(null);
      const [tocState, setTocState] = React.useState({ status: 'idle', chapters: [] });
      const [tocFilter, setTocFilter] = React.useState('');
      const [tocSelected, setTocSelected] = React.useState(0);

      const pages = React.useMemo(
        () => paginate(text, snap.settings.charsPerPage),
        [text, snap.settings.charsPerPage],
      );
      const pageIndex = Math.min(Math.max(0, snap.reading.page), Math.max(0, pages.length - 1));
      const pageText = pages[pageIndex] ?? '';

      React.useEffect(() => {
        if (!snap.active || book === null) {
          setState({ status: 'idle' });
          setText('');
          setTotalChapters(0);
          return undefined;
        }
        const controller = new AbortController();
        setState({ status: 'loading' });
        loadChapterForBook(book, snap.reading.chapter, controller.signal)
          .then((data) => {
            if (controller.signal.aborted) return;
            setText(typeof data.text === 'string' ? data.text : '');
            setTotalChapters(Number(data.total) || 1);
            setState({ status: 'ready' });
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            setState({ status: 'error', message: String(error?.message ?? error) });
          });
        return () => controller.abort();
      }, [snap.active, book?.id, snap.reading.chapter]);

      React.useEffect(() => {
        const body = document.body;
        if (body === undefined || body === null) return undefined;
        if (snap.active) body.setAttribute('data-moyu-reading', 'true');
        else body.removeAttribute('data-moyu-reading');
        return () => body.removeAttribute('data-moyu-reading');
      }, [snap.active]);

      React.useEffect(() => {
        if (snap.jumpOpen && inputRef.current !== null) inputRef.current.focus();
      }, [snap.jumpOpen]);

      React.useEffect(() => {
        if (state.status !== 'ready') return;
        const last = Math.max(0, pages.length - 1);
        let next = Math.min(Math.max(0, snap.reading.page), last);
        if (snap.pendingLast) {
          next = last;
          store.set({ pendingLast: false });
        }
        if (next !== snap.reading.page) setReading({ ...snap.reading, page: next });
      }, [state.status, pages.length]);

      function nextPage() {
        const current = store.get().reading;
        if (!store.get().active || current.bookId === null) return;
        if (pageIndex + 1 < pages.length) setReading({ ...current, page: pageIndex + 1 });
        else if (current.chapter + 1 < totalChapters) {
          store.set({ pendingLast: false });
          setReading({ bookId: current.bookId, chapter: current.chapter + 1, page: 0 });
        }
      }

      function prevPage() {
        const current = store.get().reading;
        if (!store.get().active || current.bookId === null) return;
        if (pageIndex > 0) setReading({ ...current, page: pageIndex - 1 });
        else if (current.chapter > 0) {
          store.set({ pendingLast: true });
          setReading({ bookId: current.bookId, chapter: current.chapter - 1, page: 0 });
        }
      }

      function nextChapter() {
        const current = store.get().reading;
        if (!store.get().active || current.bookId === null) return;
        if (current.chapter + 1 < totalChapters) {
          store.set({ pendingLast: false });
          setReading({ bookId: current.bookId, chapter: current.chapter + 1, page: 0 });
        }
      }

      function prevChapter() {
        const current = store.get().reading;
        if (!store.get().active || current.bookId === null) return;
        if (current.chapter > 0) {
          store.set({ pendingLast: false });
          setReading({ bookId: current.bookId, chapter: current.chapter - 1, page: 0 });
        }
      }

      function submitJump(value) {
        const raw = String(value ?? '').trim();
        store.set({ jumpOpen: false });
        if (raw === '') return;
        const chapterMatch = /^c(\d+)$/i.exec(raw);
        if (chapterMatch !== null) {
          const target = Math.max(0, Math.min(totalChapters - 1, Number(chapterMatch[1]) - 1));
          store.set({ pendingLast: false });
          setReading({ ...store.get().reading, chapter: target, page: 0 });
          return;
        }
        const pageMatch = /^(\d+)$/.exec(raw);
        if (pageMatch !== null) {
          const target = Math.max(0, Math.min(pages.length - 1, Number(pageMatch[1]) - 1));
          setReading({ ...store.get().reading, page: target });
        }
      }

      React.useEffect(() => {
        bus.nextPage = nextPage;
        bus.prevPage = prevPage;
        bus.nextChapter = nextChapter;
        bus.prevChapter = prevChapter;
        bus.jump = () => store.set({ jumpOpen: true, tocOpen: false });
      });

      React.useEffect(() => {
        if (!snap.tocOpen || book === null) {
          setTocState({ status: 'idle', chapters: [] });
          return undefined;
        }
        const controller = new AbortController();
        setTocState({ status: 'loading', chapters: [] });
        setTocFilter('');
        setTocSelected(snap.reading.chapter);
        ensureToc(book, controller.signal)
          .then((chapters) => {
            if (!controller.signal.aborted) setTocState({ status: 'ready', chapters });
          })
          .catch((error) => {
            if (!controller.signal.aborted) {
              setTocState({ status: 'error', chapters: [], message: String(error?.message ?? error) });
            }
          });
        return () => controller.abort();
      }, [snap.tocOpen, book?.id]);

      React.useEffect(() => {
        if (snap.tocOpen && tocInputRef.current !== null) tocInputRef.current.focus();
      }, [snap.tocOpen]);

      React.useEffect(() => {
        if (!snap.tocOpen || tocListRef.current === null) return;
        const node = tocListRef.current.querySelector(`[data-toc-index="${tocSelected}"]`);
        if (node !== null && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'center' });
      }, [snap.tocOpen, tocSelected, tocState.chapters.length]);

      const filteredToc = React.useMemo(() => {
        const query = tocFilter.trim().toLowerCase();
        const entries = tocState.chapters.map((chapter, index) => ({ chapter, index }));
        if (query === '') return entries;
        return entries.filter((entry) => String(entry.chapter.title).toLowerCase().includes(query));
      }, [tocState.chapters, tocFilter]);

      function moveTocSelection(delta) {
        if (filteredToc.length === 0) return;
        const current = filteredToc.findIndex((entry) => entry.index === tocSelected);
        const next = current < 0 ? 0 : Math.max(0, Math.min(filteredToc.length - 1, current + delta));
        setTocSelected(filteredToc[next].index);
      }

      function jumpToChapter(index) {
        store.set({ tocOpen: false, pendingLast: false });
        setReading(Object.assign({}, store.get().reading, { chapter: index, page: 0 }));
      }

      if (!snap.active) return null;

      const meta = book === null
        ? ''
        : t('reader.chapterMeta', { n: snap.reading.chapter + 1, p: pageIndex + 1, total: pages.length });
      let line;
      if (book === null) line = t('reader.emptyHint');
      else if (state.status === 'loading') line = t('reader.loading');
      else if (state.status === 'error') line = t('reader.error', { message: state.message ?? '' });
      else line = pageText;

      function onBarClick(event) {
        if (book === null || state.status !== 'ready' || barRef.current === null) return;
        const rect = barRef.current.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
        if (ratio < 0.3) prevPage();
        else nextPage();
      }

      const dock = snap.jumpOpen
        ? h('div', { className: 'my-line-row my-jumprow', onClick: (event) => event.stopPropagation() },
          h('span', { className: 'my-prompt' }, '❯'),
          h('input', {
            ref: inputRef,
            className: 'my-input',
            placeholder: t('jump.placeholder'),
            onKeyDown: (event) => {
              if (event.key === 'Enter') submitJump(event.currentTarget.value);
              if (event.key === 'Escape') store.set({ jumpOpen: false });
            },
          }))
        : h('div', { className: 'my-line-row', ref: barRef, onClick: onBarClick },
          h('span', { className: 'my-status-line' }, line),
          h('span', { className: 'my-status-right' }, meta));

      let tocPanel = null;
      if (snap.tocOpen) {
        const rect = barRef.current !== null && typeof barRef.current.getBoundingClientRect === 'function'
          ? barRef.current.getBoundingClientRect()
          : null;
        const bottom = rect === null ? 64 : Math.max(8, Math.round(window.innerHeight - rect.top + 8));
        tocPanel = h('div', { className: 'my-toc', style: { bottom: `${bottom}px` }, onClick: (event) => event.stopPropagation() },
          h('div', { className: 'my-toc-head' },
            h('span', { className: 'my-toc-title' }, book === null ? t('toc.title') : `${book.title} · ${t('toc.title')}`),
            h('span', { className: 'my-toc-count' }, String(tocState.chapters.length))),
          h('input', {
            ref: tocInputRef,
            className: 'my-toc-filter',
            value: tocFilter,
            placeholder: t('toc.filter'),
            onChange: (event) => { setTocFilter(event.currentTarget.value); setTocSelected(-1); },
            onKeyDown: (event) => {
              if (event.key === 'Escape') store.set({ tocOpen: false });
              else if (event.key === 'ArrowDown') { event.preventDefault(); moveTocSelection(1); }
              else if (event.key === 'ArrowUp') { event.preventDefault(); moveTocSelection(-1); }
              else if (event.key === 'Enter') {
                const target = tocSelected >= 0 ? tocSelected : filteredToc[0]?.index;
                if (target !== undefined) jumpToChapter(target);
              }
            },
          }),
          h('div', { className: 'my-toc-list', ref: tocListRef },
            tocState.status === 'loading'
              ? h('div', { className: 'my-toc-empty' }, t('toc.loading'))
              : (tocState.status === 'error'
                ? h('div', { className: 'my-toc-empty' }, tocState.message)
                : (filteredToc.length === 0
                  ? h('div', { className: 'my-toc-empty' }, t('toc.empty'))
                  : filteredToc.map((entry) => h('button', {
                    key: entry.index,
                    type: 'button',
                    'data-toc-index': entry.index,
                    className: 'my-toc-row'
                      + (entry.index === snap.reading.chapter ? ' current' : '')
                      + (entry.index === tocSelected ? ' selected' : ''),
                    onClick: () => jumpToChapter(entry.index),
                  },
                    h('span', { className: 'my-toc-index' }, String(entry.index + 1)),
                    h('span', { className: 'my-toc-name' }, entry.chapter.title)))))),
          h('div', { className: 'my-toc-foot' }, t('toc.hint')));
      }

      return h(React.Fragment, null,
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        dock,
        tocPanel);
    }

    // ------------------------------------------------------------------
    // legacy cleanup: sidebar layouts may restore the removed reader tab
    // ------------------------------------------------------------------

    function StaleReaderTab({ useTabInfo }) {
      React.useEffect(() => {
        try {
          const info = typeof useTabInfo === 'function' ? useTabInfo() : undefined;
          info?.tab?.actions?.close?.();
        } catch {
          /* nothing to close */
        }
      }, [useTabInfo]);
      return null;
    }

    // ------------------------------------------------------------------
    // header entry
    // ------------------------------------------------------------------

    function MoyuMark() {
      return h('svg', {
        viewBox: '0 0 23.16 17.04', width: 20, height: 14.7,
        'aria-hidden': true, focusable: false,
      }, h('path', { d: FISH_LOGO_PATH, fill: 'currentColor' }));
    }

    function EntryButton({ locale, api }) {
      const t = useT(locale);
      return h(React.Fragment, null,
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('button', {
          className: 'my-entry-btn',
          title: t('entry.tooltip'),
          'aria-label': t('entry.tooltip'),
          onClick: () => api.toggleReading(),
        }, h(MoyuMark)));
    }

    // ------------------------------------------------------------------
    // settings section
    // ------------------------------------------------------------------

    function OnlineSourcesCard({ snap, t }) {
      const [form, setForm] = React.useState(emptySourceForm);
      const [testKeyword, setTestKeyword] = React.useState('');
      const [testBookUrl, setTestBookUrl] = React.useState('');
      const [testBusy, setTestBusy] = React.useState(false);
      const [testOutput, setTestOutput] = React.useState('');
      const [testError, setTestError] = React.useState('');
      const [searchKeyword, setSearchKeyword] = React.useState('');
      const [searchSourceId, setSearchSourceId] = React.useState('');
      const [searchBusy, setSearchBusy] = React.useState(false);
      const [searchError, setSearchError] = React.useState('');
      const [searchResults, setSearchResults] = React.useState(null);
      const [addingUrl, setAddingUrl] = React.useState('');
      const [showAdvanced, setShowAdvanced] = React.useState(false);
      const [aiUrl, setAiUrl] = React.useState('');
      const [aiKeyword, setAiKeyword] = React.useState('');
      const [aiBusy, setAiBusy] = React.useState(false);
      const [aiStage, setAiStage] = React.useState('');
      const [aiOutput, setAiOutput] = React.useState('');
      const [aiError, setAiError] = React.useState('');
      const [aiBook, setAiBook] = React.useState(null);
      const [aiSaving, setAiSaving] = React.useState(false);

      const sources = snap.settings.sources;
      const searchable = sources.filter((source) => source.search !== null);
      const effectiveSourceId = searchable.some((source) => source.id === searchSourceId)
        ? searchSourceId
        : (searchable[0]?.id ?? '');

      function setField(key, value) {
        setForm((previous) => Object.assign({}, previous, { [key]: value }));
      }

      function field(key, label, placeholder) {
        return h('div', { key, className: 'my-field' },
          h('span', { className: 'my-field-label' }, label),
          h('input', {
            className: 'my-field-input',
            value: form[key] ?? '',
            placeholder: placeholder ?? '',
            onChange: (event) => setField(key, event.currentTarget.value),
          }));
      }

      const AI_STAGE_LABELS = {
        'home': 'ai.stageHome',
        'analyze-home': 'ai.stageAnalyzeHome',
        'search': 'ai.stageSearch',
        'book': 'ai.stageBook',
        'toc': 'ai.stageToc',
        'chapter': 'ai.stageChapter',
        'content': 'ai.stageContent',
      };

      async function runAiParse() {
        if (aiBusy) return;
        setAiBusy(true);
        setAiError('');
        setAiOutput('');
        setAiBook(null);
        setAiStage(t('ai.busy'));
        try {
          const entry = (aiUrl.trim() !== '' ? aiUrl : form.baseUrl).trim();
          const parsed = await parseSourceWithAi(entry, aiKeyword, {
            bookUrl: testBookUrl,
            onProgress: (stage) => setAiStage(t(AI_STAGE_LABELS[stage] ?? 'ai.busy')),
          });
          setForm(parsed.form);
          setAiBook(parsed.book);
          setAiOutput(parsed.log);
          setAiStage('');
          setTestError('');
          setTestOutput('');
        } catch (failure) {
          setAiStage('');
          setAiError(t('ai.failed', { message: String(failure?.message ?? failure) }));
        } finally {
          setAiBusy(false);
        }
      }

      async function saveAiBook() {
        if (aiBook === null || aiSaving) return;
        setAiSaving(true);
        setAiError('');
        try {
          const rule = ruleFromForm(form);
          const current = store.get().settings.sources;
          setSettings({ sources: [rule, ...current.filter((source) => source.id !== rule.id)] });
          const toc = await fetchToc(rule, aiBook.url);
          if (toc.chapters.length === 0) throw new Error('目录为空');
          addOnlineBookToShelf(rule, { title: aiBook.title, author: aiBook.author, bookUrl: aiBook.url }, toc);
          setAiOutput((previous) => `${previous}\n\n${t('ai.saved')}`);
          setAiBook(null);
        } catch (failure) {
          setAiError(t('ai.failed', { message: String(failure?.message ?? failure) }));
        } finally {
          setAiSaving(false);
        }
      }

      async function detectSearchUrl() {
        setTestError('');
        setTestOutput('');
        try {
          const base = form.baseUrl.trim();
          if (base === '') throw new Error(t('source.minimal'));
          const page = await proxyFetch(base);
          const doc = parseHtml(page.text);
          const detected = detectSearchFromDoc(doc, page.finalUrl || base);
          if (detected !== '') {
            setField('searchUrl', detected);
            setTestOutput(t('source.detected'));
            return;
          }
          setTestError(t('source.noSearchForm'));
        } catch (failure) {
          setTestError(t('source.testFailed', { message: String(failure?.message ?? failure) }));
        }
      }

      async function testCurrent() {
        if (testBusy) return;
        setTestBusy(true);
        setTestError('');
        setTestOutput('');
        const lines = [];
        try {
          const rule = ruleFromForm(form);
          let first = null;
          if (rule.search !== null) {
            const results = await searchSource(rule, testKeyword);
            lines.push(`搜索：${results.length} 条`);
            first = results[0] ?? null;
            if (first !== null) lines.push(`  1. ${first.title} | ${first.author} | ${first.bookUrl}`);
          }
          const bookUrl = (first !== null && first.bookUrl !== '') ? first.bookUrl : testBookUrl.trim();
          if (bookUrl === '') throw new Error('没有搜索结果，请填书籍页 URL');
          const toc = await fetchToc(rule, bookUrl);
          lines.push(`目录：${toc.chapters.length} 章 · 书名《${toc.title || '未识别'}》`);
          if (toc.chapters.length === 0) throw new Error('目录为空');
          lines.push(`  1. ${toc.chapters[0].title} | ${toc.chapters[0].url}`);
          const content = await fetchOnlineContent(rule, toc.chapters[0].url);
          lines.push(`正文：${content.length} 字`);
          lines.push(`  预览：${content.slice(0, 100)}`);
          setTestOutput(lines.join('\n'));
        } catch (failure) {
          setTestOutput(lines.join('\n'));
          setTestError(t('source.testFailed', { message: String(failure?.message ?? failure) }));
        } finally {
          setTestBusy(false);
        }
      }

      function saveCurrent() {
        try {
          const rule = ruleFromForm(form);
          const current = store.get().settings.sources;
          setSettings({ sources: [rule, ...current.filter((source) => source.id !== rule.id)] });
          setForm(emptySourceForm());
          setTestOutput(t('source.saved', { name: rule.name }));
          setTestError('');
        } catch (failure) {
          setTestError(t('source.invalid', { message: String(failure?.message ?? failure) }));
        }
      }

      function editSource(source) {
        setForm(formFromRule(source));
        setAiUrl(source.baseUrl);
        setAiError('');
        setAiOutput('');
        setAiBook(null);
        setTestError('');
        setTestOutput('');
      }

      async function runSearch() {
        const source = sources.find((entry) => entry.id === effectiveSourceId);
        if (source === undefined) {
          setSearchError(t('search.needSource'));
          return;
        }
        setSearchBusy(true);
        setSearchError('');
        setSearchResults(null);
        try {
          setSearchResults(await searchSource(source, searchKeyword));
        } catch (failure) {
          setSearchError(t('search.failed', { message: String(failure?.message ?? failure) }));
        } finally {
          setSearchBusy(false);
        }
      }

      async function addResult(result) {
        const source = sources.find((entry) => entry.id === effectiveSourceId);
        if (source === undefined) return;
        setAddingUrl(result.bookUrl);
        setSearchError('');
        try {
          const toc = await fetchToc(source, result.bookUrl);
          if (toc.chapters.length === 0) throw new Error('目录为空');
          addOnlineBookToShelf(source, result, toc);
        } catch (failure) {
          setSearchError(t('reader.tocFailed', { message: String(failure?.message ?? failure) }));
        } finally {
          setAddingUrl('');
        }
      }

      const sourceRows = sources.map((source) => h('div', { key: source.id, className: 'my-book' },
        h('div', { className: 'my-book-main' },
          h('div', { className: 'my-book-title' }, source.name),
          h('div', { className: 'my-book-meta' }, source.baseUrl === '' ? source.id : source.baseUrl)),
        h('button', { className: 'my-btn', onClick: () => editSource(source) }, t('source.edit')),
        h('button', { className: 'my-btn', onClick: () => setSettings({ sources: sources.filter((entry) => entry.id !== source.id) }) }, t('source.remove'))));

      return h('div', { className: 'my-card' },
        h('h3', null, t('settings.sources')),
        h('div', { className: 'my-sub' }, t('source.hint')),

        h('div', { className: 'my-form-section' },
          h('h4', null, t('ai.title')),
          h('div', { className: 'my-sub' }, t('ai.hint')),
          h('div', { className: 'my-row' },
            h('input', {
              className: 'my-input-path',
              value: aiUrl,
              placeholder: t('ai.url'),
              onChange: (event) => setAiUrl(event.currentTarget.value),
              onKeyDown: (event) => { if (event.key === 'Enter') runAiParse(); },
            }),
            h('input', {
              className: 'my-input-path',
              style: { maxWidth: '220px' },
              value: aiKeyword,
              placeholder: t('ai.keyword'),
              onChange: (event) => setAiKeyword(event.currentTarget.value),
              onKeyDown: (event) => { if (event.key === 'Enter') runAiParse(); },
            }),
            h('button', { className: 'my-btn primary', disabled: aiBusy, onClick: runAiParse },
              aiBusy ? t('ai.busy') : t('ai.button'))),
          aiStage === '' ? null : h('div', { className: 'my-sub' }, aiStage),
          aiError === '' ? null : h('div', { className: 'my-error' }, aiError),
          aiOutput === '' ? null : h('pre', { className: 'my-debug-output' }, aiOutput),
          aiBook === null ? null : h('div', { className: 'my-row' },
            h('span', { className: 'my-sub' }, `${aiBook.title} · ${aiBook.url}`),
            h('button', { className: 'my-btn primary', disabled: aiSaving, onClick: saveAiBook },
              aiSaving ? t('ai.saving') : t('ai.saveRead')))),

        sources.length === 0 ? h('div', { className: 'my-sub' }, t('source.empty')) : sourceRows,

        h('div', { className: 'my-form-section' },
          h('h4', null, form.id === '' ? t('source.new') : t('source.editTitle')),
          h('div', { className: 'my-sub' }, t('source.minimal')),
          h('div', { className: 'my-form-grid' },
            field('name', t('source.name')),
            field('baseUrl', t('source.baseUrl'))),
          h('div', { className: 'my-row' },
            h('div', { className: 'my-field', style: { flex: '1', minWidth: '220px' } },
              h('span', { className: 'my-field-label' }, t('source.searchUrl')),
              h('input', {
                className: 'my-field-input',
                value: form.searchUrl,
                placeholder: 'https://site/search?q={{keyword}}',
                onChange: (event) => setField('searchUrl', event.currentTarget.value),
              })),
            h('button', { className: 'my-btn', onClick: detectSearchUrl }, t('source.detectSearch'))),
          h('div', { className: 'my-form-grid' },
            field('searchList', t('source.searchList')),
            field('tocList', t('source.tocList')),
            field('contentText', t('source.contentText'))),
          h('button', {
            className: 'my-btn',
            onClick: () => setShowAdvanced((value) => !value),
          }, t('source.advanced')),
          showAdvanced
            ? h('div', { className: 'my-form-section' },
              h('div', { className: 'my-form-label' }, '搜索'),
              h('div', { className: 'my-form-grid' },
                field('searchTitle', t('source.searchTitle')),
                field('searchAuthor', t('source.searchAuthor')),
                field('searchBookUrl', t('source.searchBookUrl'))),
              h('div', { className: 'my-form-label' }, '目录'),
              h('div', { className: 'my-form-grid' },
                field('tocTitle', t('source.tocTitle')),
                field('tocChapterUrl', t('source.tocChapterUrl')),
                field('tocBookTitle', t('source.tocBookTitle'))),
              h('div', { className: 'my-form-label' }, '正文'),
              h('div', { className: 'my-form-grid' },
                field('contentRemove', t('source.contentRemove'))))
            : null),

        h('div', { className: 'my-row' },
          h('input', {
            className: 'my-input-path',
            value: testKeyword,
            placeholder: t('source.testKeyword'),
            onChange: (event) => setTestKeyword(event.currentTarget.value),
          }),
          h('button', { className: 'my-btn primary', disabled: testBusy, onClick: testCurrent },
            testBusy ? t('source.testing') : t('source.test'))),
        h('div', { className: 'my-row' },
          h('input', {
            className: 'my-input-path',
            value: testBookUrl,
            placeholder: t('source.testBookUrl'),
            onChange: (event) => setTestBookUrl(event.currentTarget.value),
          }),
          h('button', { className: 'my-btn', onClick: saveCurrent }, t('source.save')),
          h('button', { className: 'my-btn', onClick: () => { setForm(emptySourceForm()); setTestOutput(''); setTestError(''); } }, t('source.clear'))),
        testError === '' ? null : h('div', { className: 'my-error' }, testError),
        testOutput === '' ? null : h('pre', { className: 'my-debug-output' }, testOutput),

        h('div', { className: 'my-form-section' },
          h('div', { className: 'my-row' },
            searchable.length === 0
              ? h('span', { className: 'my-sub' }, t('search.needSource'))
              : h('select', {
                className: 'my-select',
                value: effectiveSourceId,
                onChange: (event) => setSearchSourceId(event.currentTarget.value),
              }, searchable.map((source) => h('option', { key: source.id, value: source.id }, source.name))),
            h('input', {
              className: 'my-input-path',
              value: searchKeyword,
              placeholder: t('search.keyword'),
              onChange: (event) => setSearchKeyword(event.currentTarget.value),
              onKeyDown: (event) => { if (event.key === 'Enter') runSearch(); },
            }),
            h('button', { className: 'my-btn', disabled: searchBusy || searchable.length === 0, onClick: runSearch },
              searchBusy ? t('search.searching') : t('search.button'))),
          searchError === '' ? null : h('div', { className: 'my-error' }, searchError),
          searchResults === null
            ? null
            : (searchResults.length === 0
              ? h('div', { className: 'my-sub' }, t('search.empty'))
              : searchResults.map((result) => h('div', { key: result.bookUrl, className: 'my-book' },
                h('div', { className: 'my-book-main' },
                  h('div', { className: 'my-book-title' }, result.title || result.bookUrl),
                  result.author === '' ? null : h('div', { className: 'my-book-meta' }, result.author)),
                h('button', {
                  className: 'my-btn',
                  disabled: addingUrl === result.bookUrl,
                  onClick: () => addResult(result),
                }, addingUrl === result.bookUrl ? t('search.adding') : t('search.add')))))));
    }

    function SwitchSourcePanel({ book, snap, t, onClose }) {
      const sources = snap.settings.sources.filter((source) => source.search !== null && source.id !== book.sourceId);
      const [sourceId, setSourceId] = React.useState('');
      const [keyword, setKeyword] = React.useState(book.title);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [results, setResults] = React.useState(null);
      const effective = sources.some((source) => source.id === sourceId) ? sourceId : (sources[0]?.id ?? '');

      async function run() {
        const source = sources.find((entry) => entry.id === effective);
        if (source === undefined) return;
        setBusy(true);
        setError('');
        setResults(null);
        try {
          setResults(await searchSource(source, keyword));
        } catch (failure) {
          setError(t('switch.failed', { message: String(failure?.message ?? failure) }));
        } finally {
          setBusy(false);
        }
      }

      async function useSource(result) {
        const source = sources.find((entry) => entry.id === effective);
        if (source === undefined) return;
        setBusy(true);
        setError('');
        try {
          const toc = await fetchToc(source, result.bookUrl);
          if (toc.chapters.length === 0) throw new Error('目录为空');
          const current = store.get();
          const oldProgress = current.progress[book.id] ?? { chapter: 0, page: 0 };
          const oldChapters = tocCache.get(book.id);
          const oldTitle = oldChapters?.[oldProgress.chapter]?.title;
          const found = oldTitle === undefined ? -1 : toc.chapters.findIndex((chapter) => chapter.title === oldTitle);
          const chapter = found >= 0 ? found : Math.min(oldProgress.chapter, toc.chapters.length - 1);
          tocCache.set(book.id, toc.chapters);
          contentCache.clear();
          const books = current.books.map((entry) => (entry.id === book.id
            ? Object.assign({}, entry, {
              sourceId: source.id,
              bookUrl: result.bookUrl,
              chapterCount: toc.chapters.length,
              title: toc.title || entry.title,
            })
            : entry));
          persistedPatch({
            books,
            progress: Object.assign({}, current.progress, { [book.id]: { chapter, page: 0 } }),
            reading: { bookId: book.id, chapter, page: 0 },
            active: true,
          });
          onClose();
        } catch (failure) {
          setError(t('switch.failed', { message: String(failure?.message ?? failure) }));
        } finally {
          setBusy(false);
        }
      }

      return h('div', { className: 'my-card' },
        h('h3', null, t('switch.title')),
        sources.length === 0
          ? h('div', { className: 'my-sub' }, t('switch.needSource'))
          : h(React.Fragment, null,
            h('div', { className: 'my-row' },
              h('select', {
                className: 'my-select',
                value: effective,
                onChange: (event) => setSourceId(event.currentTarget.value),
              }, sources.map((source) => h('option', { key: source.id, value: source.id }, source.name))),
              h('input', {
                className: 'my-input-path',
                value: keyword,
                placeholder: t('switch.keyword'),
                onChange: (event) => setKeyword(event.currentTarget.value),
              }),
              h('button', { className: 'my-btn', disabled: busy, onClick: run }, busy ? t('switch.busy') : t('switch.search'))),
            error === '' ? null : h('div', { className: 'my-error' }, error),
            results === null
              ? null
              : (results.length === 0
                ? h('div', { className: 'my-sub' }, t('search.empty'))
                : results.map((result) => h('div', { key: result.bookUrl, className: 'my-book' },
                  h('div', { className: 'my-book-main' },
                    h('div', { className: 'my-book-title' }, result.title || result.bookUrl),
                    result.author === '' ? null : h('div', { className: 'my-book-meta' }, result.author)),
                  h('button', { className: 'my-btn', disabled: busy, onClick: () => useSource(result) }, t('switch.use')))))),
        h('div', { className: 'my-row' },
          h('button', { className: 'my-btn', onClick: onClose }, t('switch.cancel'))));
    }

    function SettingsSection({ locale, t, api }) {
      const tr = useT(locale);
      t = t ?? tr;
      const snap = useStore(store);
      const [path, setPath] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [switchTarget, setSwitchTarget] = React.useState(null);

      async function runImport() {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
          await importBook(path.trim());
          setPath('');
        } catch (failure) {
          setError(t('settings.importFailed', { message: String(failure?.message ?? failure) }));
        } finally {
          setBusy(false);
        }
      }

      const books = snap.books.map((book) => {
        const progress = snap.progress[book.id] ?? { chapter: 0, page: 0 };
        const source = snap.settings.sources.find((entry) => entry.id === book.sourceId);
        return h('div', { key: book.id, className: 'my-book' },
          h('div', { className: 'my-book-main' },
            h('div', { className: 'my-book-title' }, book.title),
            h('div', { className: 'my-book-meta' },
              t('settings.chapters', { n: book.chapterCount ?? 1 }),
              ' · ',
              t('settings.progress', { c: progress.chapter + 1 }),
              book.kind === 'online' && source !== undefined ? ` · ${t('book.source', { name: source.name })}` : '')),
          h('button', { className: 'my-btn', onClick: () => { openBook(book.id); store.set({ active: true }); } }, t('settings.read')),
          book.kind === 'online'
            ? h('button', { className: 'my-btn', onClick: () => setSwitchTarget(book) }, t('switch.title'))
            : null,
          h('button', { className: 'my-btn', onClick: () => removeBook(book.id) }, t('settings.remove')));
      });

      return h('div', { className: 'my-settings' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', null,
          h('h2', null, t('settings.title')),
          h('div', { className: 'my-sub' }, t('settings.subtitle'))),

        h('div', { className: 'my-card' },
          h('h3', null, t('settings.bookshelf')),
          h('div', { className: 'my-row' },
            h('input', {
              className: 'my-input-path',
              value: path,
              placeholder: t('settings.importPath'),
              onChange: (event) => setPath(event.currentTarget.value),
              onKeyDown: (event) => { if (event.key === 'Enter') runImport(); },
            }),
            h('button', { className: 'my-btn primary', disabled: busy, onClick: runImport },
              busy ? t('settings.importing') : t('settings.import'))),
          error === '' ? null : h('div', { className: 'my-error' }, error),
          books.length === 0 ? h('div', { className: 'my-sub' }, t('settings.empty')) : books,
          switchTarget === null ? null : h(SwitchSourcePanel, {
            book: switchTarget,
            snap,
            t,
            onClose: () => setSwitchTarget(null),
          })),

        h('div', { className: 'my-card' },
          h('h3', null, t('settings.reading')),
          h('div', { className: 'my-row' },
            h('span', { className: 'my-sub' }, t('settings.charsPerPage')),
            h('input', {
              className: 'my-num', type: 'number', min: 20, max: 400, step: 4,
              value: snap.settings.charsPerPage,
              onChange: (event) => setSettings({ charsPerPage: Math.max(20, Number(event.currentTarget.value) || 72) }),
            })),
          h('div', { className: 'my-sub' }, t('settings.charsPerPageHint'))),

        h('div', { className: 'my-card' },
          h('h3', null, t('settings.shortcuts')),
          h('div', { className: 'my-kbd' },
            h('div', null, h('code', null, 'Cmd/Ctrl + ↑'), '  ', t('shortcut.prevPage')),
            h('div', null, h('code', null, 'Cmd/Ctrl + ↓'), '  ', t('shortcut.nextPage')),
            h('div', null, h('code', null, 'Cmd/Ctrl + ←'), '  ', t('shortcut.prevChapter')),
            h('div', null, h('code', null, 'Cmd/Ctrl + →'), '  ', t('shortcut.nextChapter')),
            h('div', null, h('code', null, 'Cmd/Ctrl + ;'), '  ', t('shortcut.jump')),
            h('div', null, h('code', null, 'Cmd/Ctrl + L'), '  ', t('shortcut.toc')),
            h('div', null, h('code', null, 'Cmd/Ctrl + Shift + M'), '  ', t('shortcut.boss')))),

        h(OnlineSourcesCard, { snap, t }));
    }

    // ------------------------------------------------------------------
    // plugin
    // ------------------------------------------------------------------

    return {
      name: 'moyu',
      inject: ['slots', 'locale'],
      apply(ctx) {
        let shortcuts;

        const t = ctx.locale.bind(NS);

        const api = {
          toggleReading() {
            const snap = store.get();
            store.set({ active: !snap.active, jumpOpen: false });
          },
          startReading(bookId) {
            openBook(bookId);
            store.set({ active: true });
          },
          boss() {
            store.set({ active: false, jumpOpen: false });
          },
          jump() { store.set({ jumpOpen: true, tocOpen: false }); },
          openToc() { store.set({ tocOpen: true, jumpOpen: false }); },
          closeToc() { store.set({ tocOpen: false }); },
          nextPage() { bus.nextPage(); },
          prevPage() { bus.prevPage(); },
          nextChapter() { bus.nextChapter(); },
          prevChapter() { bus.prevChapter(); },
          importBook,
          removeBook,
          openBook,
          setSettings,
          parseSourceWithAi(url, keyword, options) {
            return parseSourceWithAi(url, keyword, options);
          },
          addSource(text) {
            const parsed = JSON.parse(text);
            const source = normalizeSource(parsed);
            const snap = store.get();
            const sources = [source, ...snap.settings.sources.filter((entry) => entry.id !== source.id)];
            setSettings({ sources });
            return source;
          },
          removeSource(id) {
            setSettings({ sources: store.get().settings.sources.filter((entry) => entry.id !== id) });
          },
          async searchSource(sourceId, keyword) {
            const source = store.get().settings.sources.find((entry) => entry.id === sourceId);
            if (source === undefined) throw new Error('书源不存在');
            return searchSource(source, keyword);
          },
          async addOnlineBook(sourceId, result) {
            const source = store.get().settings.sources.find((entry) => entry.id === sourceId);
            if (source === undefined) throw new Error('书源不存在');
            const toc = await fetchToc(source, result.bookUrl);
            if (toc.chapters.length === 0) throw new Error('目录为空');
            addOnlineBookToShelf(source, result, toc);
          },
        };

        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH));
        ctx.effect(() => ctx.locale.register(NS, 'en', EN));
        ctx.effect(() => ctx.provide('moyu', api));

        ctx.inject(['sidebarRightTabs'], (scope) => {
          // Older layouts restored this tab; close it once instead of leaving an empty pane.
          scope.effect(() => scope.sidebarRightTabs.register({
            id: 'moyu-reader',
            kind: 'moyu-reader',
            title: () => t('tab.title'),
          }), 'moyu: legacy tab type');
          scope.effect(() => scope.slots.inject('sidebar.right.pane.tab', () => scope.slots.register({
            name: 'sidebar.right.pane.tab',
            key: 'moyu-reader',
          }, StaleReaderTab)), 'moyu: legacy tab body');
        });

        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'moyu.status',
          order: 1,
          locale: NS,
        }, (props) => h(StatusBar, Object.assign({}, props, { api, locale: ctx.locale }))));

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'moyu.entry',
          order: -3,
        }, (props) => h(EntryButton, Object.assign({}, props, { api, locale: ctx.locale }))));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'moyu',
          order: 55,
          label: () => t('settings.nav'),
          locale: NS,
        }, (props) => h(SettingsSection, Object.assign({}, props, { api, locale: ctx.locale }))));


        // Guaranteed fallback: when the shortcut registry rejects a binding (native
        // menu ownership, overlap) the command stays unbound, so listen on the page
        // as well. The service consumes handled events with preventDefault, and this
        // listener skips those.
        ctx.effect(() => {
          const onKeyDown = (event) => {
            if (event.defaultPrevented || event.isComposing) return;
            const primary = event.metaKey || event.ctrlKey;
            if (!primary) return;
            if (event.shiftKey && !event.altKey && event.code === 'KeyM') {
              event.preventDefault();
              api.boss();
              return;
            }
            if (event.altKey || event.shiftKey) return;
            if (!store.get().active) return;
            if (event.code === 'ArrowUp') { event.preventDefault(); api.prevPage(); }
            else if (event.code === 'ArrowDown') { event.preventDefault(); api.nextPage(); }
            else if (event.code === 'ArrowLeft') { event.preventDefault(); api.prevChapter(); }
            else if (event.code === 'ArrowRight') { event.preventDefault(); api.nextChapter(); }
            else if (event.code === 'Semicolon') { event.preventDefault(); api.jump(); }
            else if (event.code === 'KeyL') { event.preventDefault(); api.openToc(); }
          };
          window.addEventListener('keydown', onKeyDown);
          return () => window.removeEventListener('keydown', onKeyDown);
        }, 'moyu: keyboard fallback');

        ctx.inject(['shortcuts'], (scope) => {
          scope.effect(() => {
            shortcuts = scope.shortcuts;
            return () => { shortcuts = undefined; };
          });
          const register = (command) => {
            try {
              return scope.shortcuts.register(command);
            } catch (error) {
              console.warn('[moyu] shortcut binding rejected, registering unbound', command.id, error);
              try { return scope.shortcuts.register(Object.assign({}, command, { defaults: {} })); } catch { return undefined; }
            }
          };
          const common = { regions: ['page', 'editable', 'terminal'], modals: [] };
          const arrows = {
            nextPage: { code: 'ArrowDown', modifiers: ['primary'] },
            prevPage: { code: 'ArrowUp', modifiers: ['primary'] },
            nextChapter: { code: 'ArrowRight', modifiers: ['primary'] },
            prevChapter: { code: 'ArrowLeft', modifiers: ['primary'] },
          };
          const profileDefaults = (binding) => ({
            'desktop:macos': binding,
            'web:macos': binding,
            'desktop:windows': { code: binding.code, modifiers: ['control'] },
            'web:windows': { code: binding.code, modifiers: ['control'] },
            'desktop:linux': { code: binding.code, modifiers: ['control'] },
            'web:linux': { code: binding.code, modifiers: ['control'] },
          });

          scope.effect(() => register(Object.assign({
            id: 'moyu.nextPage',
            label: () => t('shortcut.nextPage'),
            aliases: ['next page', 'moyu next'],
            defaults: profileDefaults(arrows.nextPage),
            resolve: () => ({ status: 'handled', run: () => api.nextPage() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.prevPage',
            label: () => t('shortcut.prevPage'),
            aliases: ['previous page', 'moyu previous'],
            defaults: profileDefaults(arrows.prevPage),
            resolve: () => ({ status: 'handled', run: () => api.prevPage() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.nextChapter',
            label: () => t('shortcut.nextChapter'),
            aliases: ['next chapter'],
            defaults: profileDefaults(arrows.nextChapter),
            resolve: () => ({ status: 'handled', run: () => api.nextChapter() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.prevChapter',
            label: () => t('shortcut.prevChapter'),
            aliases: ['previous chapter'],
            defaults: profileDefaults(arrows.prevChapter),
            resolve: () => ({ status: 'handled', run: () => api.prevChapter() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.jump',
            label: () => t('shortcut.jump'),
            aliases: ['jump page', 'jump chapter'],
            defaults: profileDefaults({ code: 'Semicolon', modifiers: ['primary'] }),
            resolve: () => ({ status: 'handled', run: () => api.jump() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.toc',
            label: () => t('shortcut.toc'),
            aliases: ['chapter list', 'contents'],
            defaults: profileDefaults({ code: 'KeyL', modifiers: ['primary'] }),
            resolve: () => ({ status: 'handled', run: () => api.openToc() }),
          }, common)));
          scope.effect(() => register(Object.assign({
            id: 'moyu.boss',
            label: () => t('shortcut.boss'),
            aliases: ['boss key', 'hide reader'],
            defaults: {
              'desktop:macos': { code: 'KeyM', modifiers: ['primary', 'shift'] },
              'web:macos': { code: 'KeyM', modifiers: ['primary', 'shift'] },
              'desktop:windows': { code: 'KeyM', modifiers: ['control', 'shift'] },
              'web:windows': { code: 'KeyM', modifiers: ['control', 'shift'] },
              'desktop:linux': { code: 'KeyM', modifiers: ['control', 'shift'] },
              'web:linux': { code: 'KeyM', modifiers: ['control', 'shift'] },
            },
            resolve: () => ({ status: 'handled', run: () => api.boss() }),
          }, common)));
        });
      },
    };
  },
});
