# HypeLang

HypeLang is an interpreted programming language designed for data processing, flow-based script orchestrations, and interactive chart plotting. It features a robust type system, pattern matching, pure evaluations, functional paradigms, and built-in plotting capacities right out of the box.

## Features

- **Purity and Mutability:** Clear distinction between let-bindings (immutable by default) and mutable assignments.
- **Pattern Matching:** Advanced matching over primitives, strings, booleans, and wildcard patterns using `match ... { when ... yield ... }` construct.
- **Lazy Evaluation:** Primitives like `lazy` and `force` explicitly control evaluation deferral, helpful with costly computations.
- **Flow Definitions:** Use declarative top-level `flow` definitions to orchestrate execution, instead of standard function structures, maximizing readability in scripting data pipelines.
- **Rich Built-Ins:** Extensive list manipulation `head`, `tail`, `cons`, `map`, `filter`, `foldl`, and charts like `lineChart`, `barChart`, `scatterChart`.

## Getting Started

### Installation
Available directly via the interactive shell. Access the shell or embed it into your React/Vite project utilizing the `hypelang-docs` web playground.

### Quick Example

```hypelang
// Create a flow to calculate factorial
flow fact(n) {
  match n {
    when 0 yield 1
    else yield n * fact(n - 1)
  }
}

flow main() {
  let result = fact(5)
  print "Factorial of 5 is: " + result
}
```

### Chart Generation Example

```hypelang
flow main() {
  let xs = range(0, 100)
  // Evaluate and graph!
  lineChart(xs)
}
```

## Running the Web Version

Install the dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Navigate to the local address to run your scripts through the built-in parser and evaluated within the browser.
