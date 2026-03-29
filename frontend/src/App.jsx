import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import InsightPanel from './components/InsightPanel';
import SourceViewerModal from './components/SourceViewerModal';
import SourceSelectionModal from './components/SourceSelectionModal';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import GraphVisualizer from './components/GraphVisualizer';
import ArtifactPanel from './components/ArtifactPanel';
import MindMap from './components/MindMap';

export default function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('hyperrag_chats');
    if (saved) {
      try { return JSON.parse(saved).map(c => ({ ...c, selectedFiles: c.selectedFiles || [] })); } catch (e) { }
    }
    return [{ id: Date.now(), title: 'New Chat', messages: [], selectedFiles: [] }];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    const savedId = localStorage.getItem('hyperrag_current_chat');
    // If we have a saved ID and the chat exists, use it. Otherwise default to first
    return savedId ? Number(savedId) : chats[0]?.id;
  });

  const activeChat = chats.find(c => c.id === currentChatId) || chats[0];
  const messages = activeChat?.messages || [];

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem('hyperrag_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('hyperrag_current_chat', currentChatId.toString());
  }, [currentChatId]);

  const setMessages = (updater) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === currentChatId) {
        const newMessages = typeof updater === 'function' ? updater(chat.messages) : updater;
        let newTitle = chat.title;
        if (newTitle === 'New Chat' && newMessages.length > 0) {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) newTitle = firstUserMsg.content;
        }
        return { ...chat, messages: newMessages, title: newTitle };
      }
      return chat;
    }));
  };

  const createNewChat = () => {
    const newId = Date.now();
    setChats(prev => [{ id: newId, title: 'New Chat', messages: [], insights: null, selectedFiles: [] }, ...prev]);
    setCurrentChatId(newId);
    setShowSourceSelection(true); // Open selection immediately
  };

  const handleUpdateChatFiles = (chatId, files) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, selectedFiles: files } : c));
    setShowSourceSelection(false);
  };

  const handleRenameChat = (id, newTitle) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const handleDeleteChat = (id) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const newChat = { id: Date.now(), title: 'New Chat', messages: [], insights: null };
        setCurrentChatId(newChat.id);
        return [newChat];
      }
      if (id === currentChatId) {
        setCurrentChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  const [activeMessageId, setActiveMessageId] = useState(null);
  const [activeSource, setActiveSource] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  // Auth state
  const [token, setToken] = useState(localStorage.getItem('hyperrag_token') || null);
  const [showRegister, setShowRegister] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSourceSelection, setShowSourceSelection] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Fetch uploaded files from backend (source of truth)
  // NOTE: defined after handleLogout to avoid reference-before-definition

  // Derive current insights from active chat
  const currentInsights = activeChat?.insights || null;

  const fetchSuggestions = async () => {
    try {
      if (!token) return;
      const res = await fetch('http://localhost:8000/api/v1/suggestions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('hyperrag_token', newToken);
    setToken(newToken);
  };

  const handleRegister = (email, password) => {
    // Usually you'd automatically log them in or redirect to login.
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('hyperrag_token');
    setToken(null);
    setChats([{ id: Date.now(), title: 'New Chat', messages: [], selectedFiles: [] }]);
    setUploadedFiles([]);
  };

  // Fetch file list from backend — defined here so handleLogout is in scope
  const fetchUploadedFiles = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8000/api/v1/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch document list:', err);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error("Upload Failed");
      await response.json();
      await fetchUploadedFiles(); // Refresh from backend (source of truth)
      fetchSuggestions();
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload the document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-fetch file list on login/token change
  useEffect(() => {
    fetchUploadedFiles();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfluenceSync = async (url) => {
    if (!url) return;
    setIsUploading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/confluence/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Sync Failed");
      }

      const data = await response.json();
      console.log("Confluence Sync Success:", data);
      await fetchUploadedFiles(); // Refresh from backend
      fetchSuggestions();
    } catch (err) {
      console.error("Error syncing Confluence:", err);
      alert(`Failed to sync Confluence: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this file from your database? This will remove all its info everywhere.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error("Delete Failed");

      await fetchUploadedFiles(); // Refresh from backend
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete the document.");
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.isTyping) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, isTyping: false, content: 'Generation manually stopped by user.' } : m);
        }
        return prev;
      });
    }
  };

  const handleSendMessage = async (e, input, mode) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      content: input
    };

    const loadingId = Date.now() + 1;
    const loadingMsg = {
      id: loadingId,
      role: 'assistant',
      isTyping: true,
      content: ''
    };

    setMessages(prev => [...prev, newUserMsg, loadingMsg]);
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:8000/api/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: input,
          mode: mode || "Private",
          files: activeChat.selectedFiles
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const newAiMsg = {
        id: loadingId,
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        steps: data.steps
      };

      setMessages(prev => prev.map(m => m.id === loadingId ? newAiMsg : m));

      const insights = {
        confidence: data.confidence_level,
        confidenceScore: data.confidence_score,
        strategy: data.strategy,
        sources: data.sources || [],
        steps: data.steps || []
      };

      // Store insights in the current chat
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, insights } : chat
      ));

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Query gracefully aborted.");
      } else {
        console.error("Error querying backend:", error);
        const fallbackAiMsg = {
          id: loadingId,
          role: 'assistant',
          content: "I couldn't reach the HyperRAG-X API. Please ensure the backend is running and Ollama is responsive.",
          citations: []
        };
        setMessages(prev => prev.map(m => m.id === loadingId ? fallbackAiMsg : m));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        {showRegister ? (
          <Register onRegister={handleRegister} onNavigateLogin={() => setShowRegister(false)} />
        ) : (
          <Login onLogin={handleLogin} onNavigateRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-800">

      {/* Sidebar Overlay for Mobile/Collapsing */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed md:relative z-30 h-full transition-all duration-300 ease-in-out flex-shrink-0 border-r border-slate-800 ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0 md:translate-x-0 md:w-0 overflow-hidden border-none'
        }`}>
        {/* We use width 72 (18rem) inherently in Sidebar.jsx, so we control its parent container to mask it */}
        <div className="w-72 h-full">
          <Sidebar
            onLogout={handleLogout}
            onUpload={handleUpload}
            onConfluenceSync={handleConfluenceSync}
            onDeleteFile={handleDeleteFile}
            isUploading={isUploading}
            uploadedFiles={uploadedFiles}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onNewChat={createNewChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
            onShowGraph={() => setShowGraph(true)}
            onShowMindMap={() => setShowMindMap(true)}
            onOpenSourceSelection={() => setShowSourceSelection(true)}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <div className={`flex-1 flex bg-[#f8fafc] relative z-10 w-full transition-all duration-300 min-w-0 overflow-hidden`}>
        {/* Chat Area - flex-1 expands to available space */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-100 relative">
          <div className="flex-1 min-h-0 relative">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                title="Expand Knowledge Source"
                className="absolute top-4 left-4 z-50 p-2.5 bg-white backdrop-blur border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center group"
              >
                <svg className="w-5 h-5 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7"></path></svg>
              </button>
            )}

            {!isRightSidebarOpen && !activeArtifact && (
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                title="Show Insights"
                className="absolute top-4 right-4 z-50 p-2.5 bg-white backdrop-blur border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center group"
              >
                <svg className="w-5 h-5 group-hover:text-violet-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 6h-16M13 12h7M10 18h10"></path></svg>
              </button>
            )}

            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              setActiveMessageId={setActiveMessageId}
              onSourceClick={setActiveSource}
              isSidebarOpen={isSidebarOpen}
              suggestions={suggestions}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGenerating={handleStopGenerating}
              onOpenSourceSelection={() => setShowSourceSelection(true)}
              chats={chats}
              currentChatId={currentChatId}
              onArtifactOpen={setActiveArtifact}
            />
          </div>
        </div>

        {/* Persistent Right Side Panel */}
        <div className={`transition-all duration-500 ease-in-out bg-white flex flex-col flex-shrink-0 relative border-l border-slate-200
          ${activeArtifact ? 'w-full lg:w-1/2' : isRightSidebarOpen ? 'w-0 lg:w-[360px]' : 'w-0'}
        `}>
          <div className="h-full w-full relative overflow-hidden flex flex-col">
            {activeArtifact ? (
              <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
            ) : (
              <div className="h-full flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Retrieval Context
                  </h3>
                  <button
                    onClick={() => setIsRightSidebarOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    title="Hide Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
                  <InsightPanel insights={currentInsights} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeSource && (
        <SourceViewerModal
          source={activeSource}
          onClose={() => setActiveSource(null)}
        />
      )}

      {showGraph && (
        <GraphVisualizer onClose={() => setShowGraph(false)} />
      )}

      {showMindMap && (
        <MindMap
          onClose={() => setShowMindMap(false)}
          chatMessages={activeChat?.messages || []}
        />
      )}

      <SourceSelectionModal
        isOpen={showSourceSelection}
        onClose={() => setShowSourceSelection(false)}
        uploadedFiles={uploadedFiles}
        initialSelection={activeChat?.selectedFiles || []}
        onConfirm={(files) => handleUpdateChatFiles(currentChatId, files)}
      />
    </div>
  );
}
