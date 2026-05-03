import React from 'react';
import { Terminal } from 'lucide-react';

interface ConsoleProps {
  logs: string[];
  error: string | null;
}

export const Console: React.FC<ConsoleProps> = ({ logs, error }) => {
  return (
    <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col font-mono">
      <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
        <Terminal size={14} className="text-emerald-400" />
        <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Console Output</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-slate-300 flex gap-2">
            <span className="text-slate-600 select-none">›</span>
            <span>{log}</span>
          </div>
        ))}
        {error && (
          <div className="text-rose-400 bg-rose-400/10 p-3 rounded border border-rose-400/20 mt-2">
            <p className="font-bold underline mb-1">Execution Error</p>
            <p className="whitespace-pre-wrap text-xs">{error}</p>
          </div>
        )}
        {logs.length === 0 && !error && (
          <div className="text-slate-600 italic">No output yet. Run the code to see results.</div>
        )}
      </div>
    </div>
  );
};
