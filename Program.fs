open System
open System.IO
open System.Text
open System.Diagnostics

type Pattern =
    | PInt of int
    | PBool of bool
    | PWildcard
    | PVar of string

type Expr =
    | Int of int
    | Bool of bool
    | StringLit of string
    | Var of string
    | ListLit of Expr list
    | BinOp of string * Expr * Expr
    | UnaryOp of string * Expr
    | IfThenElse of Expr * Expr * Expr
    | Match of Expr * (Pattern * Expr) list
    | Call of Expr * Expr list
    | Seq of Expr list
    | LetBind of string * Expr
    | While of Expr * Expr
    | ForIn of string * Expr * Expr
    | Print of Expr
    | Assign of Expr * string
    | Lazy of Expr
    | Force of Expr

type FlowDef = {
    Name: string
    Args: string list
    Body: Expr
}

type Program = {
    Flows: Map<string, FlowDef>
}

type Token =
    | TInt of int
    | TIdent of string
    | TString of string
    | TTrue
    | TFalse
    | TLParen
    | TRParen
    | TLBracket
    | TRBracket
    | TComma
    | TOp of string
    | TEOF

let private isIdentStart (c: char) = Char.IsLetter(c) || c = '_'
let private isIdentCont (c: char) = Char.IsLetterOrDigit(c) || c = '_'

let tokenize (text: string) : Token list =
    let len = text.Length
    let rec loop i acc =
        if i >= len then List.rev (TEOF :: acc)
        else
            let c = text.[i]
            if Char.IsWhiteSpace(c) then
                loop (i + 1) acc
            elif Char.IsDigit(c) then
                let mutable j = i
                while j < len && Char.IsDigit(text.[j]) do
                    j <- j + 1
                let n = text.Substring(i, j - i) |> int
                loop j (TInt n :: acc)
            elif isIdentStart c then
                let mutable j = i
                while j < len && isIdentCont(text.[j]) do
                    j <- j + 1
                let word = text.Substring(i, j - i)
                let tok =
                    match word with
                    | "true" -> TTrue
                    | "false" -> TFalse
                    | _ -> TIdent word
                loop j (tok :: acc)
            elif c = '(' then
                loop (i + 1) (TLParen :: acc)
            elif c = ')' then
                loop (i + 1) (TRParen :: acc)
            elif c = '[' then
                loop (i + 1) (TLBracket :: acc)
            elif c = ']' then
                loop (i + 1) (TRBracket :: acc)
            elif c = ',' then
                loop (i + 1) (TComma :: acc)
            elif c = '"' then
                let mutable j = i + 1
                let sb = StringBuilder()
                while j < len && text.[j] <> '"' do
                    let ch = text.[j]
                    if ch = '\\' && j + 1 < len then
                        match text.[j+1] with
                        | '"'  -> sb.Append('"')  |> ignore; j <- j + 2
                        | 'n'  -> sb.Append('\n') |> ignore; j <- j + 2
                        | 't'  -> sb.Append('\t') |> ignore; j <- j + 2
                        | '\\' -> sb.Append('\\') |> ignore; j <- j + 2
                        | c    -> sb.Append('\\') |> ignore; sb.Append(c) |> ignore; j <- j + 2
                    else
                        sb.Append(ch) |> ignore
                        j <- j + 1
                if j < len then loop (j + 1) (TString (sb.ToString()) :: acc)
                else failwith "Незакрытая строка"
            else
                let two =
                    if i + 1 < len then text.Substring(i, 2) else ""
                let op, step =
                    match two with
                    | "=="
                    | "!="
                    | "<="
                    | ">=" -> two, 2
                    | _ -> string c, 1
                match op with
                | "+"
                | "-"
                | "*"
                | "/"
                | "=="
                | "!="
                | "<"
                | ">"
                | "<="
                | ">=" -> loop (i + step) (TOp op :: acc)
                | _ -> failwithf "Неизвестный символ в выражении: '%s'" op
    loop 0 []

type ExprParser(tokens: Token list) =
    let arr = tokens |> List.toArray
    let mutable pos = 0

    member private this.Peek() = arr.[pos]

    member private this.Next() =
        let t = arr.[pos]
        pos <- pos + 1
        t

    member private this.Expect token =
        let got = this.Next()
        if got <> token then
            failwithf "Ожидался токен %A, получен %A" token got

    member private this.IsAtomStart() =
        match this.Peek() with
        | TInt _
        | TIdent _
        | TString _
        | TTrue
        | TFalse
        | TLBracket
        | TLParen -> true
        | _ -> false

    member private this.ParsePrimary() =
        match this.Next() with
        | TInt n -> Int n
        | TTrue -> Bool true
        | TFalse -> Bool false
        | TString s -> StringLit s
        | TIdent name -> Var name
        | TLBracket ->
            let items =
                if this.Peek() = TRBracket then
                    []
                else
                    let rec parseItems acc =
                        let e = this.ParseExprCore()
                        match this.Peek() with
                        | TComma ->
                            this.Next() |> ignore
                            parseItems (e :: acc)
                        | _ -> List.rev (e :: acc)
                    parseItems []
            this.Expect TRBracket
            ListLit items
        | TLParen ->
            let e = this.ParseExprCore()
            this.Expect TRParen
            e
        | t -> failwithf "Неожиданный токен в primary: %A" t

    member private this.ParseCall() =
        let rec parseCalls (f: Expr) =
            match this.Peek() with
            | TLParen ->
                this.Next() |> ignore
                let args =
                    if this.Peek() = TRParen then
                        []
                    else
                        let rec parseArgs acc =
                            let e = this.ParseExprCore()
                            match this.Peek() with
                            | TComma ->
                                this.Next() |> ignore
                                parseArgs (e :: acc)
                            | _ -> List.rev (e :: acc)
                        parseArgs []
                this.Expect TRParen
                parseCalls (Call(f, args))
            | _ when this.IsAtomStart() ->
                // Поддержка применения функции через пробел: fact (n - 1)
                let arg = this.ParsePrimary()
                parseCalls (Call(f, [ arg ]))
            | _ -> f
        this.ParsePrimary() |> parseCalls

    member private this.ParseUnary() =
        match this.Peek() with
        | TOp "-" ->
            this.Next() |> ignore
            UnaryOp("-", this.ParseUnary())
        | TIdent "lazy" ->
            this.Next() |> ignore
            Lazy(this.ParseUnary())
        | TIdent "force" ->
            this.Next() |> ignore
            Force(this.ParseUnary())
        | _ -> this.ParseCall()

    member private this.ParseMul() =
        let rec loop left =
            match this.Peek() with
            | TOp "*"
            | TOp "/" as t ->
                let op =
                    match t with
                    | TOp s -> s
                    | _ -> failwith "unreachable"
                this.Next() |> ignore
                let right = this.ParseUnary()
                loop (BinOp(op, left, right))
            | _ -> left
        this.ParseUnary() |> loop

    member private this.ParseAdd() =
        let rec loop left =
            match this.Peek() with
            | TOp "+"
            | TOp "-" as t ->
                let op =
                    match t with
                    | TOp s -> s
                    | _ -> failwith "unreachable"
                this.Next() |> ignore
                let right = this.ParseMul()
                loop (BinOp(op, left, right))
            | _ -> left
        this.ParseMul() |> loop

    member private this.ParseCmp() =
        let left = this.ParseAdd()
        match this.Peek() with
        | TOp "=="
        | TOp "!="
        | TOp "<"
        | TOp ">"
        | TOp "<="
        | TOp ">=" as t ->
            let op =
                match t with
                | TOp s -> s
                | _ -> failwith "unreachable"
            this.Next() |> ignore
            let right = this.ParseAdd()
            BinOp(op, left, right)
        | _ -> left

    member this.ParseExprCore() = this.ParseCmp()

    member this.ParseExpr() =
        let expr = this.ParseExprCore()
        match this.Peek() with
        | TEOF -> expr
        | t -> failwithf "Лишний токен в конце выражения: %A" t

let parseExpr (text: string) : Expr =
    ExprParser(tokenize text).ParseExpr()

let private parsePattern (raw: string) =
    let s = raw.Trim()
    match s with
    | "_" -> PWildcard
    | "true" -> PBool true
    | "false" -> PBool false
    | _ ->
        match Int32.TryParse(s) with
        | true, n -> PInt n
        | _ -> PVar s

let private splitArrow (line: string) =
    let idx = line.LastIndexOf("->", StringComparison.Ordinal)
    if idx < 0 then None
    else
        let left = line.Substring(0, idx).TrimEnd()
        let right = line.Substring(idx + 2).TrimStart()
        Some(left, right)

let private parseWhenElseBlock (lines: string list) =
    let whenLine = lines |> List.find (fun l -> l.TrimStart().StartsWith("when "))
    let elseLine = lines |> List.find (fun l -> l.TrimStart().StartsWith("else "))

    let whenTrim = whenLine.Trim()
    let elseTrim = elseLine.Trim()

    let whenYieldIdx = whenTrim.IndexOf(" yield ", StringComparison.Ordinal)
    if whenYieldIdx < 0 then
        failwith "В строке when ожидается 'yield'"

    let condRaw = whenTrim.Substring("when ".Length, whenYieldIdx - "when ".Length).Trim()
    let thenRaw = whenTrim.Substring(whenYieldIdx + " yield ".Length).Trim()

    let elseYieldPrefix = "else yield "
    if not (elseTrim.StartsWith(elseYieldPrefix)) then
        failwith "В строке else ожидается формат 'else yield ...'"
    let elseRaw = elseTrim.Substring(elseYieldPrefix.Length).Trim()

    IfThenElse(parseExpr condRaw, parseExpr thenRaw, parseExpr elseRaw)

let private blockExpr (exprs: Expr list) =
    match exprs with
    | [] -> failwith "Пустой блок"
    | [ one ] -> one
    | many -> Seq many

let private isNoiseLine (line: string) =
    let t = line.Trim()
    t = "" || t = ";" || t.StartsWith("--") || t.StartsWith("//")

let private isBlockStarter (trimmed: string) =
    trimmed.StartsWith("when ")
    || trimmed.StartsWith("while ")
    || trimmed.StartsWith("for ")
    || trimmed.StartsWith("match ")
    || trimmed.StartsWith("let ")
    || trimmed.StartsWith("print ")

let private parseSingleLineExpr (trimmed: string) =
    if trimmed.StartsWith("let ") then
        let body = trimmed.Substring("let ".Length).Trim()
        let idx = body.IndexOf('=')
        if idx < 0 then failwith "Ожидался формат: let name = expr"
        let name = body.Substring(0, idx).Trim()
        let rhs = body.Substring(idx + 1).Trim()
        if name = "" || rhs = "" then failwith "Невалидный let"
        LetBind(name, parseExpr rhs)
    elif trimmed.StartsWith("print ") then
        let raw = trimmed.Substring("print ".Length).Trim()
        if raw = "" then failwith "Ожидался аргумент для print"
        Print(parseExpr raw)
    elif trimmed.EndsWith("++") then
        let name = trimmed.Substring(0, trimmed.Length - 2).Trim()
        if name = "" then failwith "Невалидный инкремент: i++"
        Assign(BinOp("+", Var name, Int 1), name)
    elif trimmed.Contains("+=") then
        let idx = trimmed.IndexOf("+=", StringComparison.Ordinal)
        let name = trimmed.Substring(0, idx).Trim()
        let rhsRaw = trimmed.Substring(idx + 2).Trim()
        if name = "" || rhsRaw = "" then
            failwith "Невалидный формат: i += expr"
        Assign(BinOp("+", Var name, parseExpr rhsRaw), name)
    else
        match splitArrow trimmed with
        | Some (exprRaw, name) when exprRaw <> "" -> Assign(parseExpr exprRaw, name)
        | _ -> parseExpr trimmed

let rec private parseBlock (lines: string[]) (startIdx: int) (terminators: Set<string>) : Expr list * int * string option =
    let nextNonNoise i0 =
        let rec find i =
            if i >= lines.Length then i
            elif isNoiseLine lines.[i] then find (i + 1)
            else i
        find i0

    let parseBracedBody openIdx =
        let i0 = nextNonNoise openIdx
        if i0 >= lines.Length || lines.[i0].Trim() <> "{" then
            failwith "Ожидалась '{'"
        let exprs, nextIdx, term = parseBlock lines (i0 + 1) (set [ "}" ])
        match term with
        | Some "}" -> exprs, nextIdx
        | _ -> failwith "Незакрытый блок '{ ... }'"

    let rec loop idx acc =
        let i = nextNonNoise idx
        if i >= lines.Length then
            List.rev acc, i, None
        else
            let t = lines.[i].Trim()
            if terminators.Contains t then
                List.rev acc, (i + 1), Some t
            elif t = "{" then
                loop (i + 1) acc
            elif t = ";" then
                loop (i + 1) acc
            elif t.StartsWith("when ") && t.Contains(" yield ") then
                let nextI = nextNonNoise (i + 1)
                if nextI >= lines.Length then failwith "После when ... yield ... ожидается else yield ..."
                let expr = parseWhenElseBlock [ t; lines.[nextI].Trim() ]
                loop (nextI + 1) (expr :: acc)
            elif t.StartsWith("when ") then
                let condRaw = t.Substring("when ".Length).Trim()
                let bodyStart = nextNonNoise (i + 1)
                if bodyStart < lines.Length && lines.[bodyStart].Trim() = "{" then
                    let thenExprs, afterThen = parseBracedBody bodyStart
                    let maybeElse = nextNonNoise afterThen
                    if maybeElse < lines.Length && lines.[maybeElse].Trim() = "else" then
                        let elseStart = nextNonNoise (maybeElse + 1)
                        if elseStart < lines.Length && lines.[elseStart].Trim() = "{" then
                            let elseExprs, afterElse = parseBracedBody elseStart
                            let ifExpr = IfThenElse(parseExpr condRaw, blockExpr thenExprs, blockExpr elseExprs)
                            loop afterElse (ifExpr :: acc)
                        else
                            failwith "После else ожидается блок '{ ... }'"
                    else
                        let ifExpr = IfThenElse(parseExpr condRaw, blockExpr thenExprs, Bool false)
                        loop afterThen (ifExpr :: acc)
                else
                    let thenExprs, nextIdx, term = parseBlock lines (i + 1) (set [ "else"; "end" ])
                    match term with
                    | Some "else" ->
                        let elseExprs, afterElseIdx, endTerm = parseBlock lines nextIdx (set [ "end" ])
                        match endTerm with
                        | Some "end" ->
                            let ifExpr = IfThenElse(parseExpr condRaw, blockExpr thenExprs, blockExpr elseExprs)
                            loop afterElseIdx (ifExpr :: acc)
                        | _ -> failwith "Для when ... else ... ожидается end"
                    | Some "end" ->
                        let ifExpr = IfThenElse(parseExpr condRaw, blockExpr thenExprs, Bool false)
                        loop nextIdx (ifExpr :: acc)
                    | _ -> failwith "Незакрытый when-блок"
            elif t.StartsWith("while ") then
                let condRaw = t.Substring("while ".Length).Trim()
                let bodyStart = nextNonNoise (i + 1)
                if bodyStart < lines.Length && lines.[bodyStart].Trim() = "{" then
                    let bodyExprs, nextIdx = parseBracedBody bodyStart
                    loop nextIdx (While(parseExpr condRaw, blockExpr bodyExprs) :: acc)
                else
                    let bodyExprs, nextIdx, term = parseBlock lines (i + 1) (set [ "end" ])
                    match term with
                    | Some "end" -> loop nextIdx (While(parseExpr condRaw, blockExpr bodyExprs) :: acc)
                    | _ -> failwith "Для while ожидается end"
            elif t.StartsWith("for ") then
                let rest = t.Substring("for ".Length).Trim()
                let useIdx = rest.IndexOf(" use ", StringComparison.Ordinal)
                let varName, iterableRaw =
                    if useIdx >= 0 then
                        let arrRaw = rest.Substring(0, useIdx).Trim()
                        let itemName = rest.Substring(useIdx + 5).Trim()
                        itemName, arrRaw
                    else
                        let inIdx = rest.IndexOf(" in ", StringComparison.Ordinal)
                        if inIdx < 0 then failwith "Ожидался формат: for <array> use <item>"
                        let itemName = rest.Substring(0, inIdx).Trim()
                        let arrRaw = rest.Substring(inIdx + 4).Trim()
                        itemName, arrRaw
                if varName = "" || iterableRaw = "" then failwith "Невалидный for"

                let bodyStart = nextNonNoise (i + 1)
                if bodyStart < lines.Length && lines.[bodyStart].Trim() = "{" then
                    let bodyExprs, nextIdx = parseBracedBody bodyStart
                    loop nextIdx (ForIn(varName, parseExpr iterableRaw, blockExpr bodyExprs) :: acc)
                else
                    let bodyExprs, nextIdx, term = parseBlock lines (i + 1) (set [ "end" ])
                    match term with
                    | Some "end" -> loop nextIdx (ForIn(varName, parseExpr iterableRaw, blockExpr bodyExprs) :: acc)
                    | _ -> failwith "Для for ожидается end"
            elif t.StartsWith("match ") then
                let targetRaw = t.Substring("match ".Length).Trim()
                let mutable j = nextNonNoise (i + 1)
                let cases = ResizeArray<Pattern * Expr>()

                if j < lines.Length && lines.[j].Trim() = "{" then
                    j <- j + 1
                    let mutable doneCases = false
                    while j < lines.Length && not doneCases do
                        let k = nextNonNoise j
                        if k >= lines.Length then failwith "Незакрытый match-блок"
                        let ct = lines.[k].Trim()
                        if ct = "}" then
                            j <- k + 1
                            doneCases <- true
                        elif ct = ";" then
                            j <- k + 1
                        else
                            match splitArrow ct with
                            | Some (patRaw, exprRaw) ->
                                cases.Add(parsePattern patRaw, parseExpr exprRaw)
                                j <- k + 1
                            | None -> failwithf "Невалидная строка case в match: %s" ct
                else
                    let mutable shouldContinue = true
                    while j < lines.Length && shouldContinue do
                        let ct = lines.[j].Trim()
                        if isNoiseLine lines.[j] then
                            j <- j + 1
                        elif ct = "end" then
                            j <- j + 1
                            shouldContinue <- false
                        elif isBlockStarter ct then
                            shouldContinue <- false
                        else
                            match splitArrow ct with
                            | Some (patRaw, exprRaw) ->
                                cases.Add(parsePattern patRaw, parseExpr exprRaw)
                                j <- j + 1
                            | None -> shouldContinue <- false

                if cases.Count = 0 then failwith "У match должен быть хотя бы один case"
                let matchExpr = Match(parseExpr targetRaw, cases |> Seq.toList)
                loop j (matchExpr :: acc)
            else
                loop (i + 1) (parseSingleLineExpr t :: acc)

    loop startIdx []

let rec private parseBody (bodyLines: string list) : Expr =
    let arr = bodyLines |> List.toArray
    let exprs, _, _ = parseBlock arr 0 Set.empty
    blockExpr exprs

let private normalizeSourceLines (source: string) : string list =
    let s = source.Replace("\r\n", "\n")
    let lines = s.Split('\n')
    let out = ResizeArray<string>()

    for line in lines do
        let t = line.TrimStart()
        if t.StartsWith("--") || t.StartsWith("//") then
            out.Add(line)
        else
            let sb = Text.StringBuilder(line.Length * 2)
            for ch in line do
                match ch with
                | '{'
                | '}'
                | ';' ->
                    sb.Append('\n') |> ignore
                    sb.Append(ch) |> ignore
                    sb.Append('\n') |> ignore
                | _ -> sb.Append(ch) |> ignore
            out.AddRange(sb.ToString().Split('\n'))

    out |> Seq.toList

let parseProgram (source: string) : Program =
    let lines = normalizeSourceLines source

    let rec collect idx acc =
        if idx >= lines.Length then
            List.rev acc
        else
            let line = lines.[idx]
            let trimmed = line.Trim()
            if trimmed = "" || trimmed.StartsWith("--") || trimmed.StartsWith("//") then
                collect (idx + 1) acc
            elif trimmed.StartsWith("flow ") then
                let parts = trimmed.Split([| ' ' |], StringSplitOptions.RemoveEmptyEntries) |> Array.toList
                let name = parts.[1]
                let args = parts |> List.skip 2

                let nextNonNoise i0 =
                    let mutable k = i0
                    while k < lines.Length && isNoiseLine lines.[k] do
                        k <- k + 1
                    k

                let mutable j = nextNonNoise (idx + 1)
                let body = ResizeArray<string>()

                if j < lines.Length && lines.[j].Trim() = "{" then
                    let mutable depth = 1
                    j <- j + 1
                    while j < lines.Length && depth > 0 do
                        let t = lines.[j].Trim()
                        if t = "{" then
                            depth <- depth + 1
                            body.Add(lines.[j])
                        elif t = "}" then
                            depth <- depth - 1
                            if depth > 0 then body.Add(lines.[j])
                        else
                            body.Add(lines.[j])
                        j <- j + 1
                    if depth <> 0 then failwithf "Незакрытый блок flow '%s'" name
                else
                    while j < lines.Length && not (lines.[j].Trim().StartsWith("flow ")) do
                        body.Add(lines.[j])
                        j <- j + 1

                if body.Count = 0 then
                    failwithf "flow '%s' должен иметь тело" name

                let def = {
                    Name = name
                    Args = args
                    Body = parseBody (body |> Seq.toList)
                }
                collect j (def :: acc)
            else
                failwithf "Ожидалось 'flow ...', получено: %s" line

    let defs = collect 0 []
    let map = defs |> List.map (fun d -> d.Name, d) |> Map.ofList
    { Flows = map }

type Value =
    | VInt of int
    | VBool of bool
    | VString of string
    | VList of Value list
    | VClosure of string list * Expr * Map<string, Value>
    | VBuiltin of (Value list -> Value)
    | VLazy of Expr * Map<string, Value> * ref<Value option>

let rec valueToString = function
    | VInt n -> string n
    | VBool b -> if b then "true" else "false"
    | VString s -> s
    | VList xs ->
        xs
        |> List.map valueToString
        |> String.concat ", "
        |> sprintf "[%s]"
    | VClosure _ -> "<function>"
    | VBuiltin _ -> "<builtin>"
    | VLazy _ -> "<lazy>"

let rec valueEquals v1 v2 =
    match v1, v2 with
    | VInt a, VInt b -> a = b
    | VBool a, VBool b -> a = b
    | VString a, VString b -> a = b
    | VList a, VList b -> 
        if List.length a = List.length b then
            List.forall2 valueEquals a b
        else false
    | _ -> false

let private expectInt = function
    | VInt n -> n
    | v -> failwithf "Ожидался int, получено: %s" (valueToString v)

let private expectBool = function
    | VBool b -> b
    | v -> failwithf "Ожидался bool, получено: %s" (valueToString v)

let private expectList = function
    | VList xs -> xs
    | v -> failwithf "Ожидался list, получено: %s" (valueToString v)

let private expectString = function
    | VString s -> s
    | v -> failwithf "Ожидалась строка, получено: %s" (valueToString v)

let rec eval (program: Program) (env: Map<string, Value>) (expr: Expr) : Value * Map<string, Value> =
    let resolveVar name =
        match env.TryFind name with
        | Some v -> v, env
        | None ->
            match program.Flows.TryFind name with
            | Some def -> VClosure(def.Args, def.Body, env), env
            | None -> failwithf "Неизвестное имя: %s" name

    let apply fnVal argVals =
        let rec applyMany f args =
            match f, args with
            | VBuiltin fn, _ ->
                if List.length args = 0 then f else fn args
            | VClosure(par :: rest, body, closureEnv), arg :: tail ->
                let nextEnv = closureEnv.Add(par, arg)
                if List.isEmpty rest then
                    let result, _ = eval program nextEnv body
                    if List.isEmpty tail then result else applyMany result tail
                else
                    applyMany (VClosure(rest, body, nextEnv)) tail
            | VClosure([], body, closureEnv), _ ->
                let result, _ = eval program closureEnv body
                applyMany result args
            | _, [] -> f
            | _ -> failwith "Попытка применить не-функцию"
        applyMany fnVal argVals

    let matchPattern v p =
        match p, v with
        | PWildcard, _ -> Some Map.empty
        | PInt a, VInt b when a = b -> Some Map.empty
        | PBool a, VBool b when a = b -> Some Map.empty
        | PVar name, value -> Some(Map.empty.Add(name, value))
        | _ -> None

    let rec evalMany (stateEnv: Map<string, Value>) (items: Expr list) (acc: Value list) =
        match items with
        | [] -> List.rev acc, stateEnv
        | h :: t ->
            let v, nextEnv = eval program stateEnv h
            evalMany nextEnv t (v :: acc)

    match expr with
    | Int n -> VInt n, env
    | Bool b -> VBool b, env
    | StringLit s -> VString s, env
    | Var name -> resolveVar name
    | Lazy e -> VLazy(e, env, ref None), env
    | Force e ->
        let v, env1 = eval program env e
        match v with
        | VLazy(innerExpr, lazyEnv, cache) ->
            match cache.Value with
            | Some computed -> computed, env1
            | None ->
                let rv, _ = eval program lazyEnv innerExpr
                cache.Value <- Some rv
                rv, env1
        | _ -> v, env1
    | ListLit items ->
        let values, nextEnv = evalMany env items []
        VList values, nextEnv
    | UnaryOp("-", x) ->
        let xv, env1 = eval program env x
        VInt((~-) (expectInt xv)), env1
    | UnaryOp(op, _) -> failwithf "Неизвестный унарный оператор: %s" op
    | BinOp(op, l, r) ->
        let lv, env1 = eval program env l
        let rv, env2 = eval program env1 r
        let out =
            match op with
            | "+" ->
                match lv, rv with
                | VInt a, VInt b     -> VInt(a + b)
                | VString a, VString b -> VString(a + b)
                | _ -> failwithf "Оператор '+' поддерживает int+int или string+string, получено: %s и %s" (valueToString lv) (valueToString rv)
            | "-" -> VInt(expectInt lv - expectInt rv)
            | "*" -> VInt(expectInt lv * expectInt rv)
            | "/" -> VInt(expectInt lv / expectInt rv)
            | "==" -> VBool(valueEquals lv rv)
            | "!=" -> VBool(not (valueEquals lv rv))
            | "<" -> VBool(expectInt lv < expectInt rv)
            | ">" -> VBool(expectInt lv > expectInt rv)
            | "<=" -> VBool(expectInt lv <= expectInt rv)
            | ">=" -> VBool(expectInt lv >= expectInt rv)
            | _ -> failwithf "Неизвестный бинарный оператор: %s" op
        out, env2
    | LetBind(name, rhs) ->
        let value, env1 = eval program env rhs
        value, env1.Add(name, value)
    | Seq exprs ->
        let rec loop stateEnv remaining last =
            match remaining with
            | [] -> last, stateEnv
            | h :: t ->
                let value, nextEnv = eval program stateEnv h
                loop nextEnv t value
        loop env exprs (VBool false)
    | Print inner ->
        let v, env1 = eval program env inner
        printfn "%s" (valueToString v)
        v, env1
    | While(cond, body) ->
        let rec run stateEnv lastValue =
            let cv, envAfterCond = eval program stateEnv cond
            if expectBool cv then
                let bv, envAfterBody = eval program envAfterCond body
                run envAfterBody bv
            else
                lastValue, envAfterCond
        run env (VBool false)
    | ForIn(varName, iterable, body) ->
        let iterVal, env1 = eval program env iterable
        let items = expectList iterVal
        let rec run (stateEnv: Map<string, Value>) (values: Value list) (lastValue: Value) =
            match values with
            | [] -> lastValue, stateEnv
            | x :: xs ->
                let scoped = stateEnv.Add(varName, x)
                let bv, envAfterBody = eval program scoped body
                run envAfterBody xs bv
        run env1 items (VBool false)
    | IfThenElse(cond, tBranch, eBranch) ->
        let condValue, env1 = eval program env cond
        if expectBool condValue then
            eval program env1 tBranch
        else
            eval program env1 eBranch
    | Match(target, cases) ->
        let tv, env1 = eval program env target
        let rec loop = function
            | [] -> failwith "match не нашел подходящий case"
            | (pat, body) :: tail ->
                match matchPattern tv pat with
                | Some binds ->
                    let merged = Map.fold (fun st k v -> Map.add k v st) env1 binds
                    eval program merged body
                | None -> loop tail
        loop cases
    | Call(fnExpr, args) ->
        let fnVal, env1 = eval program env fnExpr
        let argVals, env2 = evalMany env1 args []
        apply fnVal argVals, env2
    | Assign(inner, name) ->
        let v, env1 = eval program env inner
        v, env1.Add(name, v)

// ──────────── Chart generation ────────────

let private htmlEscape (s: string) =
    s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")

let private openInBrowser (path: string) =
    try
        let psi = ProcessStartInfo(path, UseShellExecute = true)
        Process.Start(psi) |> ignore
    with _ ->
        printfn "[HypeLang] График сохранён: %s" path

let private saveTempHtml (suffix: string) (html: string) =
    let name = sprintf "hypelang_%s_%d.html" suffix (abs (DateTime.Now.Ticks % 1000000L))
    let path = Path.Combine(Path.GetTempPath(), name)
    File.WriteAllText(path, html)
    path

let private lineChartHtml (title: string) (xsOpt: int list option) (ys: int list) =
    let n = ys.Length
    if n = 0 then failwith "plot: список данных пуст"
    let w, h = 840, 500
    let pl, pr, pt, pb = 75, 35, 50, 65
    let cw, ch = w - pl - pr, h - pt - pb

    let minY = List.min ys
    let maxY = List.max ys
    let rangeY = max 1 (maxY - minY)
    let pad = rangeY / 10
    let yLo = minY - pad
    let yHi = maxY + pad
    let ySpan = max 1 (yHi - yLo)

    let toX i =
        if n = 1 then pl + cw / 2
        else
            match xsOpt with
            | Some xs ->
                let xMin = List.min xs
                let xMax = List.max xs
                let xSpan = max 1 (xMax - xMin)
                pl + (xs.[i] - xMin) * cw / xSpan
            | None -> pl + i * cw / (n - 1)

    let toY v = pt + ch - (v - yLo) * ch / ySpan

    let gridLines =
        List.init 5 (fun i ->
            let frac = float i / 4.0
            let y = pt + int (float ch * frac)
            let v = yHi - int (float ySpan * frac)
            sprintf
                "<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#eee' stroke-width='1'/>\n\
                 <text x='%d' y='%d' text-anchor='end' font-size='12' fill='#999' font-family='sans-serif'>%d</text>"
                pl y (w - pr) y (pl - 8) (y + 4) v)
        |> String.concat "\n"

    let polyPoints =
        ys |> List.mapi (fun i v -> sprintf "%d,%d" (toX i) (toY v)) |> String.concat " "

    let circles =
        if n <= 300 then
            ys
            |> List.mapi (fun i v ->
                sprintf "<circle cx='%d' cy='%d' r='4' fill='#1976D2' stroke='white' stroke-width='2'/>" (toX i) (toY v))
            |> String.concat "\n"
        else ""

    let xStep = max 1 (n / 15)
    let xLabels =
        ys
        |> List.mapi (fun i _ ->
            if i % xStep = 0 || i = n - 1 then
                let lbl =
                    match xsOpt with
                    | Some xs -> string xs.[i]
                    | None    -> string (i + 1)
                sprintf
                    "<text x='%d' y='%d' text-anchor='middle' font-size='11' fill='#999' font-family='sans-serif'>%s</text>"
                    (toX i) (h - pb + 20) lbl
            else "")
        |> String.concat "\n"

    sprintf
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>%s</title>\
<style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5}\
svg{background:white;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.13)}</style></head><body>\n\
<svg width='%d' height='%d' xmlns='http://www.w3.org/2000/svg'>\n\
<text x='%d' y='33' text-anchor='middle' font-size='17' font-weight='bold' font-family='sans-serif' fill='#222'>%s</text>\n\
%s\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
<polyline points='%s' fill='none' stroke='#1976D2' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'/>\n\
%s\n%s\n\
</svg></body></html>"
        (htmlEscape title) w h (w / 2) (htmlEscape title)
        gridLines
        pl pt pl (h - pb)
        pl (h - pb) (w - pr) (h - pb)
        polyPoints circles xLabels

let private barChartHtml (title: string) (labels: string list) (ys: int list) =
    let n = ys.Length
    if n = 0 then failwith "barChart: список данных пуст"
    let w, h = 840, 500
    let pl, pr, pt, pb = 75, 35, 50, 75
    let cw, ch = w - pl - pr, h - pt - pb

    let maxY = max 0 (List.max ys)
    let minY = min 0 (List.min ys)
    let range = max 1 (maxY - minY)
    let yHi = maxY + range / 8
    let yLo = minY - range / 8
    let ySpan = max 1 (yHi - yLo)

    let toY v = pt + ch - (v - yLo) * ch / ySpan
    let zeroY = toY 0

    let colors =
        [| "#1976D2"; "#43A047"; "#E53935"; "#FB8C00"; "#7B1FA2"; "#00838F"; "#F4511E"; "#546E7A" |]

    let gap  = cw / n
    let barW = max 6 (gap * 6 / 10)

    let gridLines =
        List.init 5 (fun i ->
            let frac = float i / 4.0
            let y = pt + int (float ch * frac)
            let v = yHi - int (float ySpan * frac)
            sprintf
                "<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#eee' stroke-width='1'/>\n\
                 <text x='%d' y='%d' text-anchor='end' font-size='12' fill='#999' font-family='sans-serif'>%d</text>"
                pl y (w - pr) y (pl - 8) (y + 4) v)
        |> String.concat "\n"

    let bars =
        List.zip labels ys
        |> List.mapi (fun i (lbl, v) ->
            let x     = pl + i * gap + gap / 2 - barW / 2
            let barTop = min (toY v) zeroY
            let barH   = max 2 (abs (toY v - zeroY))
            let col    = colors.[i % colors.Length]
            sprintf
                "<rect x='%d' y='%d' width='%d' height='%d' fill='%s' rx='3' opacity='.88'/>\n\
                 <text x='%d' y='%d' text-anchor='middle' font-size='11' fill='#777' font-family='sans-serif'>%s</text>"
                x barTop barW barH col
                (x + barW / 2) (h - pb + 20) (htmlEscape lbl))
        |> String.concat "\n"

    sprintf
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>%s</title>\
<style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5}\
svg{background:white;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.13)}</style></head><body>\n\
<svg width='%d' height='%d' xmlns='http://www.w3.org/2000/svg'>\n\
<text x='%d' y='33' text-anchor='middle' font-size='17' font-weight='bold' font-family='sans-serif' fill='#222'>%s</text>\n\
%s\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#ccc' stroke-width='1' stroke-dasharray='4,3'/>\n\
%s\n\
</svg></body></html>"
        (htmlEscape title) w h (w / 2) (htmlEscape title)
        gridLines
        pl pt pl (h - pb)
        pl (h - pb) (w - pr) (h - pb)
        pl zeroY (w - pr) zeroY
        bars

let private scatterHtml (title: string) (xVals: int list) (yVals: int list) =
    let n = xVals.Length
    if n = 0 then failwith "scatter: пустые списки"
    if n <> yVals.Length then failwith "scatter: списки X и Y должны быть одинаковой длины"
    let w, h = 840, 500
    let pl, pr, pt, pb = 75, 35, 50, 65
    let cw, ch = w - pl - pr, h - pt - pb

    let xMin = List.min xVals
    let xMax = List.max xVals
    let yMin = List.min yVals
    let yMax = List.max yVals
    let xRange = max 1 (xMax - xMin)
    let yRange = max 1 (yMax - yMin)
    let xLo = xMin - xRange / 10
    let xHi = xMax + xRange / 10
    let yLo = yMin - yRange / 10
    let yHi = yMax + yRange / 10
    let xSpan = max 1 (xHi - xLo)
    let ySpan = max 1 (yHi - yLo)

    let toX v = pl + (v - xLo) * cw / xSpan
    let toY v = pt + ch - (v - yLo) * ch / ySpan

    let gridH =
        List.init 5 (fun i ->
            let frac = float i / 4.0
            let y = pt + int (float ch * frac)
            let v = yHi - int (float ySpan * frac)
            sprintf
                "<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#eee' stroke-width='1'/>\n\
                 <text x='%d' y='%d' text-anchor='end' font-size='12' fill='#999' font-family='sans-serif'>%d</text>"
                pl y (w - pr) y (pl - 8) (y + 4) v)
        |> String.concat "\n"

    let gridV =
        List.init 5 (fun i ->
            let frac = float i / 4.0
            let x = pl + int (float cw * frac)
            let v = xLo + int (float xSpan * frac)
            sprintf
                "<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#eee' stroke-width='1'/>\n\
                 <text x='%d' y='%d' text-anchor='middle' font-size='12' fill='#999' font-family='sans-serif'>%d</text>"
                x pt x (h - pb) x (h - pb + 18) v)
        |> String.concat "\n"

    let dots =
        List.zip xVals yVals
        |> List.map (fun (xv, yv) ->
            sprintf
                "<circle cx='%d' cy='%d' r='5' fill='#1976D2' opacity='.72' stroke='white' stroke-width='1.5'/>"
                (toX xv) (toY yv))
        |> String.concat "\n"

    sprintf
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>%s</title>\
<style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5}\
svg{background:white;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.13)}</style></head><body>\n\
<svg width='%d' height='%d' xmlns='http://www.w3.org/2000/svg'>\n\
<text x='%d' y='33' text-anchor='middle' font-size='17' font-weight='bold' font-family='sans-serif' fill='#222'>%s</text>\n\
%s\n%s\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='#bbb' stroke-width='1.5'/>\n\
%s\n\
</svg></body></html>"
        (htmlEscape title) w h (w / 2) (htmlEscape title)
        gridH gridV
        pl pt pl (h - pb)
        pl (h - pb) (w - pr) (h - pb)
        dots

let rec private assignedNameOf = function
    | Assign(_, name) -> Some name
    | Seq exprs -> exprs |> List.tryLast |> Option.bind assignedNameOf
    | _ -> None

let runProgram (program: Program) =
    let preludeEnv =
        Map.ofList [
            "readFile", VBuiltin (function
                | [VString path] -> VString (File.ReadAllText path)
                | _ -> failwith "readFile ожидает 1 аргумент: string")
            "writeFile", VBuiltin (function
                | [VString path; VString content] ->
                    File.WriteAllText(path, content)
                    VBool true
                | _ -> failwith "writeFile ожидает 2 аргумента: string, string")
            "len", VBuiltin (function
                | [VList xs] -> VInt xs.Length
                | [VString s] -> VInt s.Length
                | _ -> failwith "len ожидает list или string")
            "head", VBuiltin (function
                | [VList (x::_)] -> x
                | _ -> failwith "head ожидает непустой list")
            "tail", VBuiltin (function
                | [VList (_::xs)] -> VList xs
                | _ -> failwith "tail ожидает непустой list")
            "push", VBuiltin (function
                | [VList xs; v] -> VList (xs @ [v])
                | _ -> failwith "push ожидает list и элемент")
            "map", VBuiltin (fun args ->
                match args with
                | [f; VList xs] ->
                    let rec applyMany func ag =
                        match func, ag with
                        | VBuiltin bn, _ -> bn ag
                        | VClosure([par], body, cEnv), [arg] ->
                            fst (eval program (cEnv.Add(par, arg)) body)
                        | VClosure _, _ -> failwith "map поддерживает только функции с 1 аргументом"
                        | _ -> failwith "map ожидает функцию"
                    VList (xs |> List.map (fun x -> applyMany f [x]))
                | _ -> failwith "map ожидает функцию и список")
            "reduce", VBuiltin (fun args ->
                match args with
                | [f; VList (x::xs)] ->
                    let rec applyMany func ag =
                        match func, ag with
                        | VBuiltin bn, _ -> bn ag
                        | VClosure([p1; p2], body, cEnv), [a1; a2] ->
                            fst (eval program (cEnv.Add(p1, a1).Add(p2, a2)) body)
                        | VClosure _, _ -> failwith "reduce поддерживает только функции с 2 аргументами"
                        | _ -> failwith "reduce ожидает функцию"
                    xs |> List.fold (fun acc cur -> applyMany f [acc; cur]) x
                | _ -> failwith "reduce ожидает функцию и непустой список")

            // ── Charts ──────────────────────────────────────────────────────────
            "plot", VBuiltin (fun args ->
                match args with
                | [VList ys; VString title] ->
                    let vals =
                        ys |> List.map (function
                            | VInt n -> n
                            | v -> failwithf "plot: ожидается int, получено %s" (valueToString v))
                    let html = lineChartHtml title None vals
                    let path = saveTempHtml "line" html
                    printfn "[HypeLang] График открыт: %s" path
                    openInBrowser path
                    VBool true
                | _ -> failwith "plot(values, title): ожидается list и string")

            "plotXY", VBuiltin (fun args ->
                match args with
                | [VList xs; VList ys; VString title] ->
                    let toInts lbl lst =
                        lst |> List.map (function
                            | VInt n -> n
                            | v -> failwithf "plotXY %s: ожидается int, получено %s" lbl (valueToString v))
                    let xVals = toInts "X" xs
                    let yVals = toInts "Y" ys
                    if xVals.Length <> yVals.Length then
                        failwith "plotXY: списки X и Y должны быть одинаковой длины"
                    let html = lineChartHtml title (Some xVals) yVals
                    let path = saveTempHtml "linexy" html
                    printfn "[HypeLang] График открыт: %s" path
                    openInBrowser path
                    VBool true
                | _ -> failwith "plotXY(xValues, yValues, title): ожидается два list и string")

            "barChart", VBuiltin (fun args ->
                match args with
                | [VList lbls; VList ys; VString title] ->
                    let labels = lbls |> List.map valueToString
                    let vals =
                        ys |> List.map (function
                            | VInt n -> n
                            | v -> failwithf "barChart: ожидается int, получено %s" (valueToString v))
                    let html = barChartHtml title labels vals
                    let path = saveTempHtml "bar" html
                    printfn "[HypeLang] График открыт: %s" path
                    openInBrowser path
                    VBool true
                | _ -> failwith "barChart(labels, values, title): ожидается два list и string")

            "scatter", VBuiltin (fun args ->
                match args with
                | [VList xs; VList ys; VString title] ->
                    let toInts lbl lst =
                        lst |> List.map (function
                            | VInt n -> n
                            | v -> failwithf "scatter %s: ожидается int, получено %s" lbl (valueToString v))
                    let xVals = toInts "X" xs
                    let yVals = toInts "Y" ys
                    let html = scatterHtml title xVals yVals
                    let path = saveTempHtml "scatter" html
                    printfn "[HypeLang] График открыт: %s" path
                    openInBrowser path
                    VBool true
                | _ -> failwith "scatter(xValues, yValues, title): ожидается два list и string")
        ]

    match program.Flows.TryFind "main" with
    | None -> failwith "Требуется flow main"
    | Some main ->
        if not (List.isEmpty main.Args) then
            failwith "flow main должен быть без аргументов"

        let value, _ = eval program preludeEnv main.Body
        match assignedNameOf main.Body with
        | Some name -> printfn "%s = %s" name (valueToString value)
        | None -> printfn "%s" (valueToString value)

[<EntryPoint>]
let main argv =
    try
        let scriptPath =
            if argv.Length > 0 then argv.[0]
            else Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "examples", "factorial.hypelang")

        let fullPath = Path.GetFullPath(scriptPath)
        if not (File.Exists fullPath) then
            failwithf "Файл не найден: %s" fullPath

        let source = File.ReadAllText(fullPath)
        let program = parseProgram source
        runProgram program
        0
    with ex ->
        eprintfn "Ошибка: %s" ex.Message
        1
