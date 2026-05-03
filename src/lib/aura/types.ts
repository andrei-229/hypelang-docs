export type Pattern =
  | { type: 'PInt'; value: number }
  | { type: 'PBool'; value: boolean }
  | { type: 'PWildcard' }
  | { type: 'PVar'; name: string };

export type Expr =
  | { type: 'Int'; value: number }
  | { type: 'Bool'; value: boolean }
  | { type: 'Str'; value: string }
  | { type: 'Var'; name: string }
  | { type: 'ListLit'; items: Expr[] }
  | { type: 'BinOp'; op: string; left: Expr; right: Expr }
  | { type: 'UnaryOp'; op: string; argument: Expr }
  | { type: 'Lazy'; inner: Expr }
  | { type: 'Lambda'; args: string[]; body: Expr }
  | { type: 'IfThenElse'; condition: Expr; thenBranch: Expr; elseBranch: Expr }
  | { type: 'Match'; target: Expr; cases: [Pattern, Expr][] }
  | { type: 'Call'; fn: Expr; args: Expr[] }
  | { type: 'Seq'; exprs: Expr[] }
  | { type: 'LetBind'; name: string; rhs: Expr }
  | { type: 'While'; condition: Expr; body: Expr }
  | { type: 'ForIn'; varName: string; iterable: Expr; body: Expr }
  | { type: 'Print'; inner: Expr }
  | { type: 'Assign'; inner: Expr; name: string };

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
  | { type: 'TString'; value: string }
  | { type: 'TIdent'; value: string }
  | { type: 'TFun' }
  | { type: 'TNot' }
  | { type: 'TLazy' }
  | { type: 'TTrue' }
  | { type: 'TFalse' }
  | { type: 'TArrow' }
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
  | { type: 'VThunk'; expr: Expr; env: Map<string, Value>; memo: { value: Value | null } }
  | { type: 'VClosure'; args: string[]; body: Expr; env: Map<string, Value> }
  | { type: 'VBuiltin'; name: string };
