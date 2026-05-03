import React, { useMemo } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const highlightedCode = useMemo(() => {
    // 1. Escape HTML
    let text = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Define patterns
    const patterns = [
      { name: 'string', regex: /"([^"\\]*(?:\\.[^"\\]*)*)"/g, style: 'text-emerald-400' },
      { name: 'comment', regex: /(\/\/.*|--.*)/g, style: 'text-slate-500 italic' },
      { name: 'keyword', regex: /\b(flow|when|else|yield|match|for|in|while|let|print|fun|lazy|end|true|false)\b/g, style: 'text-indigo-400 font-bold' },
      { name: 'builtin', regex: /\b(head|tail|cons|len|isEmpty|append|range|map|filter|foldl|force)\b/g, style: 'text-cyan-400' },
      { name: 'number', regex: /\b\d+\b/g, style: 'text-amber-400' }
    ];

    // 3. Find all matches and sort by index
    let matches: { start: number, end: number, style: string, content: string }[] = [];
    
    patterns.forEach(p => {
      let match;
      const regex = new RegExp(p.regex, 'g');
      while ((match = regex.exec(text)) !== null) {
        // Prevent overlapping matches
        const isOverlapping = matches.some(m => (match!.index < m.end && match!.index + match![0].length > m.start));
        if (!isOverlapping) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            style: p.style,
            content: match[0]
          });
        }
      }
    });

    // Sort by start position
    matches.sort((a, b) => a.start - b.start);

    // 4. Reconstruct text with spans
    let result = '';
    let lastIndex = 0;

    matches.forEach(m => {
      result += text.substring(lastIndex, m.start);
      result += `<span class="${m.style}">${m.content}</span>`;
      lastIndex = m.end;
    });

    result += text.substring(lastIndex);

    return result;
  }, [code]);

  return (
    <div className="relative w-full h-full font-mono text-sm group flex flex-col bg-slate-900 overflow-hidden">
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Source Code</span>
      </div>
      <div className="relative flex-1 overflow-auto bg-slate-950" onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        const pre = target.querySelector('pre');
        const textarea = target.querySelector('textarea');
        if (pre && textarea) {
          pre.scrollTop = textarea.scrollTop;
          pre.scrollLeft = textarea.scrollLeft;
        }
      }}>
        <div className="relative min-h-full">
          {/* Highlight Layer */}
          <pre
            aria-hidden="true"
            className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden z-0 font-mono text-sm leading-[1.6] text-slate-300"
            dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }}
          />
          {/* Editor Layer */}
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;
                onChange(value.substring(0, start) + "  " + value.substring(end));
                
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + 2;
                }, 0);
              }
            }}
            spellCheck={false}
            className="relative w-full h-full min-h-[500px] bg-transparent p-4 text-transparent outline-none resize-none selection:bg-indigo-500/40 font-mono text-sm leading-[1.6] z-10 caret-white whitespace-pre-wrap break-words overflow-hidden"
            placeholder="// Type your Hype code here..."
          />
        </div>
      </div>
    </div>
  );
};
