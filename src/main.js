import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { registerHypeLang } from './language/tokens.js'
import { registerCompletions, registerHover, BUILTIN_DOCS, KEYWORD_SNIPPETS, OPERATORS_DOCS } from './language/completions.js'
import { HYPELANG_THEME } from './language/theme.js'
import { GUIDE_SECTIONS } from './guide.js'

// ── Monaco worker ────────────────────────────────────────────
self.MonacoEnvironment = { getWorker: () => new editorWorker() }

// ── State ────────────────────────────────────────────────────
const files = new Map()   // name → { model, unsaved }
let activeFile = null
let editor     = null
let lang       = localStorage.getItem('hl-lang') || 'en'

// ── i18n strings ─────────────────────────────────────────────
const I18N = {
  en: {
    welcome:        'Welcome to HypeLang IDE',
    welcomeSub:     'Open a file or start a new one',
    newFile:        'New File',
    openFile:       'Open File',
    dropHint:       'Drop .hypelang / .hype / .hpl here',
    docsTitle:      'Reference',
    searchPlaceholder: 'Search functions…',
    noFiles:        'No open files',
    sectionFn:      'Built-in Functions',
    sectionKw:      'Keywords',
    sectionOp:      'Operators',
    unsavedWarning: (n) => `"${n}" has unsaved changes. Close anyway?`,
    saved:          (n) => `Saved ${n}`,
    opened:         (n) => `Opened ${n}`,
    onlyHype:       'Only .hypelang, .hype, .hpl files are supported',
    saveAsPrompt:   'Save as:',
    newFilePrompt:  'File name:',
  },
  ru: {
    welcome:        'Добро пожаловать в HypeLang IDE',
    welcomeSub:     'Откройте файл или создайте новый',
    newFile:        'Новый файл',
    openFile:       'Открыть файл',
    dropHint:       'Перетащите .hypelang / .hype / .hpl сюда',
    docsTitle:      'Справочник',
    searchPlaceholder: 'Поиск функций…',
    noFiles:        'Нет открытых файлов',
    sectionFn:      'Встроенные функции',
    sectionKw:      'Ключевые слова',
    sectionOp:      'Операторы',
    unsavedWarning: (n) => `"${n}" имеет несохранённые изменения. Всё равно закрыть?`,
    saved:          (n) => `Сохранено: ${n}`,
    opened:         (n) => `Открыто: ${n}`,
    onlyHype:       'Поддерживаются только файлы .hypelang, .hype, .hpl',
    saveAsPrompt:   'Сохранить как:',
    newFilePrompt:  'Имя файла:',
  }
}
const t = (key, ...args) => {
  const v = I18N[lang][key]
  return typeof v === 'function' ? v(...args) : v
}

// ── Example snippets ─────────────────────────────────────────
const EXAMPLES = [
  {
    name: 'hello.hypelang',
    label: { en: 'Hello World',      ru: 'Hello World' },
    icon: '👋',
    desc:  { en: 'First program',    ru: 'Первая программа' },
    code:
`-- Hello World in HypeLang
flow greet name {
    "Hello, " + name + "!"
}

flow main {
    let msg = greet "World"
    print msg
}
`
  },
  {
    name: 'factorial.hypelang',
    label: { en: 'Factorial',        ru: 'Факториал' },
    icon: '🔢',
    desc:  { en: 'Recursive + match', ru: 'Рекурсия + match' },
    code:
`-- Recursive factorial using pattern matching
flow fact n {
    match n {
        0 -> 1;
        _ -> n * fact (n - 1);
    }
}

flow main {
    print fact 0    -- 1
    print fact 5    -- 120
    print fact 10   -- 3628800
}
`
  },
  {
    name: 'lists.hypelang',
    label: { en: 'List Operations',  ru: 'Списки' },
    icon: '📋',
    desc:  { en: 'map, reduce, head', ru: 'map, reduce, head' },
    code:
`-- List operations demo
flow double x { x * 2 }
flow add a b  { a + b  }

flow main {
    let nums = [1, 2, 3, 4, 5]

    print "Doubled:"
    print map(double, nums)

    print "Sum:"
    print reduce(add, nums)

    print "Head / Tail:"
    print head(nums)
    print tail(nums)

    print "Push 6:"
    print push(nums, 6)
}
`
  },
  {
    name: 'lazy.hypelang',
    label: { en: 'Lazy Evaluation',  ru: 'Ленивые вычисления' },
    icon: '💤',
    desc:  { en: 'lazy / force',     ru: 'lazy / force' },
    code:
`-- Lazy evaluation demo
flow cube x { x * x * x }

flow main {
    let deferred = lazy (cube 42)
    print "Lazy value created (not computed yet)"

    let result = force deferred
    print "Forced result:"
    print result
}
`
  },
  {
    name: 'charts.hypelang',
    label: { en: 'Charts',           ru: 'Графики' },
    icon: '📊',
    desc:  { en: 'plot, bar, scatter', ru: 'plot, bar, scatter' },
    code:
`-- Charting demo — opens in browser
flow square x { x * x }

flow main {
    let xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let ys = map(square, xs)

    -- Line chart
    plot(ys, "Squares 1-10")

    -- XY line chart
    plotXY(xs, ys, "Y = X²")

    -- Bar chart
    barChart(["Jan","Feb","Mar","Apr"], [42, 75, 58, 91], "Monthly")

    -- Scatter
    scatter([1,3,2,5,4], [10,30,20,50,40], "Points")
}
`
  },
  {
    name: 'loops.hypelang',
    label: { en: 'Loops',            ru: 'Циклы' },
    icon: '🔄',
    desc:  { en: 'while, for, when', ru: 'while, for, when' },
    code:
`-- Loops and conditionals
flow main {
    -- for-in loop
    let nums = [1, 2, 3, 4, 5]
    let total = 0
    for nums use n {
        total += n
    }
    print "Sum:"
    print total

    -- while with counter
    let i = 0
    while i < 5 {
        print i
        i++
    }

    -- when/else
    let x = 7
    when x > 5 {
        print "big"
    } else {
        print "small"
    }
}
`
  }
]

// ── Toast ────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = `show ${type}`
  clearTimeout(el._t)
  el._t = setTimeout(() => { el.className = '' }, 2200)
}

// ── File management ──────────────────────────────────────────
function newFile(name, code = '') {
  if (files.has(name)) { activateFile(name); return }
  const model = monaco.editor.createModel(code, 'hypelang')
  files.set(name, { model, unsaved: false })
  model.onDidChangeContent(() => markUnsaved(name))
  activateFile(name)
  renderTabs()
  renderFileTree()
}

function activateFile(name) {
  if (!files.has(name)) return
  activeFile = name
  editor.setModel(files.get(name).model)
  editor.focus()
  hidePlaceholder()
  renderTabs()
  renderFileTree()
  updateStatusFile(name)
}

function closeFile(name) {
  if (!files.has(name)) return
  const { model, unsaved } = files.get(name)
  if (unsaved && !confirm(t('unsavedWarning', name))) return
  model.dispose()
  files.delete(name)
  if (activeFile === name) {
    const rest = [...files.keys()]
    if (rest.length) activateFile(rest[rest.length - 1])
    else {
      activeFile = null
      editor.setModel(monaco.editor.createModel('', 'hypelang'))
      showPlaceholder()
      updateStatusFile(t('noFiles'))
    }
  }
  renderTabs()
  renderFileTree()
}

function markUnsaved(name) {
  const f = files.get(name)
  if (f && !f.unsaved) { f.unsaved = true; renderTabs() }
}

function saveFile() {
  if (!activeFile) return
  const f = files.get(activeFile)
  if (!f) return
  const blob = new Blob([f.model.getValue()], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = activeFile
  a.click()
  URL.revokeObjectURL(a.href)
  f.unsaved = false
  renderTabs()
  toast(t('saved', activeFile), 'success')
}

function saveFileAs() {
  if (!activeFile) return
  const ext  = activeFile.split('.').pop()
  const base = activeFile.replace(/\.[^.]+$/, '')
  const name = prompt(t('saveAsPrompt'), `${base}_copy.${ext}`)
  if (!name) return
  const f = files.get(activeFile)
  const blob = new Blob([f.model.getValue()], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
  toast(t('saved', name), 'success')
}

function promptNewFile() {
  const name = prompt(t('newFilePrompt'), 'untitled.hypelang')
  if (!name) return
  const ext = name.split('.').pop().toLowerCase()
  const finalName = ['hypelang','hype','hpl'].includes(ext) ? name : name + '.hypelang'
  newFile(finalName, `-- ${finalName}\n\nflow main {\n    \n}\n`)
}

function openFileDialog() {
  document.getElementById('file-input').click()
}

function loadFiles(fileList) {
  const valid = [...fileList].filter(f => /\.(hypelang|hype|hpl)$/i.test(f.name))
  if (!valid.length) { toast(t('onlyHype'), 'error'); return }
  valid.forEach(file => {
    const reader = new FileReader()
    reader.onload = ev => { newFile(file.name, ev.target.result); toast(t('opened', file.name), 'success') }
    reader.readAsText(file)
  })
}

// ── Placeholder ──────────────────────────────────────────────
function showPlaceholder() { document.getElementById('editor-placeholder').classList.remove('hidden') }
function hidePlaceholder() { document.getElementById('editor-placeholder').classList.add('hidden') }

// ── Render tabs ──────────────────────────────────────────────
function renderTabs() {
  const container = document.getElementById('tabs')
  container.innerHTML = ''
  for (const [name, f] of files) {
    const tab = document.createElement('div')
    tab.className = 'tab' + (name === activeFile ? ' active' : '') + (f.unsaved ? ' unsaved' : '')
    tab.innerHTML = `
      <span class="tab-dot"></span>
      <span>${escHtml(name)}</span>
      <button class="tab-close" title="Close">×</button>`
    tab.addEventListener('click', e => { if (!e.target.closest('.tab-close')) activateFile(name) })
    tab.querySelector('.tab-close').addEventListener('click', e => { e.stopPropagation(); closeFile(name) })
    container.appendChild(tab)
  }
}

// ── Render file tree ─────────────────────────────────────────
function renderFileTree() {
  const tree = document.getElementById('file-tree')
  tree.innerHTML = ''
  if (!files.size) {
    tree.innerHTML = `<div style="padding:12px;color:var(--text-3);font-size:11px;text-align:center">${t('noFiles')}</div>`
    return
  }
  for (const [name] of files) {
    const ext  = name.split('.').pop()
    const item = document.createElement('div')
    item.className = 'tree-item' + (name === activeFile ? ' active' : '')
    item.innerHTML = `${fileIcon()}<span>${escHtml(name)}</span><span class="ext-badge">.${ext}</span>`
    item.addEventListener('click', () => activateFile(name))
    tree.appendChild(item)
  }
}

function fileIcon() {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" width="14" height="14">
    <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z"/>
    <polyline points="9,1 9,6 14,6"/>
  </svg>`
}

// ── Docs panel ───────────────────────────────────────────────
function buildDocs() {
  const scroll = document.getElementById('docs-scroll')
  scroll.innerHTML = ''

  document.getElementById('docs-title').textContent = t('docsTitle')
  const searchInput = document.getElementById('docs-search')
  searchInput.placeholder = t('searchPlaceholder')

  function section(title) {
    const d = document.createElement('div')
    d.className = 'docs-section-title'
    d.textContent = title
    scroll.appendChild(d)
  }

  function item(kind, name, sig, brief, desc) {
    const d = document.createElement('div')
    d.className = 'doc-item'
    d.dataset.search = (name + ' ' + brief).toLowerCase()
    d.innerHTML = `
      <div class="doc-item-head">
        <span class="doc-kind ${kind}">${kind === 'fn' ? 'fn' : kind === 'kw' ? 'kw' : '◆'}</span>
        <span class="doc-item-name">${escHtml(name)}</span>
        <span class="doc-item-brief">${escHtml(brief)}</span>
        <span class="doc-chevron">›</span>
      </div>
      <div class="doc-item-body">
        <div class="doc-sig">${escHtml(sig)}</div>
        <div class="doc-desc">${mdToHtml(desc)}</div>
      </div>`
    d.querySelector('.doc-item-head').addEventListener('click', () => d.classList.toggle('open'))
    scroll.appendChild(d)
  }

  section(t('sectionFn'))
  for (const b of BUILTIN_DOCS)
    item('fn', b.name, b.signature, b.detail[lang], b.doc[lang])

  section(t('sectionKw'))
  for (const k of KEYWORD_SNIPPETS)
    item('kw', k.label, k.label, k.detail[lang], k.doc[lang])

  section(t('sectionOp'))
  for (const o of OPERATORS_DOCS)
    item('snip', o.op, o.sig, o.detail[lang], o.detail[lang])
}

function filterDocs(q) {
  q = q.toLowerCase()
  document.querySelectorAll('.doc-item').forEach(el => {
    el.style.display = !q || el.dataset.search.includes(q) ? '' : 'none'
  })
  document.querySelectorAll('.docs-section-title').forEach(el => {
    const sib = el.nextElementSibling
    el.style.display = (sib && sib.style.display === 'none') ? 'none' : ''
  })
}

// ── Welcome screen ────────────────────────────────────────────
function buildWelcomeGrid() {
  const grid = document.getElementById('welcome-grid')
  grid.innerHTML = ''
  for (const ex of EXAMPLES) {
    const card = document.createElement('div')
    card.className = 'welcome-card'
    card.innerHTML = `
      <div class="welcome-card-icon">${ex.icon}</div>
      <div class="welcome-card-title">${ex.label[lang]}</div>
      <div class="welcome-card-sub">${ex.desc[lang]}</div>`
    card.addEventListener('click', () => newFile(ex.name, ex.code))
    grid.appendChild(card)
  }

  document.querySelector('.placeholder-title').textContent   = t('welcome')
  document.querySelector('.placeholder-sub').textContent     = t('welcomeSub')
  document.getElementById('btn-welcome-new').textContent     = t('newFile')
  document.getElementById('btn-welcome-open').textContent    = t('openFile')
  document.getElementById('drop-hint').querySelector('span').textContent = t('dropHint')
}

function buildExamples() {
  const list = document.getElementById('examples-list')
  list.innerHTML = ''
  for (const ex of EXAMPLES) {
    const item = document.createElement('div')
    item.className = 'example-item'
    item.innerHTML = `${fileIcon()}<span>${ex.label[lang]}</span>`
    item.addEventListener('click', () => newFile(ex.name, ex.code))
    list.appendChild(item)
  }
}

// ── Language switch ───────────────────────────────────────────
function setLang(newLang) {
  lang = newLang
  localStorage.setItem('hl-lang', lang)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang)
  })
  buildDocs()
  buildWelcomeGrid()
  buildExamples()
  renderFileTree()
  if (guideOpen) renderGuide()
}

// ── Status updates ────────────────────────────────────────────
function updateStatusFile(name) { document.getElementById('status-file').textContent = name }
function updateStatusPos(pos)   { document.getElementById('status-pos').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}` }

// ── Guide ─────────────────────────────────────────────────────
let guideOpen        = false
let guideActiveSec   = GUIDE_SECTIONS[0].id

function openGuide(sectionId) {
  guideOpen = true
  document.getElementById('guide-overlay').classList.remove('hidden')
  document.getElementById('btn-open-guide').classList.add('active')
  renderGuide(sectionId || guideActiveSec)
  // sync lang buttons inside guide
  document.getElementById('guide-lang-en').classList.toggle('active', lang === 'en')
  document.getElementById('guide-lang-ru').classList.toggle('active', lang === 'ru')
}

function closeGuide() {
  guideOpen = false
  document.getElementById('guide-overlay').classList.add('hidden')
  document.getElementById('btn-open-guide').classList.remove('active')
}

function renderGuide(sectionId) {
  if (sectionId) guideActiveSec = sectionId

  // Build nav
  const navList = document.getElementById('guide-nav-list')
  navList.innerHTML = ''
  GUIDE_SECTIONS.forEach((sec, idx) => {
    const item = document.createElement('div')
    item.className = 'guide-nav-item' + (sec.id === guideActiveSec ? ' active' : '')
    item.innerHTML = `
      <span class="guide-nav-icon">${sec.icon}</span>
      <span class="guide-nav-label">${escHtml(sec.title[lang])}</span>
      <span class="guide-nav-num">${idx + 1}</span>`
    item.addEventListener('click', () => renderGuide(sec.id))
    navList.appendChild(item)
  })

  // Build content
  const sec = GUIDE_SECTIONS.find(s => s.id === guideActiveSec) || GUIDE_SECTIONS[0]
  const inner = document.getElementById('guide-content-inner')
  inner.innerHTML = sec.content[lang]()
  document.getElementById('guide-content').scrollTop = 0
}

// ── Panels ────────────────────────────────────────────────────
let docsOpen    = false
let sidebarOpen = true

function toggleDocs() {
  docsOpen = !docsOpen
  document.getElementById('docs-panel').classList.toggle('hidden', !docsOpen)
  document.getElementById('main').classList.toggle('docs-open', docsOpen)
  document.getElementById('btn-toggle-docs').classList.toggle('active', docsOpen)
  editor.layout()
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen
  document.getElementById('main').classList.toggle('sidebar-closed', !sidebarOpen)
  document.getElementById('btn-toggle-sidebar').classList.toggle('active', !sidebarOpen)
  editor.layout()
}

// ── Drag & Drop ───────────────────────────────────────────────
function setupDragDrop() {
  const wrap = document.querySelector('.editor-wrap')

  wrap.addEventListener('dragover', e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    wrap.classList.add('drag-over')
  })
  wrap.addEventListener('dragleave', e => {
    if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('drag-over')
  })
  wrap.addEventListener('drop', e => {
    e.preventDefault()
    wrap.classList.remove('drag-over')
    loadFiles(e.dataTransfer.files)
  })

  // Prevent browser from navigating on accidental drops elsewhere
  document.addEventListener('dragover',  e => e.preventDefault())
  document.addEventListener('drop',      e => e.preventDefault())
}

// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function mdToHtml(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  registerHypeLang(monaco)
  monaco.editor.defineTheme('hypelang-dark', HYPELANG_THEME)

  editor = monaco.editor.create(document.getElementById('monaco-editor'), {
    theme:    'hypelang-dark',
    language: 'hypelang',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontLigatures:  true,
    lineNumbers:    'on',
    minimap:        { enabled: true },
    scrollBeyondLastLine: false,
    automaticLayout:  true,
    tabSize:          4,
    insertSpaces:     true,
    wordWrap:         'off',
    bracketPairColorization: { enabled: true },
    smoothScrolling:  true,
    cursorSmoothCaretAnimation: 'on',
    renderWhitespace: 'selection',
    quickSuggestions: { other: true, comments: false, strings: false },
    parameterHints:   { enabled: true },
    padding:          { top: 16, bottom: 16 },
  })

  registerCompletions(monaco)
  registerHover(monaco)

  editor.onDidChangeCursorPosition(e => updateStatusPos(e.position))
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveFile)
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, promptNewFile)

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); openFileDialog() }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); promptNewFile() }
  })

  // Buttons
  document.getElementById('btn-new').addEventListener('click', promptNewFile)
  document.getElementById('btn-new-file').addEventListener('click', promptNewFile)
  document.getElementById('btn-open').addEventListener('click', openFileDialog)
  document.getElementById('btn-save').addEventListener('click', saveFile)
  document.getElementById('btn-save-as').addEventListener('click', saveFileAs)
  document.getElementById('btn-welcome-new').addEventListener('click', promptNewFile)
  document.getElementById('btn-welcome-open').addEventListener('click', openFileDialog)
  document.getElementById('btn-toggle-docs').addEventListener('click', toggleDocs)
  document.getElementById('btn-toggle-sidebar').addEventListener('click', toggleSidebar)
  document.getElementById('btn-close-docs').addEventListener('click', toggleDocs)

  // Guide
  document.getElementById('btn-open-guide').addEventListener('click', () => openGuide())
  document.getElementById('btn-close-guide').addEventListener('click', closeGuide)
  document.getElementById('guide-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('guide-overlay')) closeGuide()
  })
  document.getElementById('guide-lang-en').addEventListener('click', () => {
    setLang('en')
    document.getElementById('guide-lang-en').classList.add('active')
    document.getElementById('guide-lang-ru').classList.remove('active')
    if (guideOpen) renderGuide()
  })
  document.getElementById('guide-lang-ru').addEventListener('click', () => {
    setLang('ru')
    document.getElementById('guide-lang-ru').classList.add('active')
    document.getElementById('guide-lang-en').classList.remove('active')
    if (guideOpen) renderGuide()
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && guideOpen) closeGuide()
  })

  // File input
  document.getElementById('file-input').addEventListener('change', e => {
    loadFiles(e.target.files)
    e.target.value = ''
  })

  // Docs search
  document.getElementById('docs-search').addEventListener('input', e => filterDocs(e.target.value))

  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang))
    btn.classList.toggle('active', btn.dataset.lang === lang)
  })

  // Drag & drop
  setupDragDrop()

  // Build UI
  buildDocs()
  buildWelcomeGrid()
  buildExamples()
  renderTabs()
  renderFileTree()

  window.addEventListener('resize', () => editor.layout())
}

init()
