// --- src/lib/aura/types.ts ---
export type Pattern =
  | { type: 'PInt'; value: number }
  | { type: 'PBool'; value: boolean }
  | { type: 'PWildcard' }
  | { type: 'PVar'; name: string };

export type Expr =
  | { type: 'Int'; value: number }
  | { type: 'Bool'; value: boolean }
  | { type: 'StringLit'; value: string }
  | { type: 'Var'; name: string }
  | { type: 'ListLit'; items: Expr[] }
  | { type: 'BinOp'; op: string; left: Expr; right: Expr }
  | { type: 'UnaryOp'; op: string; argument: Expr }
  | { type: 'IfThenElse'; condition: Expr; thenBranch: Expr; elseBranch: Expr }
  | { type: 'Match'; target: Expr; cases: [Pattern, Expr][] }
  | { type: 'Call'; fn: Expr; args: Expr[] }
  | { type: 'Seq'; exprs: Expr[] }
  | { type: 'LetBind'; name: string; rhs: Expr }
  | { type: 'While'; condition: Expr; body: Expr }
  | { type: 'ForIn'; varName: string; iterable: Expr; body: Expr }
  | { type: 'Print'; inner: Expr }
  | { type: 'Assign'; inner: Expr; name: string }
  | { type: 'Lazy'; inner: Expr }
  | { type: 'Force'; inner: Expr };

export interface FlowDef {
  name: string;
  args: string[];
  body: Expr;
}

export interface Program {
  flows: Map<string, FlowDef>;
}

export type Token =
  | { type: 'TInt'; value: number }
  | { type: 'TIdent'; value: string }
  | { type: 'TString'; value: string }
  | { type: 'TTrue' }
  | { type: 'TFalse' }
  | { type: 'TLParen' }
  | { type: 'TRParen' }
  | { type: 'TLBracket' }
  | { type: 'TRBracket' }
  | { type: 'TComma' }
  | { type: 'TOp'; value: string }
  | { type: 'TEOF' };

export type Value =
  | { type: 'VInt'; value: number }
  | { type: 'VBool'; value: boolean }
  | { type: 'VString'; value: string }
  | { type: 'VList'; value: Value[] }
  | { type: 'VClosure'; args: string[]; body: Expr; env: Map<string, Value> }
  | { type: 'VBuiltin'; fn: (args: Value[]) => Value }
  | { type: 'VLazy'; expr: Expr; env: Map<string, Value>; cache: { value: Value | null } };
