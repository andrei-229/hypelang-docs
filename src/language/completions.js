export const BUILTIN_DOCS = [
  {
    name: 'len',
    signature: 'len(collection)',
    detail: { en: 'Returns the length of a list or string.', ru: 'Возвращает длину списка или строки.' },
    doc: {
      en: 'Returns the number of elements in a list, or the number of characters in a string.\n\n**Example:**\n```\nlet n = len([1, 2, 3])  -- 3\nlet s = len("hello")    -- 5\n```',
      ru: 'Возвращает количество элементов в списке или символов в строке.\n\n**Пример:**\n```\nlet n = len([1, 2, 3])  -- 3\nlet s = len("hello")    -- 5\n```'
    },
    snippet: 'len(${1:collection})'
  },
  {
    name: 'head',
    signature: 'head(list)',
    detail: { en: 'Returns the first element of a list.', ru: 'Возвращает первый элемент списка.' },
    doc: {
      en: 'Returns the first element of a non-empty list. Throws an error on an empty list.\n\n**Example:**\n```\nhead([10, 20, 30])  -- 10\n```',
      ru: 'Возвращает первый элемент непустого списка. Ошибка, если список пуст.\n\n**Пример:**\n```\nhead([10, 20, 30])  -- 10\n```'
    },
    snippet: 'head(${1:list})'
  },
  {
    name: 'tail',
    signature: 'tail(list)',
    detail: { en: 'Returns all elements except the first.', ru: 'Возвращает все элементы кроме первого.' },
    doc: {
      en: 'Returns a new list without the first element. Throws an error on an empty list.\n\n**Example:**\n```\ntail([10, 20, 30])  -- [20, 30]\n```',
      ru: 'Возвращает новый список без первого элемента. Ошибка, если список пуст.\n\n**Пример:**\n```\ntail([10, 20, 30])  -- [20, 30]\n```'
    },
    snippet: 'tail(${1:list})'
  },
  {
    name: 'push',
    signature: 'push(list, element)',
    detail: { en: 'Appends an element to the end of a list.', ru: 'Добавляет элемент в конец списка.' },
    doc: {
      en: 'Returns a new list with the element appended. Does not modify the original list.\n\n**Example:**\n```\npush([1, 2], 3)  -- [1, 2, 3]\n```',
      ru: 'Возвращает новый список с добавленным элементом. Оригинал не изменяется.\n\n**Пример:**\n```\npush([1, 2], 3)  -- [1, 2, 3]\n```'
    },
    snippet: 'push(${1:list}, ${2:element})'
  },
  {
    name: 'map',
    signature: 'map(fn, list)',
    detail: { en: 'Applies a function to each element of a list.', ru: 'Применяет функцию к каждому элементу списка.' },
    doc: {
      en: 'Returns a new list where each element is `fn(element)`. The function must take exactly one argument.\n\n**Example:**\n```\nflow double x { x * 2 }\nmap(double, [1, 2, 3])  -- [2, 4, 6]\n```',
      ru: 'Возвращает новый список, где каждый элемент равен `fn(элемент)`. Функция должна принимать один аргумент.\n\n**Пример:**\n```\nflow double x { x * 2 }\nmap(double, [1, 2, 3])  -- [2, 4, 6]\n```'
    },
    snippet: 'map(${1:fn}, ${2:list})'
  },
  {
    name: 'reduce',
    signature: 'reduce(fn, list)',
    detail: { en: 'Folds a list into a single accumulated value.', ru: 'Сворачивает список в одно накопленное значение.' },
    doc: {
      en: 'Applies `fn(accumulator, element)` cumulatively. The first element becomes the initial accumulator.\n\n**Example:**\n```\nflow add a b { a + b }\nreduce(add, [1, 2, 3, 4])  -- 10\n```',
      ru: 'Применяет `fn(аккумулятор, элемент)` последовательно. Первый элемент становится начальным аккумулятором.\n\n**Пример:**\n```\nflow add a b { a + b }\nreduce(add, [1, 2, 3, 4])  -- 10\n```'
    },
    snippet: 'reduce(${1:fn}, ${2:list})'
  },
  {
    name: 'readFile',
    signature: 'readFile(path)',
    detail: { en: 'Reads a file and returns its contents as a string.', ru: 'Читает файл и возвращает содержимое строкой.' },
    doc: {
      en: 'Reads the entire file at `path` and returns its contents.\n\n**Example:**\n```\nlet text = readFile("data.txt")\nprint text\n```',
      ru: 'Читает файл по пути `path` и возвращает его содержимое.\n\n**Пример:**\n```\nlet text = readFile("data.txt")\nprint text\n```'
    },
    snippet: 'readFile(${1:"path/to/file"})'
  },
  {
    name: 'writeFile',
    signature: 'writeFile(path, content)',
    detail: { en: 'Writes a string to a file.', ru: 'Записывает строку в файл.' },
    doc: {
      en: 'Creates or overwrites the file at `path` with `content`. Returns `true` on success.\n\n**Example:**\n```\nwriteFile("output.txt", "Hello, HypeLang!")\n```',
      ru: 'Создаёт или перезаписывает файл по пути `path` содержимым `content`. Возвращает `true` при успехе.\n\n**Пример:**\n```\nwriteFile("output.txt", "Hello, HypeLang!")\n```'
    },
    snippet: 'writeFile(${1:"path/to/file"}, ${2:content})'
  },
  {
    name: 'plot',
    signature: 'plot(values, title)',
    detail: { en: 'Creates a line chart from a list of values.', ru: 'Строит линейный график из списка значений.' },
    doc: {
      en: 'Generates an HTML line chart with auto-numbered X axis and opens it in the browser.\n\n**Example:**\n```\nplot([1, 4, 9, 16, 25], "Squares")\n```',
      ru: 'Создаёт HTML-график с автонумерацией оси X и открывает в браузере.\n\n**Пример:**\n```\nplot([1, 4, 9, 16, 25], "Квадраты")\n```'
    },
    snippet: 'plot(${1:values}, ${2:"Chart Title"})'
  },
  {
    name: 'plotXY',
    signature: 'plotXY(xValues, yValues, title)',
    detail: { en: 'Creates a line chart with custom X and Y axes.', ru: 'Строит линейный график с заданными осями X и Y.' },
    doc: {
      en: 'Both lists must have the same length. Opens the chart in the browser.\n\n**Example:**\n```\nplotXY([1,2,3,4,5], [1,4,9,16,25], "Y = X²")\n```',
      ru: 'Оба списка должны иметь одинаковую длину. Открывает график в браузере.\n\n**Пример:**\n```\nplotXY([1,2,3,4,5], [1,4,9,16,25], "Y = X²")\n```'
    },
    snippet: 'plotXY(${1:xValues}, ${2:yValues}, ${3:"Chart Title"})'
  },
  {
    name: 'barChart',
    signature: 'barChart(labels, values, title)',
    detail: { en: 'Creates a bar chart.', ru: 'Строит столбчатую диаграмму.' },
    doc: {
      en: 'Labels can be strings or numbers. Supports negative values. Opens in browser.\n\n**Example:**\n```\nbarChart(["A","B","C"], [30, 70, 50], "Results")\n```',
      ru: 'Метки могут быть строками или числами. Поддерживает отрицательные значения. Открывает в браузере.\n\n**Пример:**\n```\nbarChart(["A","B","C"], [30, 70, 50], "Результаты")\n```'
    },
    snippet: 'barChart(${1:labels}, ${2:values}, ${3:"Chart Title"})'
  },
  {
    name: 'scatter',
    signature: 'scatter(xValues, yValues, title)',
    detail: { en: 'Creates a scatter plot.', ru: 'Строит точечную диаграмму.' },
    doc: {
      en: 'Both lists must have the same length. Opens in browser.\n\n**Example:**\n```\nscatter([1,2,3,4], [10,4,6,2], "Data Points")\n```',
      ru: 'Оба списка должны иметь одинаковую длину. Открывает в браузере.\n\n**Пример:**\n```\nscatter([1,2,3,4], [10,4,6,2], "Точки данных")\n```'
    },
    snippet: 'scatter(${1:xValues}, ${2:yValues}, ${3:"Chart Title"})'
  }
]

export const KEYWORD_SNIPPETS = [
  {
    label: 'flow',
    detail: { en: 'Define a function', ru: 'Определить функцию' },
    doc: {
      en: 'Defines a named function. The last expression in the body is the return value.',
      ru: 'Определяет именованную функцию. Последнее выражение в теле — возвращаемое значение.'
    },
    snippet: 'flow ${1:name} ${2:args} {\n\t$0\n}'
  },
  {
    label: 'let',
    detail: { en: 'Bind a value to a name', ru: 'Привязать значение к имени' },
    doc: {
      en: 'Creates a new variable binding in the current scope.',
      ru: 'Создаёт новую привязку переменной в текущей области видимости.'
    },
    snippet: 'let ${1:name} = ${2:value}'
  },
  {
    label: 'when',
    detail: { en: 'Conditional expression (if/else)', ru: 'Условное выражение (if/else)' },
    doc: {
      en: 'Executes one of two branches based on a condition.',
      ru: 'Выполняет одну из двух ветвей в зависимости от условия.'
    },
    snippet: 'when ${1:condition} {\n\t$2\n} else {\n\t$3\n}'
  },
  {
    label: 'while',
    detail: { en: 'While loop', ru: 'Цикл while' },
    doc: {
      en: 'Repeats the body while the condition is true.',
      ru: 'Повторяет тело, пока условие истинно.'
    },
    snippet: 'while ${1:condition} {\n\t$0\n}'
  },
  {
    label: 'for',
    detail: { en: 'For-in loop over a list', ru: 'Цикл for-in по списку' },
    doc: {
      en: 'Iterates over each element of a list.',
      ru: 'Перебирает каждый элемент списка.'
    },
    snippet: 'for ${1:list} use ${2:item} {\n\t$0\n}'
  },
  {
    label: 'match',
    detail: { en: 'Pattern matching expression', ru: 'Сопоставление с образцом' },
    doc: {
      en: 'Matches a value against a series of patterns. Use `_` as a wildcard.',
      ru: 'Сопоставляет значение с набором образцов. Используй `_` как заглушку.'
    },
    snippet: 'match ${1:value} {\n\t${2:0} -> ${3:result};\n\t_ -> ${4:default};\n}'
  },
  {
    label: 'print',
    detail: { en: 'Print a value to the output', ru: 'Вывести значение на экран' },
    doc: {
      en: 'Prints the value to standard output.',
      ru: 'Выводит значение в стандартный вывод.'
    },
    snippet: 'print ${1:value}'
  },
  {
    label: 'lazy',
    detail: { en: 'Defer evaluation', ru: 'Отложить вычисление' },
    doc: {
      en: 'Creates a lazy value — not computed until `force` is called.',
      ru: 'Создаёт отложенное значение — не вычисляется до вызова `force`.'
    },
    snippet: 'lazy (${1:expression})'
  },
  {
    label: 'force',
    detail: { en: 'Evaluate a lazy value', ru: 'Вычислить отложенное значение' },
    doc: {
      en: 'Forces evaluation of a lazy value and caches the result.',
      ru: 'Принудительно вычисляет ленивое значение и кэширует результат.'
    },
    snippet: 'force ${1:lazyValue}'
  }
]

export const OPERATORS_DOCS = [
  { op: '->', sig: 'expr -> name', detail: { en: 'Assign result to variable', ru: 'Присвоить результат переменной' } },
  { op: '++', sig: 'x++', detail: { en: 'Increment by 1', ru: 'Увеличить на 1' } },
  { op: '+=', sig: 'x += n', detail: { en: 'Add n to variable in-place', ru: 'Прибавить n к переменной' } },
  { op: '+', sig: 'a + b', detail: { en: 'Addition', ru: 'Сложение' } },
  { op: '-', sig: 'a - b', detail: { en: 'Subtraction', ru: 'Вычитание' } },
  { op: '*', sig: 'a * b', detail: { en: 'Multiplication', ru: 'Умножение' } },
  { op: '/', sig: 'a / b', detail: { en: 'Integer division', ru: 'Целочисленное деление' } },
  { op: '==', sig: 'a == b', detail: { en: 'Equal to', ru: 'Равно' } },
  { op: '!=', sig: 'a != b', detail: { en: 'Not equal to', ru: 'Не равно' } },
  { op: '<', sig: 'a < b', detail: { en: 'Less than', ru: 'Меньше' } },
  { op: '>', sig: 'a > b', detail: { en: 'Greater than', ru: 'Больше' } },
  { op: '<=', sig: 'a <= b', detail: { en: 'Less than or equal', ru: 'Меньше или равно' } },
  { op: '>=', sig: 'a >= b', detail: { en: 'Greater than or equal', ru: 'Больше или равно' } },
]

export function registerCompletions(monaco) {
  monaco.languages.registerCompletionItemProvider('hypelang', {
    triggerCharacters: [],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      const builtins = BUILTIN_DOCS.map(b => ({
        label: b.name,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: b.detail.en,
        documentation: { value: `**${b.signature}**\n\n${b.doc.en}`, isTrusted: true },
        insertText: b.snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      }))

      const keywords = KEYWORD_SNIPPETS.map(k => ({
        label: k.label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        detail: k.detail.en,
        documentation: { value: k.doc.en, isTrusted: true },
        insertText: k.snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      }))

      const literals = [
        { label: 'true', kind: monaco.languages.CompletionItemKind.Value, insertText: 'true', range },
        { label: 'false', kind: monaco.languages.CompletionItemKind.Value, insertText: 'false', range },
      ]

      return { suggestions: [...builtins, ...keywords, ...literals] }
    }
  })
}

export function registerHover(monaco) {
  monaco.languages.registerHoverProvider('hypelang', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const builtin = BUILTIN_DOCS.find(b => b.name === word.word)
      if (builtin) {
        return {
          contents: [
            { value: `**\`${builtin.signature}\`**` },
            { value: builtin.doc.en }
          ]
        }
      }

      const kw = KEYWORD_SNIPPETS.find(k => k.label === word.word)
      if (kw) {
        return {
          contents: [
            { value: `**${kw.label}** — ${kw.detail.en}` },
            { value: kw.doc.en }
          ]
        }
      }

      return null
    }
  })
}
