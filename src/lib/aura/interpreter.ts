import { Program, Value, Expr, Pattern } from './types';
import { parseProgram } from './parser';

export interface InterpreterOptions {
  print: (val: string) => void;
}

export class Interpreter {
  private options: InterpreterOptions;

  constructor(options: InterpreterOptions) {
    this.options = options;
  }

  public valueToString(v: Value): string {
    switch (v.type) {
      case 'VInt': return v.value.toString();
      case 'VBool': return v.value ? "true" : "false";
      case 'VString': return v.value;
      case 'VList': return "[" + v.value.map(x => this.valueToString(x)).join(', ') + "]";
      case 'VThunk': return "<lazy>";
      case 'VClosure': return "<function>";
      case 'VBuiltin': return "<builtin>";
    }
  }

  private expectInt(v: Value): number {
    if (v.type !== 'VInt') throw new Error(`Expected int, got ${v.type}`);
    return v.value;
  }

  private expectBool(v: Value): boolean {
    if (v.type !== 'VBool') throw new Error(`Expected bool, got ${v.type}`);
    return v.value;
  }

  private expectString(v: Value): string {
    if (v.type !== 'VString') throw new Error(`Expected string, got ${v.type}`);
    return v.value;
  }

  private expectList(v: Value): Value[] {
    if (v.type !== 'VList') throw new Error(`Expected list, got ${v.type}`);
    return v.value;
  }

  public async eval(program: Program, env: Map<string, Value>, expr: Expr): Promise<[Value, Map<string, Value>]> {
    const isBuiltinName = (name: string) =>
      ["head", "tail", "cons", "len", "isEmpty", "append", "range", "map", "filter", "foldl", "force", "print", "lineChart", "barChart", "scatterChart"].includes(name);

    const resolveVar = (name: string): [Value, Map<string, Value>] => {
      const v = env.get(name);
      if (v !== undefined) return [v, env];
      if (isBuiltinName(name)) return [{ type: 'VBuiltin', name }, env];
      const def = program.flows.get(name);
      if (def !== undefined) return [{ type: 'VClosure', args: def.args, body: def.body, env }, env];
      throw new Error(`Unknown variable: ${name}`);
    };

    const evalMany = async (stateEnv: Map<string, Value>, items: Expr[]): Promise<[Value[], Map<string, Value>]> => {
      const values: Value[] = [];
      let currentEnv = stateEnv;
      for (const item of items) {
        const [v, nextEnv] = await this.eval(program, currentEnv, item);
        values.push(v);
        currentEnv = nextEnv;
      }
      return [values, currentEnv];
    };

    switch (expr.type) {
      case 'Int': return [{ type: 'VInt', value: expr.value }, env];
      case 'Bool': return [{ type: 'VBool', value: expr.value }, env];
      case 'Str': return [{ type: 'VString', value: expr.value }, env];
      case 'Var': return resolveVar(expr.name);
      case 'ListLit': {
        const [vals, nextEnv] = await evalMany(env, expr.items);
        return [{ type: 'VList', value: vals }, nextEnv];
      }
      case 'UnaryOp': {
        const [xv, env1] = await this.eval(program, env, expr.argument);
        if (expr.op === '-') return [{ type: 'VInt', value: -this.expectInt(xv) }, env1];
        if (expr.op === 'not') return [{ type: 'VBool', value: !this.expectBool(xv) }, env1];
        throw new Error(`Unknown unary op: ${expr.op}`);
      }
      case 'Lazy': return [{ type: 'VThunk', expr: expr.inner, env, memo: { value: null } }, env];
      case 'BinOp': {
        if (expr.op === '&&') {
          const [lv, env1] = await this.eval(program, env, expr.left);
          if (this.expectBool(lv)) {
            const [rv, env2] = await this.eval(program, env1, expr.right);
            return [{ type: 'VBool', value: this.expectBool(rv) }, env2];
          }
          return [{ type: 'VBool', value: false }, env1];
        }
        if (expr.op === '||') {
          const [lv, env1] = await this.eval(program, env, expr.left);
          if (this.expectBool(lv)) return [{ type: 'VBool', value: true }, env1];
          const [rv, env2] = await this.eval(program, env1, expr.right);
          return [{ type: 'VBool', value: this.expectBool(rv) }, env2];
        }
        const [lv, env1] = await this.eval(program, env, expr.left);
        const [rv, env2] = await this.eval(program, env1, expr.right);
        switch (expr.op) {
          case '+':
            if (lv.type === 'VInt' && rv.type === 'VInt') return [{ type: 'VInt', value: lv.value + rv.value }, env2];
            if (lv.type === 'VString' && rv.type === 'VString') return [{ type: 'VString', value: lv.value + rv.value }, env2];
            throw new Error("Invalid types for +");
          case '-': return [{ type: 'VInt', value: this.expectInt(lv) - this.expectInt(rv) }, env2];
          case '*': return [{ type: 'VInt', value: this.expectInt(lv) * this.expectInt(rv) }, env2];
          case '/': return [{ type: 'VInt', value: Math.floor(this.expectInt(lv) / this.expectInt(rv)) }, env2];
          case '==': {
             // Basic deep equality for primitives
             const eq = (a: Value, b: Value): boolean => {
               if (a.type !== b.type) return false;
               if (a.type === 'VInt' || a.type === 'VBool' || a.type === 'VString') return (a as any).value === (b as any).value;
               return false; // Complex types don't have == defined in F# code except by reference/structural match
             };
             return [{ type: 'VBool', value: eq(lv, rv) }, env2];
          }
          case '!=': {
             const eq = (a: Value, b: Value): boolean => {
               if (a.type !== b.type) return false;
               if (a.type === 'VInt' || a.type === 'VBool' || a.type === 'VString') return (a as any).value === (b as any).value;
               return false;
             };
             return [{ type: 'VBool', value: !eq(lv, rv) }, env2];
          }
          case '<': return [{ type: 'VBool', value: this.expectInt(lv) < this.expectInt(rv) }, env2];
          case '>': return [{ type: 'VBool', value: this.expectInt(lv) > this.expectInt(rv) }, env2];
          case '<=': return [{ type: 'VBool', value: this.expectInt(lv) <= this.expectInt(rv) }, env2];
          case '>=': return [{ type: 'VBool', value: this.expectInt(lv) >= this.expectInt(rv) }, env2];
        }
        // Fallback for comparison if I mixed types
        if (['<', '>', '<=', '>='].includes(expr.op)) {
           const l = this.expectInt(lv);
           const r = this.expectInt(rv);
           let res = false;
           if (expr.op === '<') res = l < r;
           if (expr.op === '>') res = l > r;
           if (expr.op === '<=') res = l <= r;
           if (expr.op === '>=') res = l >= r;
           return [{ type: 'VBool', value: res }, env2];
        }
        throw new Error("Unknown op: " + expr.op);
      }
      case 'Lambda': return [{ type: 'VClosure', args: expr.args, body: expr.body, env }, env];
      case 'LetBind': {
        const [val, env1] = await this.eval(program, env, expr.rhs);
        return [val, new Map(env1).set(expr.name, val)];
      }
      case 'Seq': {
        let last: Value = { type: 'VBool', value: false };
        let currentEnv = env;
        for (const e of expr.exprs) {
          [last, currentEnv] = await this.eval(program, currentEnv, e);
        }
        return [last, currentEnv];
      }
      case 'Print': {
        const [v, env1] = await this.eval(program, env, expr.inner);
        this.options.print(this.valueToString(v));
        return [v, env1];
      }
      case 'While': {
        let currentEnv = env;
        let lastValue: Value = { type: 'VBool', value: false };
        while (true) {
          const [cv, envAfterCond] = await this.eval(program, currentEnv, expr.condition);
          if (!this.expectBool(cv)) return [lastValue, envAfterCond];
          const [bv, envAfterBody] = await this.eval(program, envAfterCond, expr.body);
          lastValue = bv;
          currentEnv = envAfterBody;
        }
      }
      case 'ForIn': {
        const [iterVal, env1] = await this.eval(program, env, expr.iterable);
        const items = this.expectList(iterVal);
        let currentEnv = env1;
        let lastValue: Value = { type: 'VBool', value: false };
        for (const item of items) {
          const scoped = new Map(currentEnv).set(expr.varName, item);
          const [bv, envAfterBody] = await this.eval(program, scoped, expr.body);
          lastValue = bv;
          currentEnv = envAfterBody;
        }
        return [lastValue, currentEnv];
      }
      case 'IfThenElse': {
        const [cond, env1] = await this.eval(program, env, expr.condition);
        if (this.expectBool(cond)) return this.eval(program, env1, expr.thenBranch);
        else return this.eval(program, env1, expr.elseBranch);
      }
      case 'Match': {
        const [tv, env1] = await this.eval(program, env, expr.target);
        for (const [pat, body] of expr.cases) {
          const binds = this.matchPattern(tv, pat);
          if (binds) {
            const merged = new Map(env1);
            binds.forEach((v, k) => merged.set(k, v));
            return this.eval(program, merged, body);
          }
        }
        throw new Error("Match failed");
      }
      case 'Call': {
        const [fnVal, env1] = await this.eval(program, env, expr.fn);
        const [argVals, env2] = await evalMany(env1, expr.args);
        const result = await this.apply(fnVal, argVals, program);
        return [result, env2];
      }
      case 'Assign': {
        const [v, env1] = await this.eval(program, env, expr.inner);
        return [v, new Map(env1).set(expr.name, v)];
      }
    }
  }

  private matchPattern(v: Value, p: Pattern): Map<string, Value> | null {
    if (p.type === 'PWildcard') return new Map();
    if (p.type === 'PInt' && v.type === 'VInt' && p.value === v.value) return new Map();
    if (p.type === 'PBool' && v.type === 'VBool' && p.value === v.value) return new Map();
    if (p.type === 'PVar') return new Map().set(p.name, v);
    return null;
  }

  private async evalBuiltin(name: string, args: Value[], program: Program): Promise<Value> {
    switch (name) {
      case "print": {
        const v = args[0];
        this.options.print(this.valueToString(v));
        return v;
      }
      case "head": return this.expectList(args[0])[0];
      case "tail": return { type: 'VList', value: this.expectList(args[0]).slice(1) };
      case "cons": return { type: 'VList', value: [args[0], ...this.expectList(args[1])] };
      case "len": return { type: 'VInt', value: this.expectList(args[0]).length };
      case "isEmpty": return { type: 'VBool', value: this.expectList(args[0]).length === 0 };
      case "append": return { type: 'VList', value: [...this.expectList(args[0]), ...this.expectList(args[1])] };
      case "lineChart":
      case "barChart":
      case "scatterChart":
        this.options.print(`[HypeLang] Rendered ${name}: ${this.valueToString(args[0])}`);
        return { type: 'VString', value: `<img>${name}</img>` };
      case "range": {
        const from = this.expectInt(args[0]);
        const to = this.expectInt(args[1]);
        const res: Value[] = [];
        if (from <= to) {
          for (let i = from; i <= to; i++) res.push({ type: 'VInt', value: i });
        } else {
          for (let i = from; i >= to; i--) res.push({ type: 'VInt', value: i });
        }
        return { type: 'VList', value: res };
      }
      case "force": {
        const v = args[0];
        if (v.type === 'VThunk') {
          if (v.memo.value) return v.memo.value;
          const [res] = await this.eval(program, v.env, v.expr);
          v.memo.value = res;
          return res;
        }
        return v;
      }
      case "map": {
        const fn = args[0];
        const list = this.expectList(args[1]);
        const res: Value[] = [];
        for (const x of list) {
          res.push(await this.apply(fn, [x], program));
        }
        return { type: 'VList', value: res };
      }
      default: throw new Error(`Unknown builtin/unimpl: ${name}`);
    }
  }

  private async apply(fnVal: Value, argVals: Value[], program: Program): Promise<Value> {
    let currentFn = fnVal;
    let currentArgs = [...argVals];

    while (true) {
      if (currentFn.type === 'VClosure') {
        if (currentFn.args.length === 0) {
          [currentFn] = await this.eval(program, currentFn.env, currentFn.body);
          continue;
        }
        const [par, ...rest] = currentFn.args;
        const [arg, ...tail] = currentArgs;
        if (arg === undefined) return currentFn;

        const nextEnv = new Map(currentFn.env).set(par, arg);
        if (rest.length === 0) {
          const [res] = await this.eval(program, nextEnv, currentFn.body);
          if (tail.length === 0) return res;
          currentFn = res;
          currentArgs = tail;
        } else {
          currentFn = { type: 'VClosure', args: rest, body: currentFn.body, env: nextEnv };
          currentArgs = tail;
        }
      } else if (currentFn.type === 'VBuiltin') {
        return await this.evalBuiltin(currentFn.name, currentArgs, program);
      } else {
        if (currentArgs.length === 0) return currentFn;
        throw new Error("Attempt to apply non-function");
      }
    }
  }
}

export async function runProgram(source: string, options: InterpreterOptions) {
  const program = parseProgram(source);
  const mainFlow = program.flows.get("main");
  if (!mainFlow) throw new Error("Missing flow main");
  if (mainFlow.args.length > 0) throw new Error("flow main must not have args");

  const interpreter = new Interpreter(options);
  const [val] = await interpreter.eval(program, new Map(), mainFlow.body);
  return interpreter.valueToString(val);
}
