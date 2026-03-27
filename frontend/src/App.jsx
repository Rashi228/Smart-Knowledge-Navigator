import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import InsightPanel from './components/InsightPanel';
import SourceViewerModal from './components/SourceViewerModal';
import SourceSelectionModal from './components/SourceSelectionModal';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import GraphVisualizer from './components/GraphVisualizer';

export default function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('hyperrag_chats');
    if (saved) {
      try { return JSON.parse(saved).map(c => ({...c, selectedFiles: c.selectedFiles || []})); } catch (e) {}
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
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const saved = localStorage.getItem('hyperrag_files');
    return saved ? JSON.parse(saved) : [];
  });
  
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

  useEffect(() => {
    localStorage.setItem('hyperrag_files', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  // Derive current insights from active chat
  const currentInsights = activeChat?.insights || null;

  const fetchSuggestions = async () => {
    try {
      if (!token) return;
      const res = await fetch('http://localhost:8000/api/v1/suggestions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch(err) {
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
      if (!response.ok) throw new Error("Upload Failed");
      const data = await response.json();
      setUploadedFiles(prev => [...prev, file.name]);
      fetchSuggestions();
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload the document.");
    } finally {
      setIsUploading(false);
    }
  };

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
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Sync Failed");
      }
      
      const data = await response.json();
      console.log("Confluence Sync Success:", data);
      // Try to extract the name like 'Data from Wiki'
      setUploadedFiles(prev => [...prev, "Confluence: " + url.split('/').pop()]);
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
      if (!response.ok) throw new Error("Delete Failed");
      
      setUploadedFiles(prev => prev.filter(f => f !== filename));
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
      <div className={`fixed md:relative z-30 h-full transition-all duration-300 ease-in-out flex-shrink-0 border-r border-slate-800 ${
        isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0 md:translate-x-0 md:w-0 overflow-hidden border-none'
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
            onOpenSourceSelection={() => setShowSourceSelection(true)}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[#f8fafc] relative z-10 w-full transition-all duration-300 min-w-0`}>
        {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              title="Expand Workspace"
              className="absolute top-4 left-4 z-50 p-2.5 bg-white backdrop-blur border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center group"
            >
              <svg className="w-5 h-5 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7"></path></svg>
            </button>
        )}
        {/* We pass the internal state down, assuming ChatInterface uses an internal input state 
            or we adapt it to accept an onSubmit handler. Since ChatInterface has its own input form, 
            we map handleSendMessage to something it can use. */}
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
          />
      </div>

      <InsightPanel insights={currentInsights} />

      {activeSource && (
        <SourceViewerModal 
          source={activeSource} 
          onClose={() => setActiveSource(null)} 
        />
      )}

      {showGraph && (
        <GraphVisualizer onClose={() => setShowGraph(false)} />
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
