import { Token } from './types';

export function tokenize(text: string): Token[] {
  const len = text.length;
  const tokens: Token[] = [];
  let i = 0;

  const isIdentStart = (c: string) => /[a-zA-Z_]/.test(c);
  const isIdentCont = (c: string) => /[a-zA-Z0-9_]/.test(c);
  const isDigit = (c: string) => /[0-9]/.test(c);

  const parseString = (startIdx: number): [string, number] => {
    let s = "";
    let j = startIdx + 1;
    let closed = false;

    while (j < len && !closed) {
      const c = text[j];
      if (c === '"') {
        closed = true;
        j++;
      } else if (c === '\\' && j + 1 < len) {
        const esc = text[j + 1];
        switch (esc) {
          case 'n': s += '\n'; break;
          case 'r': s += '\r'; break;
          case 't': s += '\t'; break;
          case '"': s += '"'; break;
          case '\\': s += '\\'; break;
          default: s += esc; break;
        }
        j += 2;
      } else {
        s += c;
        j++;
      }
    }

    if (!closed) throw new Error("Unclosed string");
    return [s, j];
  };

  while (i < len) {
    const c = text[i];

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (c === '"') {
      const [s, nextI] = parseString(i);
      tokens.push({ type: 'TString', value: s });
      i = nextI;
    } else if (isDigit(c)) {
      let j = i;
      while (j < len && isDigit(text[j])) j++;
      const n = parseInt(text.substring(i, j));
      tokens.push({ type: 'TInt', value: n });
      i = j;
    } else if (isIdentStart(c)) {
      let j = i;
      while (j < len && isIdentCont(text[j])) j++;
      const word = text.substring(i, j);
      switch (word) {
        case "true": tokens.push({ type: 'TTrue' }); break;
        case "false": tokens.push({ type: 'TFalse' }); break;
        case "fun": tokens.push({ type: 'TFun' }); break;
        case "not": tokens.push({ type: 'TNot' }); break;
        case "lazy": tokens.push({ type: 'TLazy' }); break;
        default: tokens.push({ type: 'TIdent', value: word }); break;
      }
      i = j;
    } else if (c === '(') {
      tokens.push({ type: 'TLParen' });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'TRParen' });
      i++;
    } else if (c === '[') {
      tokens.push({ type: 'TLBracket' });
      i++;
    } else if (c === ']') {
      tokens.push({ type: 'TRBracket' });
      i++;
    } else if (c === ',') {
      tokens.push({ type: 'TComma' });
      i++;
    } else {
      const two = text.substring(i, i + 2);
      let op = "";
      let step = 0;

      if (["->", "&&", "||", "==", "!=", "<=", ">="].includes(two)) {
        op = two;
        step = 2;
      } else {
        op = c;
        step = 1;
      }

      if (op === "->") {
        tokens.push({ type: 'TArrow' });
      } else if (["+", "-", "*", "/", "&&", "||", "==", "!=", "<", ">", "<=", ">="].includes(op)) {
        tokens.push({ type: 'TOp', value: op });
      } else {
        throw new Error(`Unknown character: '${op}'`);
      }
      i += step;
    }
  }

  tokens.push({ type: 'TEOF' });
  return tokens;
}
