export const KEYWORDS = [
  'flow', 'let', 'when', 'else', 'while', 'for', 'match', 'end',
  'print', 'lazy', 'force', 'yield', 'use', 'in', 'true', 'false'
]

export const BUILTINS = [
  'len', 'head', 'tail', 'push', 'map', 'reduce',
  'readFile', 'writeFile', 'plot', 'plotXY', 'barChart', 'scatter'
]

export function registerHypeLang(monaco) {
  monaco.languages.register({ id: 'hypelang', extensions: ['.hypelang', '.hype', '.hpl'] })

  monaco.languages.setMonarchTokensProvider('hypelang', {
    keywords: KEYWORDS,
    builtins: BUILTINS,
    operators: ['->', '++', '+=', '==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/'],

    tokenizer: {
      root: [
        // Comments
        [/--.*$/, 'comment'],
        [/\/\/.*$/, 'comment'],

        // Strings
        [/"([^"\\]|\\.)*"/, 'string'],

        // Numbers
        [/-?\b\d+\b/, 'number'],

        // Booleans
        [/\b(true|false)\b/, 'boolean'],

        // Operators (must come before identifiers)
        [/->/, 'operator'],
        [/\+\+/, 'operator'],
        [/\+=/, 'operator'],
        [/==|!=|<=|>=/, 'operator'],
        [/[+\-*\/<>=!]/, 'operator'],

        // Identifiers and keywords
        [/\b[a-zA-Z_][a-zA-Z0-9_]*\b/, {
          cases: {
            '@keywords': 'keyword',
            '@builtins': 'builtin',
            '@default':  'identifier'
          }
        }],

        // Delimiters
        [/[{}()\[\]]/, 'delimiter'],
        [/[,;]/, 'delimiter'],
        [/_/, 'keyword'],

        // Whitespace
        [/\s+/, 'white'],
      ]
    }
  })

  monaco.languages.setLanguageConfiguration('hypelang', {
    comments: {
      lineComment: '--'
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string', 'comment'] }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ],
    indentationRules: {
      increaseIndentPattern: /\{[^}]*$/,
      decreaseIndentPattern: /^\s*\}/
    }
  })
}
