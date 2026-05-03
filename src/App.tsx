import { useState, useCallback } from 'react';
import { Play, Sparkles, BookOpen, Trash2, Cpu, Code2, MessageSquare, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runProgram } from './lib/aura/interpreter';
import { CodeEditor } from './components/CodeEditor';
import { Console } from './components/Console';

const INITIAL_CODE = `flow fact n {
  when n <= 1 yield 1
  else yield n * fact(n - 1)
}

flow main {
  print("Factorial of 5:")
  print(fact(5))
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
                    <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Basics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <code className="text-emerald-400">flow main &#123; ... &#125;</code>
                        <p className="text-xs text-slate-500 mt-1">Entry point of every program.</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <code className="text-emerald-400">let x = 10</code>
                        <p className="text-xs text-slate-500 mt-1">Local variable binding.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Flow Control</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <code className="text-emerald-400">when condition yield value</code>
                        <p className="text-xs text-slate-500 mt-1">Early return from a flow.</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <pre className="text-emerald-400 text-xs mt-1">match x &#123;
  0 {"->"} "zero"
  _ {"->"} "other"
&#125;</pre>
                        <p className="text-xs text-slate-500 mt-1">Pattern matching on values.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Functional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <code className="text-emerald-400">fun x {"->"} x + 1</code>
                        <p className="text-xs text-slate-500 mt-1">Lambda / Anonymous functions.</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <code className="text-emerald-400">map(f, list)</code>
                        <p className="text-xs text-slate-500 mt-1">Common high-order functions.</p>
                      </div>
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
