import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, FileText, ChevronDown, ChevronRight, Loader2, Square, Search, Brain, Shield, Layers, Zap, CheckCircle2, Lock, Globe, Blend } from 'lucide-react';

const MODES = [
  { key: 'Private', label: 'Private Files',  icon: Lock,  color: 'indigo',  desc: 'Uses only your uploaded documents' },
  { key: 'Hybrid',  label: 'Hybrid',         icon: Blend, color: 'violet',  desc: 'Your files + live web search' },
  { key: 'Online',  label: 'Live Web',        icon: Globe, color: 'emerald', desc: 'Searches the internet only' },
];

const MODE_COLORS = {
  Private: { btn: 'bg-indigo-600 text-white shadow-indigo-200', ring: 'ring-indigo-500' },
  Hybrid:  { btn: 'bg-violet-600 text-white shadow-violet-200', ring: 'ring-violet-500' },
  Online:  { btn: 'bg-emerald-600 text-white shadow-emerald-200', ring: 'ring-emerald-500' },
};

const AGENT_STEPS_BASE = [
  { key: 'planner',   icon: Brain,       label: 'Planner',    desc: 'Decomposing and routing your query' },
  { key: 'retriever', icon: Search,       label: 'Retriever',  desc: 'Searching vectors & knowledge graph' },
  { key: 'websearch', icon: Globe,        label: 'WebSearch',  desc: 'Fetching live internet results', onlineOnly: true },
  { key: 'memory',    icon: Layers,       label: 'MemoryBuilder', desc: 'Fusing and deduplicating context' },
  { key: 'synth',     icon: Zap,          label: 'Synthesizer', desc: 'Crafting the final answer' },
  { key: 'verifier',  icon: Shield,       label: 'Verifier',   desc: 'Validating output quality' },
];

function LiveAgentLoader({ mode = 'Private' }) {
  const AGENT_STEPS = AGENT_STEPS_BASE.filter(s => !s.onlineOnly || mode !== 'Private');
  const modeColor = mode === 'Online' ? 'text-emerald-500' : mode === 'Hybrid' ? 'text-violet-500' : 'text-indigo-500';
  const activeBg = mode === 'Online' ? 'bg-emerald-600' : mode === 'Hybrid' ? 'bg-violet-600' : 'bg-indigo-600';
  const activeRing = mode === 'Online' ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : mode === 'Hybrid' ? 'shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'shadow-[0_0_10px_rgba(99,102,241,0.5)]';
  const activeBorder = mode === 'Online' ? 'bg-emerald-50 border-emerald-200' : mode === 'Hybrid' ? 'bg-violet-50 border-violet-200' : 'bg-indigo-50 border-indigo-200';
  const dotColor = mode === 'Online' ? 'bg-emerald-400' : mode === 'Hybrid' ? 'bg-violet-400' : 'bg-indigo-400';
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev < AGENT_STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="w-full py-2">
      <p className={`text-[11px] uppercase tracking-widest font-semibold ${modeColor} mb-3 flex items-center gap-1.5`}>
        <Loader2 className="w-3 h-3 animate-spin" /> HyperRAG-X — {mode} Mode Running
      </p>
      <div className="space-y-2">
        {AGENT_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <div key={step.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500 ${
              isActive ? `${activeBorder} border shadow-sm` :
              isDone  ? 'bg-emerald-50/60 border border-emerald-100' :
              'bg-slate-50/40 border border-slate-100 opacity-40'
            }`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                isActive ? `${activeBg} ${activeRing}` :
                isDone  ? 'bg-emerald-500' : 'bg-slate-200'
              }`}>
                {isDone 
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  : <Icon className={`w-3.5 h-3.5 ${ isActive ? 'text-white animate-pulse' : 'text-slate-400'}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${isActive ? 'text-indigo-700' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step.label} {isActive && <span className="font-normal">...</span>}
                </p>
                {(isActive || isDone) && (
                  <p className={`text-[10px] mt-0.5 ${ isActive ? 'text-indigo-400' : 'text-emerald-600'}`}>
                    {isDone ? '✓ Complete' : step.desc}
                  </p>
                )}
              </div>
              {isActive && (
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <div key={i} className={`w-1 h-1 rounded-full ${dotColor} animate-bounce`} style={{animationDelay: `${i*150}ms`}} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatInterface({ messages, setMessages, setActiveMessageId, onSourceClick, isSidebarOpen, suggestions, onSendMessage, isGenerating, onStopGenerating }) {
  const [input, setInput] = useState('');
  const [queryMode, setQueryMode] = useState('Private');
  const bottomRef = useRef(null);
  const [openThoughts, setOpenThoughts] = useState({});
  const toggleThought = (id) => setOpenThoughts(prev => ({...prev, [id]: !prev[id]}));

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hello. I am connected to your HyperRAG-X enterprise knowledge base. How can I assist you today?'
      }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (onSendMessage) {
       onSendMessage(e, input, queryMode);
       setInput('');
       return;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Header */}
      <div className={`p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white sticky top-0 z-10 flex items-center justify-between shadow-sm transition-all duration-300 ${!isSidebarOpen ? 'pl-20' : ''}`}>
        <h2 className="font-semibold text-indigo-950 flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          <span>Knowledge Chat</span>
        </h2>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#f8fafc]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
            onClick={() => {
              if (msg.role === 'assistant') setActiveMessageId(msg.id);
            }}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`py-3.5 px-5 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-200' 
                    : 'bg-white border border-slate-200/60 text-slate-700 rounded-bl-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                }`}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.isTyping ? (
                    <LiveAgentLoader mode={queryMode} />
                  ) : (
                    <>
                      {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                        <div className="mb-3 text-sm w-full block">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleThought(msg.id); }}
                            className="flex w-full items-center justify-between text-slate-500 hover:text-indigo-600 transition-colors font-medium bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100 mb-2"
                          >
                            <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-2">
                              <Bot className="w-3.5 h-3.5" />
                              <span>Thought Process</span>
                            </span>
                            {openThoughts[msg.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {openThoughts[msg.id] && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 text-xs space-y-2 mb-3">
                              {msg.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                  <span className="leading-relaxed">{step.step} - <span className="text-emerald-600 font-semibold">{step.status}</span></span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.content}
                    </>
                  )}
                </div>
              </div>

              {/* Citations block appended underneath assistant msg outside the bubble */}
              {msg.role === 'assistant' && msg.citations && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.citations.map((cite, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSourceClick(cite);
                      }}
                      className="flex items-center space-x-1.5 text-xs bg-white border border-indigo-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400 transition-colors" />
                      <span className="font-medium">{cite.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Box Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">

          {/* Mode Selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Source:</span>
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = queryMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setQueryMode(m.key)}
                  title={m.desc}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                    isActive
                      ? `${MODE_COLORS[m.key].btn} shadow-md border-transparent`
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {m.label}
                </button>
              );
            })}
            {queryMode !== 'Private' && (
              <span className="ml-1 text-[10px] text-slate-400 italic hidden sm:block">
                {MODES.find(m => m.key === queryMode)?.desc}
              </span>
            )}
          </div>
          
          {/* Dynamic Suggestions */}
          {suggestions && suggestions.length > 0 && messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(sug)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full cursor-pointer transition-colors border border-indigo-200 shadow-sm text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex shadow-md shadow-indigo-100/50 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask across all your documents..."
              className="w-full bg-transparent pl-5 pr-14 py-3.5 focus:outline-none text-slate-800 text-[15px] placeholder-slate-400"
            />
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="absolute right-2 top-2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center justify-center"
                title="Stop Generating"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Square className="w-3.5 h-3.5 fill-current" />
                </div>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                <Send className="w-5 h-5 pointer-events-none p-0.5" />
              </button>
            )}
          </form>
          <div className="text-center mt-3">
            <p className="text-[11px] text-slate-400">AI answers can vary. Always review cited sources.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
