import { useState, useCallback } from 'react';
import { Play, Sparkles, BookOpen, Trash2, Cpu, Code2, MessageSquare, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runProgram } from './lib/aura/interpreter';
import { CodeEditor } from './components/CodeEditor';
import { Console } from './components/Console';

const INITIAL_CODE = `flow fact(n) {
  match n {
    0 -> 1
    _ -> n * fact(n - 1)
  }
}

flow main() {
  let result = fact(5)
  print "Factorial of 5 is: " + result
}`;

export default function App() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    setError(null);

    const logOutput: string[] = [];
    const options = {
      print: (val: string) => {
        logOutput.push(val);
        setLogs([...logOutput]);
      }
    };

    try {
      const result = await runProgram(code, options);
      // If the last value wasn't printed, show it as a result
      if (logOutput.length === 0 || logOutput[logOutput.length - 1] !== result) {
        // Only print result if it's not already printed via print() and it's meaningful
        // For flows returning Bool(false) by default in while/for, we might skip printing result
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  const clearConsole = () => {
    setLogs([]);
    setError(null);
  };

  const saveToFile = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'code.hypelang';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="w-full h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-3 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cpu size={16} className="text-white" />
              </div>
              <h1 className="text-lg font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                HYPE IDE
              </h1>
            </div>
            <div className="h-4 w-[1px] bg-slate-800 mx-2" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDocs(true)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={12} />
                Documentation
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={saveToFile}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors text-xs flex items-center gap-2"
              title="Save as .hypelang"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
            <button 
              onClick={clearConsole}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-md transition-colors text-xs flex items-center gap-2"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
            <button 
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all shadow-lg shadow-indigo-500/20 text-xs font-bold disabled:opacity-50 active:scale-95"
            >
              <Play size={14} fill="currentColor" />
              <span>{isRunning ? 'RUNNING...' : 'RUN CODE'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Editor & Console Split */}
          <div className="flex-1 flex flex-col md:flex-row min-w-0">
            <div className="flex-1 min-h-0 relative">
              <CodeEditor code={code} onChange={setCode} />
            </div>
            
            <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-slate-900 flex flex-col min-h-0 bg-slate-950">
              <Console logs={logs} error={error} />
            </div>
          </div>
        </main>

        {/* Documentation Overlay */}
        <AnimatePresence>
          {showDocs && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowDocs(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="text-indigo-500" />
                    Hype Language Guide
                  </h2>
                  <button onClick={() => setShowDocs(false)} className="text-slate-500 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6 space-y-8 font-sans">
                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">1. Функции и Точка входа</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-sm">
                      <p className="text-slate-400">Каждая программа на HypeLang начинается с функции <code className="text-slate-300">main()</code>. Функции объявляются с помощью ключевого слова <code className="text-slate-300">flow</code>.</p>
                      <pre className="text-emerald-400 mt-2 bg-slate-900/50 p-2 rounded">
flow myFunc(arg1, arg2) &#123;
  // тело функции
&#125;

flow main() &#123;
  print("Hello, HypeLang!")
&#125;
                      </pre>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">2. Переменные и Типы данных</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 text-sm">
                      <p className="text-slate-400">Поддерживаются числа (Int), логические значения (Bool), строки (String) и списки (List). Для объявления используется <code className="text-slate-300">let</code>.</p>
                      <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded">
let x = 42
let msg = "Hello"
let flag = true
let arr = [1, 2, 3, 4]
                      </pre>
                      <p className="text-slate-400 mt-2">Мутация переменных:</p>
                      <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded">
x = 100
x += 5
x++
                      </pre>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">3. Ветвления и Циклы</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 text-sm">
                      <p className="text-slate-400">Доступны условные операторы <code className="text-slate-300">when ... else</code>, а также циклы <code className="text-slate-300">while</code> и <code className="text-slate-300">for ... in</code>.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded h-full">
when x &gt; 10 &#123;
  print("Greater")
&#125; else &#123;
  print("Lesser or Eq")
&#125;
                          </pre>
                        </div>
                        <div>
                          <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded h-full">
for i in range(1, 5) &#123;
  print(i)
&#125;

while x &lt; 100 &#123;
  x += 10
&#125;
                          </pre>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">4. Сопоставление с шаблоном (Pattern Matching)</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-sm">
                      <p className="text-slate-400">Конструкция <code className="text-slate-300">match</code> позволяет удобно ветвить логику на основе значений. Шаблон <code className="text-slate-300">_</code> используется по умолчанию (wildcard).</p>
                      <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded">
match n &#123;
  0 {"->"} "Zero"
  1 {"->"} "One"
  _ {"->"} "Other value"
&#125;
                      </pre>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">5. Ленивые вычисления</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-sm">
                      <p className="text-slate-400">С помощью операторов <code className="text-slate-300">lazy</code> и <code className="text-slate-300">force</code> можно откладывать вычисления до их явного вызова.</p>
                      <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded">
let heavy = lazy (fact(20))
// Вычисление произойдет только здесь:
let result = force(heavy)
                      </pre>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">6. Встроенные функции (Списки)</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm">
                      <ul className="text-slate-400 space-y-2 list-disc list-inside px-4">
                        <li><code className="text-slate-300">head(list)</code> — возвращает первый элемент.</li>
                        <li><code className="text-slate-300">tail(list)</code> — возвращает список без первого элемента.</li>
                        <li><code className="text-slate-300">cons(x, list)</code> — добавляет элемент в начало.</li>
                        <li><code className="text-slate-300">len(list)</code> — длина списка.</li>
                        <li><code className="text-slate-300">isEmpty(list)</code> — проверка на пустоту.</li>
                        <li><code className="text-slate-300">append(list1, list2)</code> — объединение списков.</li>
                        <li><code className="text-slate-300">range(from, to)</code> — список чисел от и до (включительно).</li>
                        <li><code className="text-slate-300">map(fn, list)</code> — применяет функцию к списку элементов.</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-800 pb-2">7. Визуализация и Графики</h3>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-sm">
                      <p className="text-slate-400">Язык поддерживает встроенные команды для построения графиков из терминала и web-интерфейса.</p>
                      <pre className="text-emerald-400 bg-slate-900/50 p-2 rounded">
lineChart(range(1, 10))
barChart([10, 20, 15, 30])
scatterChart([1, 2, 3])
                      </pre>
                    </div>
                  </section>
                </div>
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowDocs(false)}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="px-6 py-2 border-t border-slate-900 bg-slate-950 flex justify-between items-center text-[10px] text-slate-600 font-mono">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Code2 size={10} /> hand-written-ast</span>
            <span className="flex items-center gap-1.5"><Cpu size={10} /> runtime-v8</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
               <MessageSquare size={10} /> Feedback
             </span>
             <span>Hype Programming Language © 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
