import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Styled table
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-slate-200">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-sm text-slate-600 border-t border-slate-100">{children}</td>,
          
          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            
            return inline ? (
              <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl my-4 overflow-x-auto font-mono text-sm shadow-inner group relative">
                <div className="absolute top-2 right-2 text-[10px] text-slate-500 uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang || 'code'}
                </div>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          
          // Standard elements styling
          h1: ({ children }) => <h1 className="text-xl font-bold text-indigo-950 mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-indigo-950 mb-2 mt-3 border-b border-indigo-50 pb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-indigo-900 mb-1 mt-2">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed mb-2 text-slate-700 whitespace-normal">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-slate-600">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-slate-600">{children}</ol>,
          li: ({ children }) => <li className="pl-1 italic-marker">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 my-4 bg-indigo-50/30 italic text-slate-600 rounded-r-lg">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
