import React, { useRef, useState, useEffect } from 'react';
import { Target, CheckCircle, ShieldAlert, FileSearch, ArrowUpRight, ListOrdered, ChevronRight, ChevronDown, Clock, FileText, UploadCloud, Link as LinkIcon, Download, LogOut, Settings, X, User as UserIcon, ShieldCheck, PanelLeftClose, Trash2, Plus, MoreHorizontal, Edit2, Share, Archive, Check, Share2, Filter } from 'lucide-react';

export default function Sidebar({ onLogout, onUpload, onConfluenceSync, onDeleteFile, isUploading, uploadedFiles, chats, currentChatId, onSelectChat, onNewChat, onRenameChat, onDeleteChat, onClose, onShowGraph, onOpenSourceSelection }) {
  const fileInputRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  
  // Confluence Modal State
  const [showConfluenceModal, setShowConfluenceModal] = useState(false);
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.chat-options-menu') && !event.target.closest('.chat-options-trigger')) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startEditing = (chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setOpenDropdownId(null);
  };

  const saveEditing = (id) => {
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0 text-slate-300 relative">

      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-5 text-slate-500 hover:text-white transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">HyperRAG-X</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Knowledge Engine</p>
          </div>
        </div>

        {/* Data Ingestion UI */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Sources</h2>
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  onUpload(e.target.files[0]);
                  e.target.value = null; // reset
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full flex items-center justify-center space-x-2 ${isUploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'} text-white border border-transparent rounded-lg py-2.5 px-3 text-sm font-medium transition-all shadow-md shadow-indigo-900/20`}
            >
              {isUploading ? (
                <>
                  <UploadCloud className="w-4 h-4 animate-pulse" />
                  <span className="text-xs">Indexing (This may take a minute) - ⏳</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
            <button 
              onClick={() => setShowConfluenceModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors cursor-pointer"
            >
              <LinkIcon className="w-4 h-4 text-indigo-400" />
              <span>Add Confluence Link</span>
            </button>
            <div className="h-px bg-slate-800/50 my-2"></div>
            <button 
              onClick={onShowGraph}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-br from-slate-800 to-indigo-900/20 hover:from-slate-700 hover:to-indigo-800/30 text-indigo-300 border border-indigo-500/20 rounded-lg py-2.5 px-3 text-sm font-bold transition-all cursor-pointer group"
            >
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Knowledge Graph</span>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-auto"></div>
            </button>
          </div>

          <div className="mt-5 space-y-2 overflow-y-auto max-h-[25vh] scrollbar-thin scrollbar-thumb-slate-700 pr-1">
            {uploadedFiles && uploadedFiles.length > 0 ? (
              uploadedFiles.map((filename, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="truncate text-slate-200 font-medium">{filename}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteFile && onDeleteFile(filename)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors hidden group-hover:block"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                  </button>
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:hidden" />
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic px-2">No documents engineered yet...</div>
            )}
          </div>
        </div>
      </div>

      {/* Query History */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Chats</h2>
          <button 
            onClick={onNewChat} 
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700" 
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          {chats && chats.length > 0 ? (
            chats.map((chat) => (
              <div key={chat.id} className="relative group">
                {editingChatId === chat.id ? (
                  <div className={`w-full flex items-center p-2.5 rounded-lg bg-slate-800 border-2 border-indigo-500`}>
                    <input
                      autoFocus
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(chat.id);
                        if (e.key === 'Escape') {
                          setEditingChatId(null);
                          setEditingTitle('');
                        }
                      }}
                      onBlur={() => saveEditing(chat.id)}
                      className="w-full bg-transparent text-white text-sm focus:outline-none"
                    />
                    <button className="text-emerald-400 p-1 flex-shrink-0" onClick={() => saveEditing(chat.id)}>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start space-x-3 pr-8 ${chat.id === currentChatId ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                  >
                    <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${chat.id === currentChatId ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-sm truncate transition-colors ${chat.id === currentChatId ? 'text-white font-medium' : 'text-slate-300 group-hover:text-slate-200'}`}>
                        {chat.title}
                      </p>
                      {chat.id === currentChatId && (
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"></div>
                            <span className="text-[10px] text-slate-400 font-medium">Session Active</span>
                          </div>
                          <span className="text-[9px] bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                            {chat.selectedFiles?.length || 0} Sources
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {/* More Options Button */}
                {editingChatId !== chat.id && (
                  <button 
                    className={`absolute right-2 top-2.5 p-1 rounded-md text-slate-400 hover:text-white transition-colors chat-options-trigger ${openDropdownId === chat.id ? 'opacity-100 bg-slate-700' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-700/50'}`}
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === chat.id ? null : chat.id); }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                )}

                {/* Floating Options Menu */}
                {openDropdownId === chat.id && (
                  <div className="chat-options-menu absolute z-50 right-2 top-10 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in duration-150">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); onOpenSourceSelection(); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-indigo-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Filter className="w-3.5 h-3.5 mr-2" /> Change Knowledge
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Share className="w-3.5 h-3.5 mr-2" /> Share
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(chat); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                    </button>
                    <div className="h-px bg-slate-700 my-1"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); if (window.confirm("Delete this chat?")) onDeleteChat(chat.id); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-2">Your history is empty.</div>
          )}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 mt-auto relative" ref={profileRef}>

        {showProfile && (
          <div className="absolute bottom-[calc(100%+10px)] left-4 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center space-x-3 mb-3 border-b border-slate-700/50 pb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">System Node</p>
                <p className="text-[10px] uppercase text-indigo-300 font-semibold tracking-wider">Secured Workspace</p>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center font-medium"><ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Immune System</span>
                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] uppercase">Active Scanning</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center font-medium"><Target className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Intelligence Router</span>
                <span className="text-indigo-400 font-bold bg-indigo-400/10 px-2 py-0.5 rounded text-[10px] uppercase">Auto</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center space-x-3 overflow-hidden hover:bg-slate-800 p-2 rounded-xl transition-all flex-1 text-left ${showProfile ? 'bg-slate-800 ring-1 ring-slate-700' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow shadow-indigo-500/30 ring-2 ring-indigo-900">
              ME
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">My Workspace</p>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">HyperRAG-X Protected</p>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="p-2 ml-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all flex-shrink-0 cursor-pointer"
            title="Terminate Session"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Confluence Integration Modal */}
      {showConfluenceModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800">
            <button 
              onClick={() => setShowConfluenceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Confluence Sync</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Securely bridge your enterprise wiki.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Space URL</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 text-sm placeholder-slate-400 font-medium" 
                  placeholder="https://your-domain.atlassian.net/wiki/"
                  value={confluenceUrl}
                  onChange={(e) => setConfluenceUrl(e.target.value)}
                />
              </div>
              <button 
                onClick={async () => {
                  setIsConnecting(true);
                  try {
                    await onConfluenceSync(confluenceUrl);
                    setShowConfluenceModal(false);
                    setConfluenceUrl('');
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                disabled={isConnecting || !confluenceUrl}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 mt-6"
              >
                {isConnecting ? 'Authenticating & Scraping Space...' : 'Initialize Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
