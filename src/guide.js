// HypeLang — full in-IDE documentation guide

// ── Syntax highlighter for guide code blocks ──────────────────
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function hlCode(raw) {
  const KW = new Set(['flow','let','when','else','while','for','use','match','print','lazy','force','true','false'])
  const FN = new Set(['len','head','tail','push','map','reduce','readFile','writeFile','plot','plotXY','barChart','scatter'])
  const out = []
  const code = raw.replace(/^\n/, '')   // trim leading newline from template literals
  let i = 0

  while (i < code.length) {
    const ch = code[i]

    if (ch === '\n') { out.push('\n'); i++; continue }

    // comment: -- or //
    if ((ch === '-' && code[i+1] === '-') || (ch === '/' && code[i+1] === '/')) {
      let j = i
      while (j < code.length && code[j] !== '\n') j++
      out.push(`<span class="hl-cm">${esc(code.slice(i, j))}</span>`)
      i = j; continue
    }

    // string
    if (ch === '"') {
      let j = i + 1
      while (j < code.length && code[j] !== '"' && code[j] !== '\n') {
        if (code[j] === '\\') j++
        j++
      }
      if (j < code.length && code[j] === '"') j++
      out.push(`<span class="hl-str">${esc(code.slice(i, j))}</span>`)
      i = j; continue
    }

    // number (not preceded by word char)
    if (/\d/.test(ch) && (i === 0 || !/\w/.test(code[i-1]))) {
      let j = i
      while (j < code.length && /\d/.test(code[j])) j++
      out.push(`<span class="hl-num">${code.slice(i, j)}</span>`)
      i = j; continue
    }

    // identifier / keyword / builtin
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i
      while (j < code.length && /\w/.test(code[j])) j++
      const w = code.slice(i, j)
      if (KW.has(w))      out.push(`<span class="hl-kw">${w}</span>`)
      else if (FN.has(w)) out.push(`<span class="hl-fn">${w}</span>`)
      else                out.push(esc(w))
      i = j; continue
    }

    // multi-char operators
    const mop = ['->','++','+=','==','!=','<=','>='].find(o => code.startsWith(o, i))
    if (mop) {
      out.push(`<span class="hl-op">${esc(mop)}</span>`)
      i += mop.length; continue
    }

    // single-char operators
    if ('+-*/<>=!'.includes(ch)) {
      out.push(`<span class="hl-op">${esc(ch)}</span>`)
      i++; continue
    }

    out.push(esc(ch)); i++
  }
  return out.join('')
}

// ── HTML micro-helpers ─────────────────────────────────────────
const H2   = t => `<h2 class="g-h2">${t}</h2>`
const H3   = t => `<h3 class="g-h3">${t}</h3>`
const P    = t => `<p class="g-p">${t}</p>`
const UL   = items => `<ul class="g-ul">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
const CODE = (src, lbl = '') =>
  `<div class="g-code-wrap">${lbl ? `<div class="g-code-lbl">${lbl}</div>` : ''}<pre class="g-code">${hlCode(src)}</pre></div>`
const NOTE = t => `<div class="g-callout note"><span class="g-ci">ℹ</span><div>${t}</div></div>`
const TIP  = t => `<div class="g-callout tip"><span class="g-ci">💡</span><div>${t}</div></div>`
const WARN = t => `<div class="g-callout warn"><span class="g-ci">⚠</span><div>${t}</div></div>`
const KBD  = k => `<kbd class="g-kbd">${k}</kbd>`
const MONO = t => `<code class="g-inline">${t}</code>`

function TABLE(heads, rows) {
  const ths = heads.map(h => `<th>${h}</th>`).join('')
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
  return `<table class="g-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
}

// ══════════════════════════════════════════════════════════════
// SECTION CONTENT
// ══════════════════════════════════════════════════════════════

// ── 1. Introduction ───────────────────────────────────────────
const intro = {
  en: () => `
${H2('Introduction to HypeLang')}
${P('HypeLang is a small, expressive functional programming language. It is dynamically typed, expression-based, and supports first-class functions, pattern matching, and lazy evaluation. Programs are run by the interpreter written in F#.')}
${H3('How to run a program')}
${P(`From the terminal, run any ${MONO('.hypelang')} file with:`)}
${CODE(`dotnet run --project src/HypeLang/HypeLang.fsproj -- myfile.hypelang`, 'Terminal')}
${P('Every program needs a special entry-point function called ' + MONO('main') + '. Execution always starts there.')}
${H3('Your first program')}
${CODE(`
flow main {
    print "Hello, World!"
}
`, 'hello.hypelang')}
${NOTE('Every HypeLang program must have a <code class="g-inline">flow main</code> function. If it is missing the interpreter will report an error.')}
${H3('Comments')}
${P('You can write single-line comments with ' + MONO('--') + ' or ' + MONO('//'))}
${CODE(`
-- This is a comment
// This is also a comment
flow main {
    print "code"   -- inline comment
}
`)}
${H3('Running in the IDE')}
${P('The web IDE is for writing and editing files only. To execute code, save the file and run it with the terminal command above, or use the VS Code extension which adds a ' + KBD('Ctrl+F5') + ' shortcut.')}
`,

  ru: () => `
${H2('Введение в HypeLang')}
${P('HypeLang — небольшой выразительный функциональный язык программирования. Он динамически типизирован, основан на выражениях и поддерживает функции первого класса, сопоставление с образцом и ленивые вычисления. Программы запускаются интерпретатором, написанным на F#.')}
${H3('Как запустить программу')}
${P(`Из терминала запустите любой файл ${MONO('.hypelang')} командой:`)}
${CODE(`dotnet run --project src/HypeLang/HypeLang.fsproj -- myfile.hypelang`, 'Терминал')}
${P('Каждой программе нужна специальная точка входа — функция ' + MONO('main') + '. Выполнение всегда начинается с неё.')}
${H3('Первая программа')}
${CODE(`
flow main {
    print "Привет, мир!"
}
`, 'hello.hypelang')}
${NOTE('Каждая программа на HypeLang должна содержать функцию <code class="g-inline">flow main</code>. Если она отсутствует, интерпретатор выдаст ошибку.')}
${H3('Комментарии')}
${P('Однострочные комментарии пишутся через ' + MONO('--') + ' или ' + MONO('//'))}
${CODE(`
-- Это комментарий
// Это тоже комментарий
flow main {
    print "код"   -- комментарий в строке
}
`)}
${H3('Запуск в IDE')}
${P('Веб-IDE предназначена только для написания и редактирования файлов. Для запуска кода сохраните файл и выполните команду в терминале выше, или используйте расширение VS Code, которое добавляет сочетание клавиш ' + KBD('Ctrl+F5') + '.')}
`
}

// ── 2. Variables & Types ──────────────────────────────────────
const variables = {
  en: () => `
${H2('Variables & Types')}
${P('Variables in HypeLang are created with the ' + MONO('let') + ' keyword. They are immutable bindings by default — once bound, a name refers to the same value for the rest of its scope. (Mutable assignment is possible with ' + MONO('->') + ' and ' + MONO('+=') + ' — see the Operators section.)')}
${H3('let — binding a value')}
${CODE(`
flow main {
    let x = 42
    let name = "Alice"
    let flag = true
    let nums = [1, 2, 3, 4, 5]

    print x
    print name
    print flag
    print nums
}
`)}
${H3('Types at a glance')}
${TABLE(
  ['Type', 'Examples', 'Description'],
  [
    ['Integer', MONO('0  42  -7'), 'Whole numbers'],
    ['Boolean', MONO('true  false'), 'Logical values'],
    ['String',  MONO('"hello"  "Hi!"'), 'Text, enclosed in double quotes'],
    ['List',    MONO('[1, 2, 3]  ["a", "b"]'), 'Ordered sequences of any values'],
  ]
)}
${H3('String operations')}
${P('Strings can be concatenated with ' + MONO('+') + ':')}
${CODE(`
flow main {
    let first = "Hello"
    let second = "World"
    print first + ", " + second + "!"
}
`)}
${NOTE('HypeLang does not have a built-in number-to-string conversion. Use print directly on numbers.')}
${H3('print')}
${P(MONO('print') + ' outputs any value — integers, booleans, strings, and lists all work:')}
${CODE(`
flow main {
    print 100
    print true
    print "text"
    print [1, 2, 3]
}
`)}
${TIP('You can print expressions directly without binding them to a variable: <code class="g-inline">print 2 + 2</code>')}
`,

  ru: () => `
${H2('Переменные и типы')}
${P('Переменные в HypeLang создаются ключевым словом ' + MONO('let') + '. По умолчанию это неизменяемые привязки — после создания имя всегда ссылается на одно и то же значение в своей области видимости. (Изменяемое присваивание возможно через ' + MONO('->') + ' и ' + MONO('+=') + ' — см. раздел об операторах.)')}
${H3('let — привязка значения')}
${CODE(`
flow main {
    let x = 42
    let name = "Алиса"
    let flag = true
    let nums = [1, 2, 3, 4, 5]

    print x
    print name
    print flag
    print nums
}
`)}
${H3('Типы данных')}
${TABLE(
  ['Тип', 'Примеры', 'Описание'],
  [
    ['Integer (целое)', MONO('0  42  -7'), 'Целые числа'],
    ['Boolean (логический)', MONO('true  false'), 'Логические значения'],
    ['String (строка)',  MONO('"hello"  "Привет"'), 'Текст в двойных кавычках'],
    ['List (список)',    MONO('[1, 2, 3]  ["a", "b"]'), 'Упорядоченные последовательности любых значений'],
  ]
)}
${H3('Работа со строками')}
${P('Строки объединяются оператором ' + MONO('+') + ':')}
${CODE(`
flow main {
    let first = "Привет"
    let second = "Мир"
    print first + ", " + second + "!"
}
`)}
${NOTE('В HypeLang нет встроенного преобразования числа в строку. Используйте print для чисел напрямую.')}
${H3('print')}
${P(MONO('print') + ' выводит любое значение — целые числа, булевые значения, строки и списки:')}
${CODE(`
flow main {
    print 100
    print true
    print "текст"
    print [1, 2, 3]
}
`)}
${TIP('Можно выводить выражения без привязки к переменной: <code class="g-inline">print 2 + 2</code>')}
`
}

// ── 3. Functions ──────────────────────────────────────────────
const functions = {
  en: () => `
${H2('Functions')}
${P('Functions are defined with the ' + MONO('flow') + ' keyword. They are the primary building block in HypeLang. The value of the last expression in the function body is automatically returned.')}
${H3('Basic definition')}
${CODE(`
-- No arguments
flow greet {
    "Hello!"
}

-- One argument
flow double x {
    x * 2
}

-- Two arguments
flow add a b {
    a + b
}

flow main {
    print greet
    print double 5        -- 10
    print add 3 4         -- 7
}
`)}
${H3('Calling functions')}
${P('In HypeLang, functions are called by writing the function name followed by arguments separated by spaces (no parentheses needed for top-level calls):')}
${CODE(`
flow square x { x * x }

flow main {
    let result = square 7     -- 49
    print result

    -- Parentheses needed for nested calls
    print square (square 3)   -- 81
}
`)}
${NOTE('Use parentheses around a call when it is used as an argument to another call: <code class="g-inline">square (add 1 2)</code>')}
${H3('Multi-expression body')}
${P('A function body can contain multiple statements. Only the last expression is returned. Use ' + MONO('let') + ' for intermediate values:')}
${CODE(`
flow hypotenuse a b {
    let aa = a * a
    let bb = b * b
    let sum = aa + bb
    -- "sum" is the return value (last expression)
    sum
}

flow main {
    print hypotenuse 3 4    -- 25  (3²+4² = 25, no sqrt in HypeLang)
}
`)}
${H3('Functions calling other functions')}
${CODE(`
flow square x { x * x }
flow cube   x { x * square x }
flow power4 x { square (square x) }

flow main {
    print square 4    -- 16
    print cube 3      -- 27
    print power4 2    -- 16
}
`)}
${TIP('Define all helper functions <em>before</em> the function that calls them. The order of <code class="g-inline">flow</code> definitions in the file matters.')}
${H3('Functions as values')}
${P('Functions can be passed to other functions as arguments. This is what makes HypeLang a functional language:')}
${CODE(`
flow apply f x { f x }
flow double x  { x * 2 }

flow main {
    print apply double 5    -- 10
}
`)}
`,

  ru: () => `
${H2('Функции')}
${P('Функции определяются ключевым словом ' + MONO('flow') + '. Они являются основным строительным блоком HypeLang. Значение последнего выражения в теле функции автоматически возвращается.')}
${H3('Базовое определение')}
${CODE(`
-- Без аргументов
flow greet {
    "Привет!"
}

-- Один аргумент
flow double x {
    x * 2
}

-- Два аргумента
flow add a b {
    a + b
}

flow main {
    print greet
    print double 5        -- 10
    print add 3 4         -- 7
}
`)}
${H3('Вызов функций')}
${P('В HypeLang функции вызываются именем с аргументами через пробел (скобки для верхнего уровня не нужны):')}
${CODE(`
flow square x { x * x }

flow main {
    let result = square 7     -- 49
    print result

    -- Скобки нужны при вложенных вызовах
    print square (square 3)   -- 81
}
`)}
${NOTE('Используйте скобки вокруг вызова, когда он передаётся аргументом другой функции: <code class="g-inline">square (add 1 2)</code>')}
${H3('Тело с несколькими выражениями')}
${P('Тело функции может содержать несколько операторов. Возвращается только последнее выражение. Для промежуточных значений используйте ' + MONO('let') + ':')}
${CODE(`
flow hypotenuse a b {
    let aa = a * a
    let bb = b * b
    let sum = aa + bb
    -- "sum" — возвращаемое значение (последнее выражение)
    sum
}

flow main {
    print hypotenuse 3 4    -- 25  (3²+4² = 25)
}
`)}
${H3('Функции вызывают другие функции')}
${CODE(`
flow square x { x * x }
flow cube   x { x * square x }
flow power4 x { square (square x) }

flow main {
    print square 4    -- 16
    print cube 3      -- 27
    print power4 2    -- 16
}
`)}
${TIP('Определяйте вспомогательные функции <em>до</em> тех, которые их вызывают. Порядок определений <code class="g-inline">flow</code> в файле имеет значение.')}
${H3('Функции как значения')}
${P('Функции можно передавать другим функциям как аргументы. Именно это делает HypeLang функциональным языком:')}
${CODE(`
flow apply f x { f x }
flow double x  { x * 2 }

flow main {
    print apply double 5    -- 10
}
`)}
`
}

// ── 4. Conditionals ───────────────────────────────────────────
const conditionals = {
  en: () => `
${H2('Conditionals')}
${P('HypeLang uses the ' + MONO('when') + ' keyword for conditional branching, with an optional ' + MONO('else') + ' block.')}
${H3('when / else')}
${CODE(`
flow main {
    let x = 10

    when x > 5 {
        print "x is greater than 5"
    } else {
        print "x is 5 or less"
    }
}
`)}
${H3('when without else')}
${CODE(`
flow main {
    let score = 85

    when score >= 90 {
        print "Excellent!"
    }

    when score >= 60 {
        print "Passed"
    }
}
`)}
${H3('Nested conditions')}
${CODE(`
flow classify n {
    when n < 0 {
        print "negative"
    } else {
        when n == 0 {
            print "zero"
        } else {
            print "positive"
        }
    }
}

flow main {
    classify -3
    classify 0
    classify 7
}
`)}
${H3('Conditions in expressions')}
${P('The result of ' + MONO('when') + ' can be used as a value (the last expression inside the taken branch):')}
${CODE(`
flow abs x {
    when x < 0 {
        x * -1
    } else {
        x
    }
}

flow main {
    print abs -5     -- 5
    print abs 3      -- 3
}
`)}
${H3('Comparison operators')}
${TABLE(
  ['Operator', 'Meaning', 'Example'],
  [
    ['==', 'Equal to',             'x == 5'],
    ['!=', 'Not equal to',         'x != 0'],
    ['<',  'Less than',            'a < b'],
    ['>',  'Greater than',         'a > b'],
    ['<=', 'Less than or equal',   'n <= 10'],
    ['>=', 'Greater than or equal','score >= 90'],
  ]
)}
`,

  ru: () => `
${H2('Условия')}
${P('В HypeLang используется ключевое слово ' + MONO('when') + ' для условного ветвления, с необязательным блоком ' + MONO('else') + '.')}
${H3('when / else')}
${CODE(`
flow main {
    let x = 10

    when x > 5 {
        print "x больше 5"
    } else {
        print "x равен 5 или меньше"
    }
}
`)}
${H3('when без else')}
${CODE(`
flow main {
    let score = 85

    when score >= 90 {
        print "Отлично!"
    }

    when score >= 60 {
        print "Зачёт"
    }
}
`)}
${H3('Вложенные условия')}
${CODE(`
flow classify n {
    when n < 0 {
        print "отрицательное"
    } else {
        when n == 0 {
            print "ноль"
        } else {
            print "положительное"
        }
    }
}

flow main {
    classify -3
    classify 0
    classify 7
}
`)}
${H3('Условие как выражение')}
${P(MONO('when') + ' возвращает значение (последнее выражение в выполненной ветви):')}
${CODE(`
flow abs x {
    when x < 0 {
        x * -1
    } else {
        x
    }
}

flow main {
    print abs -5     -- 5
    print abs 3      -- 3
}
`)}
${H3('Операторы сравнения')}
${TABLE(
  ['Оператор', 'Значение', 'Пример'],
  [
    ['==', 'Равно',                  'x == 5'],
    ['!=', 'Не равно',               'x != 0'],
    ['<',  'Меньше',                 'a < b'],
    ['>',  'Больше',                 'a > b'],
    ['<=', 'Меньше или равно',       'n <= 10'],
    ['>=', 'Больше или равно',       'score >= 90'],
  ]
)}
`
}

// ── 5. Pattern Matching ───────────────────────────────────────
const patternMatching = {
  en: () => `
${H2('Pattern Matching')}
${P(MONO('match') + ' is a powerful alternative to nested ' + MONO('when') + ' chains. It tests a value against a series of patterns and evaluates the first matching branch.')}
${H3('Basic syntax')}
${CODE(`
match <expression> {
    <pattern> -> <result>;
    <pattern> -> <result>;
    _ -> <default>;
}
`)}
${H3('Matching literals')}
${CODE(`
flow dayName n {
    match n {
        1 -> "Monday";
        2 -> "Tuesday";
        3 -> "Wednesday";
        4 -> "Thursday";
        5 -> "Friday";
        6 -> "Saturday";
        7 -> "Sunday";
        _ -> "Unknown";
    }
}

flow main {
    print dayName 3    -- Wednesday
    print dayName 6    -- Saturday
    print dayName 9    -- Unknown
}
`)}
${H3('Wildcard pattern _')}
${P('The wildcard ' + MONO('_') + ' matches anything and is used as a catch-all default branch. It must always be the last pattern.')}
${CODE(`
flow describe x {
    match x {
        0 -> "zero";
        1 -> "one";
        _ -> "something else";
    }
}
`)}
${H3('Pattern matching in recursion')}
${P('Pattern matching shines when combined with recursion — the base case is a literal pattern, the recursive case uses a variable or wildcard:')}
${CODE(`
-- Factorial: 0! = 1,  n! = n * (n-1)!
flow fact n {
    match n {
        0 -> 1;
        _ -> n * fact (n - 1);
    }
}

-- Fibonacci: fib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2)
flow fib n {
    match n {
        0 -> 0;
        1 -> 1;
        _ -> fib (n - 1) + fib (n - 2);
    }
}

flow main {
    print fact 5     -- 120
    print fib 8      -- 21
}
`)}
${H3('Matching booleans')}
${CODE(`
flow boolStr b {
    match b {
        true  -> "yes";
        false -> "no";
    }
}

flow main {
    print boolStr true    -- yes
    print boolStr false   -- no
}
`)}
${WARN('Every <code class="g-inline">match</code> branch must end with a semicolon <code class="g-inline">;</code>')}
`,

  ru: () => `
${H2('Сопоставление с образцом')}
${P(MONO('match') + ' — мощная альтернатива цепочкам вложенных ' + MONO('when') + '. Он проверяет значение по набору образцов и вычисляет первую подходящую ветвь.')}
${H3('Базовый синтаксис')}
${CODE(`
match <выражение> {
    <образец> -> <результат>;
    <образец> -> <результат>;
    _ -> <по умолчанию>;
}
`)}
${H3('Совпадение с литералами')}
${CODE(`
flow dayName n {
    match n {
        1 -> "Понедельник";
        2 -> "Вторник";
        3 -> "Среда";
        4 -> "Четверг";
        5 -> "Пятница";
        6 -> "Суббота";
        7 -> "Воскресенье";
        _ -> "Неизвестно";
    }
}

flow main {
    print dayName 3    -- Среда
    print dayName 6    -- Суббота
    print dayName 9    -- Неизвестно
}
`)}
${H3('Шаблон подстановки _')}
${P('Шаблон ' + MONO('_') + ' совпадает с чем угодно и используется как ветвь по умолчанию. Он всегда должен быть последним.')}
${CODE(`
flow describe x {
    match x {
        0 -> "ноль";
        1 -> "один";
        _ -> "что-то ещё";
    }
}
`)}
${H3('Сопоставление в рекурсии')}
${P('Сопоставление с образцом особенно хорошо в рекурсии — базовый случай задаётся литеральным образцом, рекурсивный использует подстановку:')}
${CODE(`
-- Факториал: 0! = 1,  n! = n * (n-1)!
flow fact n {
    match n {
        0 -> 1;
        _ -> n * fact (n - 1);
    }
}

-- Числа Фибоначчи: fib(0)=0, fib(1)=1, fib(n)=fib(n-1)+fib(n-2)
flow fib n {
    match n {
        0 -> 0;
        1 -> 1;
        _ -> fib (n - 1) + fib (n - 2);
    }
}

flow main {
    print fact 5     -- 120
    print fib 8      -- 21
}
`)}
${H3('Совпадение с булевыми значениями')}
${CODE(`
flow boolStr b {
    match b {
        true  -> "да";
        false -> "нет";
    }
}

flow main {
    print boolStr true    -- да
    print boolStr false   -- нет
}
`)}
${WARN('Каждая ветвь <code class="g-inline">match</code> должна заканчиваться точкой с запятой <code class="g-inline">;</code>')}
`
}

// ── 6. Loops ──────────────────────────────────────────────────
const loops = {
  en: () => `
${H2('Loops')}
${P('HypeLang has two loop constructs: ' + MONO('while') + ' for condition-based repetition and ' + MONO('for...use') + ' for iterating over lists.')}
${H3('while loop')}
${P('Repeats the body as long as the condition is true:')}
${CODE(`
flow main {
    let i = 0
    while i < 5 {
        print i
        i++
    }
    -- prints 0, 1, 2, 3, 4
}
`)}
${H3('for...use loop')}
${P('Iterates over every element in a list:')}
${CODE(`
flow main {
    let fruits = ["apple", "banana", "cherry"]
    for fruits use f {
        print f
    }
    -- prints apple, banana, cherry
}
`)}
${H3('Accumulating values in a loop')}
${CODE(`
flow main {
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let sum = 0
    for numbers use n {
        sum += n
    }
    print "Sum:"
    print sum      -- 55
}
`)}
${H3('Mutable variables')}
${P('Inside loops you often need to update a variable. HypeLang provides:')}
${TABLE(
  ['Syntax', 'Meaning', 'Example'],
  [
    [MONO('x++'),    'Increment x by 1',  MONO('i++')],
    [MONO('x += n'), 'Add n to x',        MONO('sum += n')],
    [MONO('expr -> x'), 'Assign expr to x', MONO('x * 2 -> x')],
  ]
)}
${H3('while with a flag')}
${CODE(`
flow main {
    let found = false
    let i = 0
    let target = 7
    let data = [3, 1, 7, 4, 9]

    while i < len(data) {
        when data == target {
            found = true
        }
        i++
    }

    when found {
        print "Found!"
    } else {
        print "Not found"
    }
}
`)}
${H3('Nested loops')}
${CODE(`
flow main {
    let rows = [1, 2, 3]
    let cols = [10, 20, 30]
    for rows use r {
        for cols use c {
            print r + c
        }
    }
}
`)}
${TIP('Prefer <code class="g-inline">for...use</code> over <code class="g-inline">while</code> whenever you iterate over a list — it is cleaner and less error-prone.')}
`,

  ru: () => `
${H2('Циклы')}
${P('В HypeLang есть два вида циклов: ' + MONO('while') + ' для повторения по условию и ' + MONO('for...use') + ' для перебора списков.')}
${H3('Цикл while')}
${P('Повторяет тело, пока условие истинно:')}
${CODE(`
flow main {
    let i = 0
    while i < 5 {
        print i
        i++
    }
    -- выводит 0, 1, 2, 3, 4
}
`)}
${H3('Цикл for...use')}
${P('Перебирает каждый элемент списка:')}
${CODE(`
flow main {
    let fruits = ["яблоко", "банан", "вишня"]
    for fruits use f {
        print f
    }
    -- выводит яблоко, банан, вишня
}
`)}
${H3('Накопление значений в цикле')}
${CODE(`
flow main {
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let sum = 0
    for numbers use n {
        sum += n
    }
    print "Сумма:"
    print sum      -- 55
}
`)}
${H3('Изменяемые переменные')}
${P('Внутри циклов часто нужно обновлять переменную. HypeLang предоставляет:')}
${TABLE(
  ['Синтаксис', 'Смысл', 'Пример'],
  [
    [MONO('x++'),    'Увеличить x на 1',  MONO('i++')],
    [MONO('x += n'), 'Прибавить n к x',   MONO('sum += n')],
    [MONO('expr -> x'), 'Присвоить expr к x', MONO('x * 2 -> x')],
  ]
)}
${H3('Вложенные циклы')}
${CODE(`
flow main {
    let rows = [1, 2, 3]
    let cols = [10, 20, 30]
    for rows use r {
        for cols use c {
            print r + c
        }
    }
}
`)}
${TIP('Используйте <code class="g-inline">for...use</code> вместо <code class="g-inline">while</code>, когда перебираете список — это чище и надёжнее.')}
`
}

// ── 7. Lists ──────────────────────────────────────────────────
const lists = {
  en: () => `
${H2('Lists')}
${P('Lists are the core data structure of HypeLang. They hold an ordered sequence of values. Elements can be of any type, even mixed.')}
${H3('Creating lists')}
${CODE(`
flow main {
    let empty   = []
    let nums    = [1, 2, 3, 4, 5]
    let strs    = ["cat", "dog", "bird"]
    let mixed   = [1, "two", true, 42]
    let nested  = [[1, 2], [3, 4], [5, 6]]

    print nums
    print len(nums)    -- 5
}
`)}
${H3('len — length')}
${CODE(`
let n = len([10, 20, 30])   -- 3
let s = len("hello")        -- 5
`)}
${H3('head — first element')}
${CODE(`
head([10, 20, 30])    -- 10
head(["a", "b"])      -- "a"
`)}
${WARN('Calling <code class="g-inline">head</code> or <code class="g-inline">tail</code> on an empty list causes an error.')}
${H3('tail — all but the first')}
${CODE(`
tail([10, 20, 30])    -- [20, 30]
tail(["a", "b", "c"]) -- ["b", "c"]
`)}
${H3('push — append to end')}
${CODE(`
push([1, 2], 3)       -- [1, 2, 3]
push([], 42)          -- [42]
`)}
${NOTE('<code class="g-inline">push</code> does not modify the original list. It returns a new list.')}
${H3('map — transform each element')}
${P(MONO('map(fn, list)') + ' applies ' + MONO('fn') + ' to every element and returns a new list:')}
${CODE(`
flow double x { x * 2 }
flow square x { x * x }

flow main {
    let nums = [1, 2, 3, 4, 5]
    print map(double, nums)   -- [2, 4, 6, 8, 10]
    print map(square, nums)   -- [1, 4, 9, 16, 25]
}
`)}
${H3('reduce — fold to a single value')}
${P(MONO('reduce(fn, list)') + ' accumulates elements using a two-argument function. The first element is the initial accumulator:')}
${CODE(`
flow add a b { a + b }
flow mul a b { a * b }
flow max a b { when a > b { a } else { b } }

flow main {
    let nums = [1, 2, 3, 4, 5]
    print reduce(add, nums)    -- 15  (sum)
    print reduce(mul, nums)    -- 120 (product)
    print reduce(max, nums)    -- 5   (maximum)
}
`)}
${H3('Building a list in a loop')}
${CODE(`
flow main {
    let result = []
    let i = 1
    while i <= 5 {
        result = push(result, i * i)
        i++
    }
    print result    -- [1, 4, 9, 16, 25]
}
`)}
${H3('Recursive list processing')}
${CODE(`
-- Sum all elements recursively
flow sumList xs {
    when len(xs) == 0 {
        0
    } else {
        head(xs) + sumList(tail(xs))
    }
}

flow main {
    print sumList [3, 1, 4, 1, 5, 9]    -- 23
}
`)}
`,

  ru: () => `
${H2('Списки')}
${P('Списки — основная структура данных HypeLang. Они хранят упорядоченные последовательности значений. Элементы могут быть любого типа, в том числе смешанного.')}
${H3('Создание списков')}
${CODE(`
flow main {
    let empty   = []
    let nums    = [1, 2, 3, 4, 5]
    let strs    = ["кот", "пёс", "птица"]
    let mixed   = [1, "два", true, 42]
    let nested  = [[1, 2], [3, 4], [5, 6]]

    print nums
    print len(nums)    -- 5
}
`)}
${H3('len — длина')}
${CODE(`
let n = len([10, 20, 30])   -- 3
let s = len("hello")        -- 5
`)}
${H3('head — первый элемент')}
${CODE(`
head([10, 20, 30])    -- 10
head(["a", "b"])      -- "a"
`)}
${WARN('Вызов <code class="g-inline">head</code> или <code class="g-inline">tail</code> на пустом списке вызывает ошибку.')}
${H3('tail — все кроме первого')}
${CODE(`
tail([10, 20, 30])    -- [20, 30]
tail(["a", "b", "c"]) -- ["b", "c"]
`)}
${H3('push — добавить в конец')}
${CODE(`
push([1, 2], 3)       -- [1, 2, 3]
push([], 42)          -- [42]
`)}
${NOTE('<code class="g-inline">push</code> не изменяет исходный список — он возвращает новый.')}
${H3('map — преобразовать каждый элемент')}
${P(MONO('map(fn, list)') + ' применяет ' + MONO('fn') + ' к каждому элементу и возвращает новый список:')}
${CODE(`
flow double x { x * 2 }
flow square x { x * x }

flow main {
    let nums = [1, 2, 3, 4, 5]
    print map(double, nums)   -- [2, 4, 6, 8, 10]
    print map(square, nums)   -- [1, 4, 9, 16, 25]
}
`)}
${H3('reduce — свернуть в одно значение')}
${P(MONO('reduce(fn, list)') + ' накапливает элементы с помощью двухаргументной функции. Первый элемент становится начальным аккумулятором:')}
${CODE(`
flow add a b { a + b }
flow mul a b { a * b }
flow max a b { when a > b { a } else { b } }

flow main {
    let nums = [1, 2, 3, 4, 5]
    print reduce(add, nums)    -- 15  (сумма)
    print reduce(mul, nums)    -- 120 (произведение)
    print reduce(max, nums)    -- 5   (максимум)
}
`)}
${H3('Построение списка в цикле')}
${CODE(`
flow main {
    let result = []
    let i = 1
    while i <= 5 {
        result = push(result, i * i)
        i++
    }
    print result    -- [1, 4, 9, 16, 25]
}
`)}
${H3('Рекурсивная обработка списков')}
${CODE(`
-- Сумма элементов рекурсивно
flow sumList xs {
    when len(xs) == 0 {
        0
    } else {
        head(xs) + sumList(tail(xs))
    }
}

flow main {
    print sumList [3, 1, 4, 1, 5, 9]    -- 23
}
`)}
`
}

// ── 8. Recursion ──────────────────────────────────────────────
const recursion = {
  en: () => `
${H2('Recursion')}
${P('In a functional language, recursion takes the place of loops for many algorithms. A recursive function calls itself with a smaller input until it reaches a base case.')}
${H3('Anatomy of a recursive function')}
${CODE(`
flow fact n {
    -- BASE CASE: stop here
    match n {
        0 -> 1;
        -- RECURSIVE CASE: reduce n and call again
        _ -> n * fact (n - 1);
    }
}
`)}
${NOTE('Always define at least one base case — without it, recursion runs forever and the program will crash.')}
${H3('Fibonacci sequence')}
${CODE(`
flow fib n {
    match n {
        0 -> 0;
        1 -> 1;
        _ -> fib (n - 1) + fib (n - 2);
    }
}

flow main {
    let i = 0
    while i <= 10 {
        print fib i
        i++
    }
}
`)}
${H3('Power function')}
${CODE(`
flow power base exp {
    match exp {
        0 -> 1;
        _ -> base * power base (exp - 1);
    }
}

flow main {
    print power 2 10    -- 1024
    print power 3 5     -- 243
}
`)}
${H3('Recursive list operations')}
${CODE(`
-- Reverse a list
flow rev xs {
    when len(xs) == 0 {
        []
    } else {
        push(rev(tail(xs)), head(xs))
    }
}

-- Count elements matching a predicate
flow countIf pred xs {
    when len(xs) == 0 {
        0
    } else {
        let rest = countIf pred (tail(xs))
        when pred (head(xs)) {
            rest + 1
        } else {
            rest
        }
    }
}

flow isEven n { n == n / 2 * 2 }

flow main {
    print rev [1, 2, 3, 4, 5]             -- [5, 4, 3, 2, 1]
    print countIf isEven [1,2,3,4,5,6]    -- 3
}
`)}
${H3('Tail recursion pattern')}
${P('For large inputs, use an accumulator parameter to make the recursion tail-recursive (avoids deep call stacks):')}
${CODE(`
-- fact with accumulator (more efficient for large n)
flow factAcc n acc {
    match n {
        0 -> acc;
        _ -> factAcc (n - 1) (n * acc);
    }
}
flow fact n { factAcc n 1 }

flow main {
    print fact 10    -- 3628800
}
`)}
`,

  ru: () => `
${H2('Рекурсия')}
${P('В функциональном языке рекурсия заменяет циклы во многих алгоритмах. Рекурсивная функция вызывает саму себя с меньшим аргументом, пока не достигнет базового случая.')}
${H3('Строение рекурсивной функции')}
${CODE(`
flow fact n {
    -- БАЗОВЫЙ СЛУЧАЙ: здесь останавливаемся
    match n {
        0 -> 1;
        -- РЕКУРСИВНЫЙ СЛУЧАЙ: уменьшаем n и вызываем снова
        _ -> n * fact (n - 1);
    }
}
`)}
${NOTE('Всегда определяйте хотя бы один базовый случай — без него рекурсия будет выполняться бесконечно и программа упадёт.')}
${H3('Числа Фибоначчи')}
${CODE(`
flow fib n {
    match n {
        0 -> 0;
        1 -> 1;
        _ -> fib (n - 1) + fib (n - 2);
    }
}

flow main {
    let i = 0
    while i <= 10 {
        print fib i
        i++
    }
}
`)}
${H3('Функция возведения в степень')}
${CODE(`
flow power base exp {
    match exp {
        0 -> 1;
        _ -> base * power base (exp - 1);
    }
}

flow main {
    print power 2 10    -- 1024
    print power 3 5     -- 243
}
`)}
${H3('Рекурсивная обработка списков')}
${CODE(`
-- Разворот списка
flow rev xs {
    when len(xs) == 0 {
        []
    } else {
        push(rev(tail(xs)), head(xs))
    }
}

-- Подсчёт элементов по предикату
flow countIf pred xs {
    when len(xs) == 0 {
        0
    } else {
        let rest = countIf pred (tail(xs))
        when pred (head(xs)) {
            rest + 1
        } else {
            rest
        }
    }
}

flow isEven n { n == n / 2 * 2 }

flow main {
    print rev [1, 2, 3, 4, 5]             -- [5, 4, 3, 2, 1]
    print countIf isEven [1,2,3,4,5,6]    -- 3
}
`)}
${H3('Хвостовая рекурсия с аккумулятором')}
${P('Для больших входных данных используйте параметр-аккумулятор, чтобы избежать глубокой цепочки вызовов:')}
${CODE(`
-- факториал с аккумулятором
flow factAcc n acc {
    match n {
        0 -> acc;
        _ -> factAcc (n - 1) (n * acc);
    }
}
flow fact n { factAcc n 1 }

flow main {
    print fact 10    -- 3628800
}
`)}
`
}

// ── 9. Higher-Order Functions ─────────────────────────────────
const higherOrder = {
  en: () => `
${H2('Higher-Order Functions')}
${P('A higher-order function (HOF) is one that takes other functions as arguments or returns a function. This is one of the most powerful patterns in functional programming.')}
${H3('Passing functions as arguments')}
${CODE(`
flow apply  f x     { f x }
flow applyN f x n   { f x }   -- simplified example

flow triple x { x * 3 }
flow neg    x { x * -1 }

flow main {
    print apply triple 7     -- 21
    print apply neg    5     -- -5
}
`)}
${H3('map and reduce revisited')}
${P(MONO('map') + ' and ' + MONO('reduce') + ' are built-in higher-order functions. They take your custom function and apply it across a list:')}
${CODE(`
flow isPositive x { x > 0 }
flow clamp100   x { when x > 100 { 100 } else { x } }

flow main {
    let data = [150, 30, -5, 200, 42]
    print map(clamp100, data)      -- [100, 30, -5, 100, 42]
}
`)}
${H3('Writing your own HOF')}
${CODE(`
-- Apply a function n times
flow repeat f x n {
    match n {
        0 -> x;
        _ -> repeat f (f x) (n - 1);
    }
}

flow addOne x { x + 1 }
flow double x { x * 2 }

flow main {
    print repeat addOne 0 5     -- 5   (0+1+1+1+1+1)
    print repeat double 1 4     -- 16  (1*2*2*2*2)
}
`)}
${H3('Pipeline pattern')}
${P('Chain transformations to build a data processing pipeline:')}
${CODE(`
flow double   x { x * 2 }
flow addTen   x { x + 10 }
flow sub5     x { x - 5 }

flow pipe f g x { g (f x) }

flow main {
    let transform = pipe double addTen    -- first *2 then +10
    print transform 3    -- (3*2)+10 = 16
    print transform 7    -- (7*2)+10 = 24

    -- Longer pipeline
    let nums = [1, 2, 3, 4, 5]
    let result = map(transform, nums)
    print result         -- [12, 14, 16, 18, 20]
}
`)}
${H3('filter using reduce')}
${P('HypeLang has no built-in filter, but you can write one with reduce:')}
${CODE(`
flow filter pred xs {
    -- fold: if pred(x) is true, push x onto accumulator
    flow step acc x {
        when pred x {
            push(acc, x)
        } else {
            acc
        }
    }
    -- manually reduce since inner flows can be tricky
    let result = []
    for xs use x {
        when pred x {
            result = push(result, x)
        }
    }
    result
}

flow isEven n { n == n / 2 * 2 }

flow main {
    print filter isEven [1,2,3,4,5,6,7,8]   -- [2, 4, 6, 8]
}
`)}
`,

  ru: () => `
${H2('Функции высшего порядка')}
${P('Функция высшего порядка (ФВП) — это функция, принимающая другие функции как аргументы или возвращающая функцию. Это один из мощнейших паттернов функционального программирования.')}
${H3('Передача функций как аргументов')}
${CODE(`
flow apply  f x { f x }

flow triple x { x * 3 }
flow neg    x { x * -1 }

flow main {
    print apply triple 7     -- 21
    print apply neg    5     -- -5
}
`)}
${H3('map и reduce — встроенные ФВП')}
${P(MONO('map') + ' и ' + MONO('reduce') + ' — встроенные функции высшего порядка. Они принимают вашу функцию и применяют её к списку:')}
${CODE(`
flow clamp100 x { when x > 100 { 100 } else { x } }

flow main {
    let data = [150, 30, -5, 200, 42]
    print map(clamp100, data)      -- [100, 30, -5, 100, 42]
}
`)}
${H3('Собственные функции высшего порядка')}
${CODE(`
-- Применить функцию n раз
flow repeat f x n {
    match n {
        0 -> x;
        _ -> repeat f (f x) (n - 1);
    }
}

flow addOne x { x + 1 }
flow double x { x * 2 }

flow main {
    print repeat addOne 0 5     -- 5   (0+1+1+1+1+1)
    print repeat double 1 4     -- 16  (1*2*2*2*2)
}
`)}
${H3('Паттерн конвейера')}
${P('Цепочки преобразований для построения конвейера обработки данных:')}
${CODE(`
flow double x { x * 2 }
flow addTen x { x + 10 }
flow pipe f g x { g (f x) }

flow main {
    let transform = pipe double addTen    -- сначала *2, потом +10
    print transform 3    -- (3*2)+10 = 16
    print transform 7    -- (7*2)+10 = 24

    let nums = [1, 2, 3, 4, 5]
    print map(transform, nums)   -- [12, 14, 16, 18, 20]
}
`)}
`
}

// ── 10. Lazy Evaluation ───────────────────────────────────────
const lazyEval = {
  en: () => `
${H2('Lazy Evaluation')}
${P('Normally HypeLang evaluates expressions immediately (eager evaluation). With ' + MONO('lazy') + ', you can defer evaluation until the value is actually needed.')}
${H3('lazy and force')}
${CODE(`
flow expensive x {
    -- Imagine this takes a long time
    x * x * x * x * x
}

flow main {
    -- Create a lazy value — NOT computed yet
    let deferred = lazy (expensive 42)
    print "Lazy value created"

    -- NOW it is computed (once, result is cached)
    let result = force deferred
    print result           -- 130691232

    -- force again — uses cached result, no recomputation
    let same = force deferred
    print same             -- 130691232
}
`)}
${NOTE('A <code class="g-inline">lazy</code> expression is evaluated at most once. The result is cached after the first <code class="g-inline">force</code>.')}
${H3('When to use lazy')}
${UL([
  'Expensive computations that may not be needed at all',
  'Breaking circular dependencies between values',
  'Simulating infinite or very large data structures',
  'Delaying side effects (file I/O, etc.)',
])}
${H3('Lazy in a conditional')}
${CODE(`
flow bigCompute x { x * x * x }

flow main {
    let data = lazy (bigCompute 1000)

    let flag = false
    when flag {
        -- flag is false, so this branch never runs
        -- bigCompute is NEVER called
        print force data
    } else {
        print "Skipped expensive computation"
    }
}
`)}
${H3('Multiple lazy values')}
${CODE(`
flow main {
    let a = lazy (1 + 1)
    let b = lazy (2 + 2)
    let c = lazy (force a + force b)

    print force c    -- 6  (forces a and b as side effects)
}
`)}
`,

  ru: () => `
${H2('Ленивые вычисления')}
${P('Обычно HypeLang вычисляет выражения немедленно (энергичные вычисления). С ключевым словом ' + MONO('lazy') + ' можно отложить вычисление до момента, когда значение действительно потребуется.')}
${H3('lazy и force')}
${CODE(`
flow expensive x {
    -- Представим, что это занимает много времени
    x * x * x * x * x
}

flow main {
    -- Создаём ленивое значение — ЕЩЁ не вычислено
    let deferred = lazy (expensive 42)
    print "Ленивое значение создано"

    -- ТЕПЕРЬ вычисляется (один раз, результат кэшируется)
    let result = force deferred
    print result           -- 130691232

    -- force снова — используется кэш, повторного вычисления нет
    let same = force deferred
    print same             -- 130691232
}
`)}
${NOTE('Выражение <code class="g-inline">lazy</code> вычисляется не более одного раза. Результат кэшируется после первого <code class="g-inline">force</code>.')}
${H3('Когда использовать lazy')}
${UL([
  'Дорогостоящие вычисления, которые могут вообще не понадобиться',
  'Разрыв циклических зависимостей между значениями',
  'Симуляция бесконечных или очень больших структур данных',
  'Откладывание побочных эффектов (файловый ввод-вывод и т.д.)',
])}
${H3('Lazy в условии')}
${CODE(`
flow bigCompute x { x * x * x }

flow main {
    let data = lazy (bigCompute 1000)

    let flag = false
    when flag {
        -- флаг false, эта ветвь никогда не выполняется
        -- bigCompute НИКОГДА не вызывается
        print force data
    } else {
        print "Дорогое вычисление пропущено"
    }
}
`)}
`
}

// ── 11. File I/O ──────────────────────────────────────────────
const fileIO = {
  en: () => `
${H2('File I/O')}
${P('HypeLang can read from and write to files using two built-in functions. Paths are relative to the directory from which you run the interpreter.')}
${H3('readFile')}
${CODE(`readFile(path)  -- returns the full file contents as a string`)}
${CODE(`
flow main {
    let content = readFile("data.txt")
    print content
}
`)}
${H3('writeFile')}
${CODE(`writeFile(path, content)  -- creates or overwrites the file`)}
${CODE(`
flow main {
    writeFile("output.txt", "Hello from HypeLang!")
    print "File written"
}
`)}
${H3('Read, process, write')}
${CODE(`
flow main {
    let text = readFile("input.txt")
    let result = "Processed: " + text
    writeFile("output.txt", result)
    print "Done"
}
`)}
${WARN('File paths are resolved relative to the working directory when you run the interpreter, not relative to the source file.')}
`,

  ru: () => `
${H2('Файловый ввод-вывод')}
${P('HypeLang может читать файлы и записывать в них с помощью двух встроенных функций. Пути задаются относительно директории, из которой запускается интерпретатор.')}
${H3('readFile')}
${CODE(`readFile(путь)  -- возвращает содержимое файла как строку`)}
${CODE(`
flow main {
    let content = readFile("data.txt")
    print content
}
`)}
${H3('writeFile')}
${CODE(`writeFile(путь, содержимое)  -- создаёт или перезаписывает файл`)}
${CODE(`
flow main {
    writeFile("output.txt", "Привет от HypeLang!")
    print "Файл записан"
}
`)}
${H3('Прочитать, обработать, записать')}
${CODE(`
flow main {
    let text = readFile("input.txt")
    let result = "Обработано: " + text
    writeFile("output.txt", result)
    print "Готово"
}
`)}
${WARN('Пути к файлам разрешаются относительно рабочей директории при запуске интерпретатора, а не относительно исходного файла.')}
`
}

// ── 12. Charts ────────────────────────────────────────────────
const charts = {
  en: () => `
${H2('Data Visualization')}
${P('HypeLang has four built-in charting functions. Each generates an HTML/SVG file and automatically opens it in your default browser.')}
${H3('plot — line chart with auto X axis')}
${CODE(`plot(values, title)
-- values: list of numbers
-- title: string label`)}
${CODE(`
flow main {
    plot([1, 4, 9, 16, 25, 36, 49], "Squares")
}
`)}
${H3('plotXY — line chart with custom axes')}
${CODE(`plotXY(xValues, yValues, title)
-- both lists must have the same length`)}
${CODE(`
flow square x { x * x }

flow main {
    let xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let ys = map(square, xs)
    plotXY(xs, ys, "Y = X²")
}
`)}
${H3('barChart — bar / column chart')}
${CODE(`barChart(labels, values, title)
-- labels: list of strings or numbers
-- values: list of numbers (negatives OK)`)}
${CODE(`
flow main {
    barChart(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        [42, 75, 58, 91, 63, 80],
        "Monthly Sales"
    )
}
`)}
${H3('scatter — scatter plot')}
${CODE(`scatter(xValues, yValues, title)`)}
${CODE(`
flow main {
    scatter(
        [1, 3, 2, 5, 4, 6, 3, 7],
        [10, 30, 20, 50, 40, 60, 25, 70],
        "Correlation"
    )
}
`)}
${H3('Complete charting demo')}
${CODE(`
flow square x { x * x }

flow main {
    let xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let ys = map(square, xs)

    -- All four chart types
    plot(ys, "Y values only")
    plotXY(xs, ys, "Y = X²")
    barChart(["A","B","C","D"], [30, 70, 50, 90], "Bars")
    scatter([1,3,2,5,4], [10,30,20,50,40], "Points")
}
`)}
${NOTE('Each chart call opens a new browser tab. Run the program once to generate all charts together.')}
`,

  ru: () => `
${H2('Визуализация данных')}
${P('В HypeLang есть четыре встроенных функции для построения графиков. Каждая создаёт HTML/SVG файл и автоматически открывает его в браузере по умолчанию.')}
${H3('plot — линейный график с автоматической осью X')}
${CODE(`plot(значения, заголовок)
-- значения: список чисел
-- заголовок: строка`)}
${CODE(`
flow main {
    plot([1, 4, 9, 16, 25, 36, 49], "Квадраты")
}
`)}
${H3('plotXY — линейный график с заданными осями')}
${CODE(`plotXY(значенияX, значенияY, заголовок)
-- оба списка должны быть одной длины`)}
${CODE(`
flow square x { x * x }

flow main {
    let xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    let ys = map(square, xs)
    plotXY(xs, ys, "Y = X²")
}
`)}
${H3('barChart — столбчатая диаграмма')}
${CODE(`barChart(метки, значения, заголовок)
-- метки: список строк или чисел
-- значения: список чисел (отрицательные допустимы)`)}
${CODE(`
flow main {
    barChart(
        ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
        [42, 75, 58, 91, 63, 80],
        "Продажи по месяцам"
    )
}
`)}
${H3('scatter — точечная диаграмма')}
${CODE(`scatter(значенияX, значенияY, заголовок)`)}
${CODE(`
flow main {
    scatter(
        [1, 3, 2, 5, 4, 6, 3, 7],
        [10, 30, 20, 50, 40, 60, 25, 70],
        "Корреляция"
    )
}
`)}
${NOTE('Каждый вызов функции графика открывает новую вкладку браузера. Запустите программу один раз, чтобы получить все графики вместе.')}
`
}

// ── 13. Operators ─────────────────────────────────────────────
const operators = {
  en: () => `
${H2('Operators Reference')}
${H3('Arithmetic')}
${TABLE(
  ['Operator', 'Meaning', 'Example', 'Result'],
  [
    [MONO('+'), 'Addition',       MONO('3 + 4'),  MONO('7')],
    [MONO('-'), 'Subtraction',    MONO('10 - 3'), MONO('7')],
    [MONO('*'), 'Multiplication', MONO('3 * 4'),  MONO('12')],
    [MONO('/'), 'Integer division',MONO('10 / 3'),MONO('3')],
  ]
)}
${NOTE('HypeLang uses integer arithmetic. Division truncates toward zero: <code class="g-inline">7 / 2 = 3</code>, not 3.5.')}
${H3('Comparison')}
${TABLE(
  ['Operator', 'Meaning', 'Example'],
  [
    [MONO('=='), 'Equal',               MONO('x == 5')],
    [MONO('!='), 'Not equal',           MONO('x != 0')],
    [MONO('<'),  'Less than',           MONO('a < b')],
    [MONO('>'),  'Greater than',        MONO('a > b')],
    [MONO('<='), 'Less than or equal',  MONO('n <= 10')],
    [MONO('>='), 'Greater than or equal',MONO('score >= 60')],
  ]
)}
${H3('Assignment & mutation')}
${TABLE(
  ['Operator', 'Meaning', 'Example'],
  [
    [MONO('let x = v'),  'Bind v to x (first assignment)', MONO('let count = 0')],
    [MONO('expr -> x'),  'Assign expression result to x',  MONO('x * 2 -> x')],
    [MONO('x++'),        'Increment x by 1',               MONO('i++')],
    [MONO('x += n'),     'Add n to x in place',            MONO('total += price')],
  ]
)}
${H3('String operator')}
${TABLE(
  ['Operator', 'Meaning', 'Example'],
  [
    [MONO('+'), 'String concatenation', MONO('"Hello" + " " + "World"')],
  ]
)}
${H3('Operator precedence (high to low)')}
${TABLE(
  ['Level', 'Operators'],
  [
    ['Highest', MONO('()')],
    ['', MONO('*  /')],
    ['', MONO('+  -')],
    ['Lowest', MONO('==  !=  <  >  <=  >=')],
  ]
)}
${CODE(`
-- Precedence examples
print 2 + 3 * 4      -- 14  (multiplication first)
print (2 + 3) * 4    -- 20  (parentheses override)
print 10 - 2 - 3     -- 5   (left-to-right)
`)}
`,

  ru: () => `
${H2('Справочник операторов')}
${H3('Арифметика')}
${TABLE(
  ['Оператор', 'Значение', 'Пример', 'Результат'],
  [
    [MONO('+'), 'Сложение',      MONO('3 + 4'),  MONO('7')],
    [MONO('-'), 'Вычитание',     MONO('10 - 3'), MONO('7')],
    [MONO('*'), 'Умножение',     MONO('3 * 4'),  MONO('12')],
    [MONO('/'), 'Целочисленное деление', MONO('10 / 3'), MONO('3')],
  ]
)}
${NOTE('HypeLang использует целочисленную арифметику. Деление округляется к нулю: <code class="g-inline">7 / 2 = 3</code>, а не 3.5.')}
${H3('Сравнение')}
${TABLE(
  ['Оператор', 'Значение', 'Пример'],
  [
    [MONO('=='), 'Равно',                    MONO('x == 5')],
    [MONO('!='), 'Не равно',                 MONO('x != 0')],
    [MONO('<'),  'Меньше',                   MONO('a < b')],
    [MONO('>'),  'Больше',                   MONO('a > b')],
    [MONO('<='), 'Меньше или равно',         MONO('n <= 10')],
    [MONO('>='), 'Больше или равно',         MONO('score >= 60')],
  ]
)}
${H3('Присваивание и мутация')}
${TABLE(
  ['Оператор', 'Значение', 'Пример'],
  [
    [MONO('let x = v'),  'Привязать v к x (первое создание)', MONO('let count = 0')],
    [MONO('expr -> x'),  'Присвоить результат выражения к x', MONO('x * 2 -> x')],
    [MONO('x++'),        'Увеличить x на 1',                   MONO('i++')],
    [MONO('x += n'),     'Прибавить n к x',                    MONO('total += price')],
  ]
)}
${H3('Приоритет операторов (от высокого к низкому)')}
${TABLE(
  ['Уровень', 'Операторы'],
  [
    ['Высший', MONO('()')],
    ['', MONO('*  /')],
    ['', MONO('+  -')],
    ['Низший', MONO('==  !=  <  >  <=  >=')],
  ]
)}
${CODE(`
-- Примеры приоритета
print 2 + 3 * 4      -- 14  (умножение первым)
print (2 + 3) * 4    -- 20  (скобки переопределяют)
print 10 - 2 - 3     -- 5   (слева направо)
`)}
`
}

// ── 14. Advanced Patterns ─────────────────────────────────────
const advanced = {
  en: () => `
${H2('Advanced Patterns')}
${P('This section covers more complex programs that combine the features you have learned.')}
${H3('Bubble sort')}
${CODE(`
-- Swap two elements in a list (by rebuilding it)
flow swap xs i j {
    let result = []
    let k = 0
    for xs use x {
        when k == i {
            result = push(result, xs)   -- put element j here
        }
        k++
    }
    result
}

-- Simpler: bubblesort via for-loops and comparisons
flow bubblePass xs {
    let result = xs
    let i = 0
    while i < len(result) - 1 {
        let a = head(tail(result))   -- simplified example
        i++
    }
    result
}

-- Practical sort using reduce and list building
flow insertSorted x sorted {
    when len(sorted) == 0 {
        [x]
    } else {
        when x <= head(sorted) {
            push([], x)   -- prepend (simplified)
        } else {
            push(sorted, x)
        }
    }
}
`, 'sorting.hypelang')}
${H3('Statistics pipeline')}
${CODE(`
flow add  a b { a + b }
flow mul  a b { a * b }
flow sq   x   { x * x }

flow mean xs {
    reduce(add, xs) / len(xs)
}

flow sumSquares xs {
    let m = mean xs
    let diffs = map(sq, xs)    -- simplified: squares not deviations
    reduce(add, diffs)
}

flow main {
    let data = [4, 7, 13, 2, 1, 9, 6, 3, 8, 5]

    print "Data:"
    print data

    print "Sum:"
    print reduce(add, data)

    print "Mean:"
    print mean data

    print "Max (via reduce):"
    flow maxFn a b { when a > b { a } else { b } }
    print reduce(maxFn, data)
}
`, 'statistics.hypelang')}
${H3('Generating sequences')}
${CODE(`
-- Generate [from, from+1, ..., to]
flow range from to {
    when from > to {
        []
    } else {
        push(range from (to - 1), to)
    }
}

-- Wait — push appends to end. Let's use a loop instead:
flow rangeLoop from to {
    let result = []
    let i = from
    while i <= to {
        result = push(result, i)
        i++
    }
    result
}

flow main {
    let r = rangeLoop 1 10
    print r                              -- [1,2,...,10]
    print map(square, r)                 -- [1,4,9,...,100]
    print reduce(add, r)                 -- 55
}
`, 'sequences.hypelang')}
${H3('Closure-based counter')}
${P('Functions capture their surrounding scope, forming closures:')}
${CODE(`
flow makeAdder n {
    -- returns a function that adds n to its argument
    flow adder x { x + n }
    adder
}

flow main {
    let add5  = makeAdder 5
    let add10 = makeAdder 10

    print add5 3     -- 8
    print add10 3    -- 13
    print add5 (add10 2)   -- 17
}
`)}
`,

  ru: () => `
${H2('Продвинутые паттерны')}
${P('В этом разделе рассматриваются более сложные программы, объединяющие изученные возможности языка.')}
${H3('Генерация последовательностей')}
${CODE(`
-- Генерация [from, from+1, ..., to]
flow rangeLoop from to {
    let result = []
    let i = from
    while i <= to {
        result = push(result, i)
        i++
    }
    result
}

flow square x { x * x }
flow add    a b { a + b }

flow main {
    let r = rangeLoop 1 10
    print r                    -- [1,2,...,10]
    print map(square, r)       -- [1,4,9,...,100]
    print reduce(add, r)       -- 55
}
`, 'sequences.hypelang')}
${H3('Статистический конвейер')}
${CODE(`
flow add a b { a + b }

flow mean xs {
    reduce(add, xs) / len(xs)
}

flow main {
    let data = [4, 7, 13, 2, 1, 9, 6, 3, 8, 5]

    print "Данные:"
    print data

    print "Сумма:"
    print reduce(add, data)

    print "Среднее:"
    print mean data

    flow maxFn a b { when a > b { a } else { b } }
    print "Максимум:"
    print reduce(maxFn, data)

    -- Визуализация
    barChart(data, rangeLoop(1, len(data)), "Данные")
}
`, 'statistics.hypelang')}
${H3('Замыкания')}
${P('Функции захватывают окружающую область видимости, образуя замыкания:')}
${CODE(`
flow makeAdder n {
    -- возвращает функцию, прибавляющую n к аргументу
    flow adder x { x + n }
    adder
}

flow main {
    let add5  = makeAdder 5
    let add10 = makeAdder 10

    print add5 3     -- 8
    print add10 3    -- 13
    print add5 (add10 2)   -- 17
}
`)}
${H3('Полный пример: Числа Фибоначчи с мемоизацией (lazy)')}
${CODE(`
-- Fibonacci with lazy caching
flow fib n {
    match n {
        0 -> 0;
        1 -> 1;
        _ -> fib (n-1) + fib (n-2);
    }
}

flow main {
    -- вычислить и построить диаграмму
    let xs = []
    let ys = []
    let i = 0
    while i <= 12 {
        xs = push(xs, i)
        ys = push(ys, fib i)
        i++
    }
    print ys
    barChart(xs, ys, "Числа Фибоначчи")
}
`)}
`
}

// ══════════════════════════════════════════════════════════════
// GUIDE SECTIONS REGISTRY
// ══════════════════════════════════════════════════════════════

export const GUIDE_SECTIONS = [
  { id: 'intro',      icon: '🚀', title: { en: 'Introduction',           ru: 'Введение'              }, content: intro          },
  { id: 'variables',  icon: '📦', title: { en: 'Variables & Types',      ru: 'Переменные и типы'     }, content: variables      },
  { id: 'functions',  icon: '⚡', title: { en: 'Functions',              ru: 'Функции'               }, content: functions      },
  { id: 'conditionals',icon: '🔀',title: { en: 'Conditionals',           ru: 'Условия'               }, content: conditionals   },
  { id: 'patterns',   icon: '🔍', title: { en: 'Pattern Matching',       ru: 'Сопоставление'         }, content: patternMatching},
  { id: 'loops',      icon: '🔄', title: { en: 'Loops',                  ru: 'Циклы'                 }, content: loops          },
  { id: 'lists',      icon: '📋', title: { en: 'Lists',                  ru: 'Списки'                }, content: lists          },
  { id: 'recursion',  icon: '♻️', title: { en: 'Recursion',              ru: 'Рекурсия'              }, content: recursion      },
  { id: 'hof',        icon: '🧩', title: { en: 'Higher-Order Functions', ru: 'Функции высш. порядка' }, content: higherOrder    },
  { id: 'lazy',       icon: '💤', title: { en: 'Lazy Evaluation',        ru: 'Ленивые вычисления'    }, content: lazyEval       },
  { id: 'fileio',     icon: '📁', title: { en: 'File I/O',               ru: 'Файловый ввод-вывод'   }, content: fileIO         },
  { id: 'charts',     icon: '📊', title: { en: 'Data Visualization',     ru: 'Визуализация данных'   }, content: charts         },
  { id: 'operators',  icon: '⚙️', title: { en: 'Operators Reference',    ru: 'Справочник операторов' }, content: operators      },
  { id: 'advanced',   icon: '🏆', title: { en: 'Advanced Patterns',      ru: 'Продвинутые паттерны'  }, content: advanced       },
]
