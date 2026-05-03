import { Token, Expr, Pattern, Program, FlowDef } from './types';
import { tokenize } from './lexer';

class ExprParser {
  private arr: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.arr = tokens;
  }

  private peek(): Token {
    return this.arr[this.pos];
  }

  private next(): Token {
    return this.arr[this.pos++];
  }

  private expect(type: Token['type']) {
    const got = this.next();
    if (got.type !== type) {
      throw new Error(`Expected token ${type}, got ${got.type}`);
    }
    return got;
  }

  private isAtomStart() {
    const t = this.peek();
    return ['TInt', 'TString', 'TIdent', 'TTrue', 'TFalse', 'TLBracket', 'TLParen'].includes(t.type);
  }

  private parsePrimary(): Expr {
    const t = this.next();
    switch (t.type) {
      case 'TInt': return { type: 'Int', value: t.value };
      case 'TString': return { type: 'Str', value: t.value };
      case 'TTrue': return { type: 'Bool', value: true };
      case 'TFalse': return { type: 'Bool', value: false };
      case 'TIdent': return { type: 'Var', name: t.value };
      case 'TLBracket': {
        const items: Expr[] = [];
        if (this.peek().type !== 'TRBracket') {
          while (true) {
            items.push(this.parseExprCore());
            if (this.peek().type === 'TComma') {
              this.next();
            } else {
              break;
            }
          }
        }
        this.expect('TRBracket');
        return { type: 'ListLit', items };
      }
      case 'TLParen': {
        const e = this.parseExprCore();
        this.expect('TRParen');
        return e;
      }
      default:
        throw new Error(`Unexpected token in primary: ${JSON.stringify(t)}`);
    }
  }

  private parseLambda(): Expr {
    if (this.peek().type === 'TFun') {
      this.next();
      const args: string[] = [];
      while (this.peek().type === 'TIdent') {
        args.push((this.next() as any).value);
      }
      if (args.length === 0) throw new Error("Lambda must have args");
      this.expect('TArrow');
      const body = this.parseExprCore();
      return { type: 'Lambda', args, body };
    }
    return this.parseOr();
  }

  private parseCall(): Expr {
    let f = this.parsePrimary();
    while (true) {
      if (this.peek().type === 'TLParen') {
        this.next();
        const args: Expr[] = [];
        if (this.peek().type !== 'TRParen') {
          while (true) {
            args.push(this.parseExprCore());
            if (this.peek().type === 'TComma') {
              this.next();
            } else {
              break;
            }
          }
        }
        this.expect('TRParen');
        f = { type: 'Call', fn: f, args };
      } else if (this.isAtomStart()) {
        const arg = this.parsePrimary();
        f = { type: 'Call', fn: f, args: [arg] };
      } else {
        break;
      }
    }
    return f;
  }

  private parseUnary(): Expr {
    const t = this.peek();
    if (t.type === 'TOp' && t.value === '-') {
      this.next();
      return { type: 'UnaryOp', op: '-', argument: this.parseUnary() };
    }
    if (t.type === 'TNot') {
      this.next();
      return { type: 'UnaryOp', op: 'not', argument: this.parseUnary() };
    }
    if (t.type === 'TLazy') {
      this.next();
      return { type: 'Lazy', inner: this.parseUnary() };
    }
    return this.parseCall();
  }

  private parseMul(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === 'TOp' && ['*', '/'].includes((this.peek() as any).value)) {
      const op = (this.next() as any).value;
      const right = this.parseUnary();
      left = { type: 'BinOp', op, left, right };
    }
    return left;
  }

  private parseAdd(): Expr {
    let left = this.parseMul();
    while (this.peek().type === 'TOp' && ['+', '-'].includes((this.peek() as any).value)) {
      const op = (this.next() as any).value;
      const right = this.parseMul();
      left = { type: 'BinOp', op, left, right };
    }
    return left;
  }

  private parseCmp(): Expr {
    const left = this.parseAdd();
    const t = this.peek();
    if (t.type === 'TOp' && ['==', '!=', '<', '>', '<=', '>='].includes(t.value)) {
      const op = (this.next() as any).value;
      const right = this.parseAdd();
      return { type: 'BinOp', op, left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseCmp();
    while (this.peek().type === 'TOp' && (this.peek() as any).value === '&&') {
      this.next();
      const right = this.parseCmp();
      left = { type: 'BinOp', op: '&&', left, right };
    }
    return left;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.peek().type === 'TOp' && (this.peek() as any).value === '||') {
      this.next();
      const right = this.parseAnd();
      left = { type: 'BinOp', op: '||', left, right };
    }
    return left;
  }

  public parseExprCore(): Expr {
    return this.parseLambda();
  }

  public parseExpr(): Expr {
    const e = this.parseExprCore();
    if (this.peek().type !== 'TEOF') {
      throw new Error(`Extra token at end: ${JSON.stringify(this.peek())}`);
    }
    return e;
  }
}

export function parseExpr(text: string): Expr {
  return new ExprParser(tokenize(text)).parseExpr();
}

function parsePattern(raw: string): Pattern {
  const s = raw.trim();
  if (s === "_") return { type: 'PWildcard' };
  if (s === "true") return { type: 'PBool', value: true };
  if (s === "false") return { type: 'PBool', value: false };
  const n = parseInt(s);
  if (!isNaN(n)) return { type: 'PInt', value: n };
  return { type: 'PVar', name: s };
}

function findTopLevelArrows(line: string): number[] {
  const idxs: number[] = [];
  let depthParen = 0;
  let depthBracket = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
    } else {
      if (c === '"') inString = true;
      else if (c === '(') depthParen++;
      else if (c === ')') depthParen = Math.max(0, depthParen - 1);
      else if (c === '[') depthBracket++;
      else if (c === ']') depthBracket = Math.max(0, depthBracket - 1);
      else if (c === '-' && line[i + 1] === '>' && depthParen === 0 && depthBracket === 0) {
        idxs.push(i);
      }
    }
  }
  return idxs;
}

function splitArrowFirst(line: string): [string, string] | null {
  const idxs = findTopLevelArrows(line);
  if (idxs.length === 0) return null;
  const idx = idxs[0];
  return [line.substring(0, idx).trimEnd(), line.substring(idx + 2).trimStart()];
}

function splitArrowLast(line: string): [string, string] | null {
  const idxs = findTopLevelArrows(line);
  if (idxs.length === 0) return null;
  const idx = idxs[idxs.length - 1];
  return [line.substring(0, idx).trimEnd(), line.substring(idx + 2).trimStart()];
}

function isIdentText(s: string) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
}

function parseWhenElseBlock(lines: string[]): Expr {
  const whenLine = lines.find(l => l.trimStart().startsWith("when "))!;
  const elseLine = lines.find(l => l.trimStart().startsWith("else "))!;

  const whenTrim = whenLine.trim();
  const elseTrim = elseLine.trim();

  const whenYieldIdx = whenTrim.indexOf(" yield ");
  if (whenYieldIdx < 0) throw new Error("Expected 'yield' in when");

  const condRaw = whenTrim.substring(5, whenYieldIdx).trim();
  const thenRaw = whenTrim.substring(whenYieldIdx + 7).trim();

  const elseYieldPrefix = "else yield ";
  if (!elseTrim.startsWith(elseYieldPrefix)) throw new Error("Expected 'else yield ...'");
  const elseRaw = elseTrim.substring(elseYieldPrefix.length).trim();

  return {
    type: 'IfThenElse',
    condition: parseExpr(condRaw),
    thenBranch: parseExpr(thenRaw),
    elseBranch: parseExpr(elseRaw)
  };
}

function blockExpr(exprs: Expr[]): Expr {
  if (exprs.length === 0) throw new Error("Empty block");
  if (exprs.length === 1) return exprs[0];
  return { type: 'Seq', exprs };
}

function isNoiseLine(line: string) {
  const t = line.trim();
  return t === "" || t === ";" || t.startsWith("--") || t.startsWith("//");
}

function isBlockStarter(trimmed: string) {
  return ["when ", "while ", "for ", "match ", "let ", "print "].some(s => trimmed.startsWith(s));
}

function parseSingleLineExpr(trimmed: string): Expr {
  if (trimmed.startsWith("let ")) {
    const body = trimmed.substring(4).trim();
    const idx = body.indexOf('=');
    if (idx < 0) throw new Error("Expected let name = expr");
    const name = body.substring(0, idx).trim();
    const rhs = body.substring(idx + 1).trim();
    return { type: 'LetBind', name, rhs: parseExpr(rhs) };
  }
  if (trimmed.startsWith("print ")) {
    return { type: 'Print', inner: parseExpr(trimmed.substring(6).trim()) };
  }
  if (trimmed.endsWith("++")) {
    const name = trimmed.substring(0, trimmed.length - 2).trim();
    return {
      type: 'Assign',
      name,
      inner: { type: 'BinOp', op: '+', left: { type: 'Var', name }, right: { type: 'Int', value: 1 } }
    };
  }
  if (trimmed.includes("+=")) {
    const idx = trimmed.indexOf("+=");
    const name = trimmed.substring(0, idx).trim();
    const rhsRaw = trimmed.substring(idx + 2).trim();
    return {
      type: 'Assign',
      name,
      inner: { type: 'BinOp', op: '+', left: { type: 'Var', name }, right: parseExpr(rhsRaw) }
    };
  }
  const arrow = splitArrowLast(trimmed);
  if (arrow && isIdentText(arrow[1])) {
    return { type: 'Assign', name: arrow[1], inner: parseExpr(arrow[0]) };
  }
  return parseExpr(trimmed);
}

function parseBlock(lines: string[], startIdx: number, terminators: Set<string>): [Expr[], number, string | null] {
  const nextNonNoise = (idx: number) => {
    let i = idx;
    while (i < lines.length && isNoiseLine(lines[i])) i++;
    return i;
  };

  const parseBracedBody = (openIdx: number): [Expr[], number] => {
    const i0 = nextNonNoise(openIdx);
    if (i0 >= lines.length || lines[i0].trim() !== "{") throw new Error("Expected '{'");
    const [exprs, nextIdx, term] = parseBlock(lines, i0 + 1, new Set(["}"]));
    if (term !== "}") throw new Error("Unclosed '{ }'");
    return [exprs, nextIdx];
  };

  const exprs: Expr[] = [];
  let i = startIdx;

  while (true) {
    i = nextNonNoise(i);
    if (i >= lines.length) return [exprs, i, null];

    const t = lines[i].trim();
    if (terminators.has(t)) return [exprs, i + 1, t];

    if (t === "{" || t === ";") {
      i++;
      continue;
    }

    if (t.startsWith("when ") && t.includes(" yield ")) {
      const nextI = nextNonNoise(i + 1);
      if (nextI >= lines.length) throw new Error("Missing else yield after when yield");
      exprs.push(parseWhenElseBlock([t, lines[nextI].trim()]));
      i = nextI + 1;
    } else if (t.startsWith("when ")) {
      const condRaw = t.substring(5).trim();
      const bodyStart = nextNonNoise(i + 1);
      if (bodyStart < lines.length && lines[bodyStart].trim() === "{") {
        const [thenExprs, afterThen] = parseBracedBody(bodyStart);
        const maybeElse = nextNonNoise(afterThen);
        if (maybeElse < lines.length && lines[maybeElse].trim() === "else") {
          const [elseExprs, afterElse] = parseBracedBody(maybeElse + 1);
          exprs.push({ type: 'IfThenElse', condition: parseExpr(condRaw), thenBranch: blockExpr(thenExprs), elseBranch: blockExpr(elseExprs) });
          i = afterElse;
        } else {
          exprs.push({ type: 'IfThenElse', condition: parseExpr(condRaw), thenBranch: blockExpr(thenExprs), elseBranch: { type: 'Bool', value: false } });
          i = afterThen;
        }
      } else {
        const [thenExprs, nextIdx, term] = parseBlock(lines, i + 1, new Set(["else", "end"]));
        if (term === "else") {
          const [elseExprs, afterElseIdx, endTerm] = parseBlock(lines, nextIdx, new Set(["end"]));
          if (endTerm !== "end") throw new Error("Missing end for when else");
          exprs.push({ type: 'IfThenElse', condition: parseExpr(condRaw), thenBranch: blockExpr(thenExprs), elseBranch: blockExpr(elseExprs) });
          i = afterElseIdx;
        } else if (term === "end") {
          exprs.push({ type: 'IfThenElse', condition: parseExpr(condRaw), thenBranch: blockExpr(thenExprs), elseBranch: { type: 'Bool', value: false } });
          i = nextIdx;
        } else {
          throw new Error("Unclosed when");
        }
      }
    } else if (t.startsWith("while ")) {
      const condRaw = t.substring(6).trim();
      const bodyStart = nextNonNoise(i + 1);
      if (bodyStart < lines.length && lines[bodyStart].trim() === "{") {
        const [bodyExprs, nextIdx] = parseBracedBody(bodyStart);
        exprs.push({ type: 'While', condition: parseExpr(condRaw), body: blockExpr(bodyExprs) });
        i = nextIdx;
      } else {
        const [bodyExprs, nextIdx, term] = parseBlock(lines, i + 1, new Set(["end"]));
        if (term !== "end") throw new Error("Missing end for while");
        exprs.push({ type: 'While', condition: parseExpr(condRaw), body: blockExpr(bodyExprs) });
        i = nextIdx;
      }
    } else if (t.startsWith("for ")) {
      const rest = t.substring(4).trim();
      const useIdx = rest.indexOf(" use ");
      let varName = "", iterableRaw = "";
      if (useIdx >= 0) {
        iterableRaw = rest.substring(0, useIdx).trim();
        varName = rest.substring(useIdx + 5).trim();
      } else {
        const inIdx = rest.indexOf(" in ");
        if (inIdx < 0) throw new Error("Expected for <item> in <array>");
        varName = rest.substring(0, inIdx).trim();
        iterableRaw = rest.substring(inIdx + 4).trim();
      }
      
      // Robustness: strip outer parens if the user used them like for (i in range())
      if (varName.startsWith("(") && iterableRaw.endsWith(")")) {
        varName = varName.substring(1).trim();
        iterableRaw = iterableRaw.substring(0, iterableRaw.length - 1).trim();
      }
      
      const bodyStart = nextNonNoise(i + 1);
      if (bodyStart < lines.length && lines[bodyStart].trim() === "{") {
        const [bodyExprs, nextIdx] = parseBracedBody(bodyStart);
        exprs.push({ type: 'ForIn', varName, iterable: parseExpr(iterableRaw), body: blockExpr(bodyExprs) });
        i = nextIdx;
      } else {
        const [bodyExprs, nextIdx, term] = parseBlock(lines, i + 1, new Set(["end"]));
        if (term !== "end") throw new Error("Missing end for for");
        exprs.push({ type: 'ForIn', varName, iterable: parseExpr(iterableRaw), body: blockExpr(bodyExprs) });
        i = nextIdx;
      }
    } else if (t.startsWith("match ")) {
      const targetRaw = t.substring(6).trim();
      let j = nextNonNoise(i + 1);
      const cases: [Pattern, Expr][] = [];
      if (j < lines.length && lines[j].trim() === "{") {
        j++;
        while (j < lines.length) {
          j = nextNonNoise(j);
          if (j >= lines.length) throw new Error("Unclosed match");
          const ct = lines[j].trim();
          if (ct === "}") { j++; break; }
          if (ct === ";") { j++; continue; }
          const arrow = splitArrowFirst(ct);
          if (!arrow) throw new Error("Invalid match case: " + ct);
          cases.push([parsePattern(arrow[0]), parseExpr(arrow[1])]);
          j++;
        }
      } else {
        while (j < lines.length) {
          const ct = lines[j].trim();
          if (isNoiseLine(lines[j])) { j++; continue; }
          if (ct === "end") { j++; break; }
          if (isBlockStarter(ct)) break;
          const arrow = splitArrowFirst(ct);
          if (!arrow) break;
          cases.push([parsePattern(arrow[0]), parseExpr(arrow[1])]);
          j++;
        }
      }
      exprs.push({ type: 'Match', target: parseExpr(targetRaw), cases });
      i = j;
    } else {
      exprs.push(parseSingleLineExpr(t));
      i++;
    }
  }
}

function normalizeSourceLines(source: string): string[] {
  const s = source.replace(/\r\n/g, "\n");
  const lines = s.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trimStart();
    if (t.startsWith("--") || t.startsWith("//")) {
      out.push(line);
      continue;
    }
    
    let current = "";
    let inString = false;
    let escaped = false;
    
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inString) {
        current += ch;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
      } else {
        if (ch === '"') {
          inString = true;
          current += ch;
        } else if (ch === '{' || ch === '}' || ch === ';') {
          if (current.trim()) out.push(current);
          out.push(ch);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    if (current.trim()) out.push(current);
  }
  return out;
}

export function parseProgram(source: string): Program {
  const lines = normalizeSourceLines(source);
  const flows = new Map<string, FlowDef>();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("--") || trimmed.startsWith("//")) {
      i++;
      continue;
    }

    if (trimmed.startsWith("flow ")) {
      const parts = trimmed.split(/\s+/);
      const name = parts[1];
      const args = parts.slice(2);

      const nextNonNoise = (idx: number) => {
        let k = idx;
        while (k < lines.length && isNoiseLine(lines[k])) k++;
        return k;
      };

      let j = nextNonNoise(i + 1);
      const bodyLines: string[] = [];

      if (j < lines.length && lines[j].trim() === "{") {
        let depth = 1;
        j++;
        while (j < lines.length && depth > 0) {
          const t = lines[j].trim();
          if (t === "{") depth++;
          else if (t === "}") depth--;
          if (depth > 0 || (t !== "}" && depth === 0)) bodyLines.push(lines[j]);
          j++;
        }
        if (depth !== 0) throw new Error("Unclosed flow " + name);
      } else {
        while (j < lines.length && !lines[j].trim().startsWith("flow ")) {
          bodyLines.push(lines[j]);
          j++;
        }
      }

      const [exprs] = parseBlock(bodyLines, 0, new Set());
      flows.set(name, { name, args, body: blockExpr(exprs) });
      i = j;
    } else {
      throw new Error("Expected flow, got: " + trimmed);
    }
  }
  return { flows };
}
