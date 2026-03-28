import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GitBranch, RefreshCw, X, Home, ZoomIn, Search, MessageSquare, Globe } from 'lucide-react';

// Extract keywords from chat messages (words > 3 chars, deduplicated)
function extractChatKeywords(messages) {
  const stopWords = new Set(['that','this','with','from','have','will','they','been','were','what','when','where','which','your','their','there','about','would','could','should','also','into','over','more','just','than','then','only','come','some','make','like','take','know','very','even','back','being','other','after','such','most','both','each','well','way','you','can','the','and','for','are','but','not','all','any','was','our','its','had','has','may','did','got','yet','use','how','let','see','now']);
  const keywords = new Set();
  messages.forEach(msg => {
    if (!msg.content) return;
    msg.content.toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
      .forEach(w => keywords.add(w));
  });
  return keywords;
}

// Build adjacency map from links
function buildAdjacency(nodes, links) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  links.forEach(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    if (adj[src]) adj[src].push(tgt);
    if (adj[tgt]) adj[tgt].push(src);
  });
  return adj;
}

// BFS to get subgraph within `depth` hops from rootId
function getSubgraph(rootId, nodes, links, depth = 2) {
  const adj = buildAdjacency(nodes, links);
  const visited = new Set();
  const queue = [{ id: rootId, d: 0 }];
  visited.add(rootId);

  while (queue.length) {
    const { id, d } = queue.shift();
    if (d < depth) {
      (adj[id] || []).forEach(nId => {
        if (!visited.has(nId)) {
          visited.add(nId);
          queue.push({ id: nId, d: d + 1 });
        }
      });
    }
  }

  const filteredNodes = nodes.filter(n => visited.has(n.id));
  const filteredLinks = links.filter(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return visited.has(src) && visited.has(tgt);
  });

  return { nodes: filteredNodes, links: filteredLinks };
}

// Node color by depth from root
function getNodeColor(node, rootId) {
  if (node.id === rootId) return '#6366f1'; // indigo - root
  return '#8b5cf6'; // violet - branches
}

export default function MindMap({ onClose, chatMessages = [] }) {
  const [allGraphData, setAllGraphData] = useState({ nodes: [], links: [] });
  const [displayData, setDisplayData] = useState({ nodes: [], links: [] });
  const [rootId, setRootId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'full'
  const fgRef = useRef();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hyperrag_token');
      const response = await fetch('http://localhost:8000/api/v1/graph/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllGraphData(data);
      }
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive chat-filtered graph whenever allGraphData or chatMessages changes
  const chatFilteredGraph = useCallback(() => {
    if (allGraphData.nodes.length === 0) return { nodes: [], links: [] };

    const keywords = extractChatKeywords(chatMessages);

    if (keywords.size === 0 || viewMode === 'full') {
      return allGraphData;
    }

    const matchedNodeIds = new Set(
      allGraphData.nodes
        .filter(n => {
          const name = (n.name || '').toLowerCase();
          return [...keywords].some(kw => name.includes(kw) || kw.includes(name));
        })
        .map(n => n.id)
    );

    if (matchedNodeIds.size === 0) return allGraphData;

    const adj = buildAdjacency(allGraphData.nodes, allGraphData.links);
    const expanded = new Set(matchedNodeIds);
    matchedNodeIds.forEach(id => {
      (adj[id] || []).forEach(nId => expanded.add(nId));
    });

    const filteredNodes = allGraphData.nodes.filter(n => expanded.has(n.id));
    const filteredLinks = allGraphData.links.filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return expanded.has(src) && expanded.has(tgt);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [allGraphData, chatMessages, viewMode]);

  useEffect(() => {
    if (allGraphData.nodes.length === 0) return;
    const filtered = chatFilteredGraph();
    const nodesToUse = filtered.nodes.length > 0 ? filtered : allGraphData;
    const adj = buildAdjacency(nodesToUse.nodes, nodesToUse.links);
    const centralNode = nodesToUse.nodes.reduce((best, n) =>
      (adj[n.id]?.length || 0) > (adj[best.id]?.length || 0) ? n : best
    , nodesToUse.nodes[0]);
    setRootId(centralNode.id);
    setDisplayData(getSubgraph(centralNode.id, nodesToUse.nodes, nodesToUse.links, 2));
  }, [allGraphData, viewMode, chatFilteredGraph]);

  const handleNodeClick = useCallback((node) => {
    const filtered = chatFilteredGraph();
    const nodesToUse = filtered.nodes.length > 0 ? filtered : allGraphData;
    setRootId(node.id);
    setDisplayData(getSubgraph(node.id, nodesToUse.nodes, nodesToUse.links, 2));
    if (fgRef.current) {
      setTimeout(() => { fgRef.current.centerAt(0, 0, 600); fgRef.current.zoom(1.5, 600); }, 100);
    }
  }, [allGraphData, chatFilteredGraph]);

  const handleResetRoot = () => {
    const filtered = chatFilteredGraph();
    const nodesToUse = filtered.nodes.length > 0 ? filtered : allGraphData;
    if (nodesToUse.nodes.length === 0) return;
    const adj = buildAdjacency(nodesToUse.nodes, nodesToUse.links);
    const centralNode = nodesToUse.nodes.reduce((best, n) =>
      (adj[n.id]?.length || 0) > (adj[best.id]?.length || 0) ? n : best
    , nodesToUse.nodes[0]);
    setRootId(centralNode.id);
    setDisplayData(getSubgraph(centralNode.id, nodesToUse.nodes, nodesToUse.links, 2));
    if (fgRef.current) fgRef.current.zoomToFit(400);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = chatFilteredGraph();
    const nodesToUse = filtered.nodes.length > 0 ? filtered : allGraphData;
    if (!term.trim()) { if (rootId) setDisplayData(getSubgraph(rootId, nodesToUse.nodes, nodesToUse.links, 2)); return; }
    const found = nodesToUse.nodes.find(n => n.name?.toLowerCase().includes(term.toLowerCase()));
    if (found) { setRootId(found.id); setDisplayData(getSubgraph(found.id, nodesToUse.nodes, nodesToUse.links, 2)); }
  };

  const rootNode = allGraphData.nodes.find(n => n.id === rootId);
  const chatKeywordCount = extractChatKeywords(chatMessages).size;
  const chatNodeCount = chatFilteredGraph().nodes.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-10 animate-in fade-in zoom-in duration-300">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full h-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/90 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
              <GitBranch className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Knowledge Mind Map</h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Click node to re-root · Depth: 2 hops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'chat' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                This Chat
                {chatNodeCount > 0 && viewMode !== 'full' && (
                  <span className="bg-violet-100 text-violet-700 px-1.5 rounded-full text-[9px] font-bold">{chatNodeCount}</span>
                )}
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'full' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Globe className="w-3.5 h-3.5" />
                Full Graph
                <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-full text-[9px] font-bold">{allGraphData.nodes.length}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Find concept..."
                className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all w-40"
              />
            </div>

            <button onClick={handleResetRoot} title="Reset root" className="p-3 hover:bg-violet-50 rounded-xl transition-colors text-slate-400 hover:text-violet-600">
              <Home className="w-5 h-5" />
            </button>
            <button onClick={fetchGraphData} title="Refresh" className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => fgRef.current?.zoomToFit(400)} title="Fit" className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors text-slate-600 hover:text-rose-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-8 py-2.5 border-b flex-shrink-0
          ${viewMode === 'chat' ? 'bg-violet-50/60 border-violet-100' : 'bg-indigo-50/60 border-indigo-100'}`}>
          {viewMode === 'chat' ? (
            <>
              <span className="text-[11px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Chat Context
              </span>
              {chatKeywordCount > 0 ? (
                <span className="text-[11px] text-slate-500">
                  {chatKeywordCount} keywords extracted · {displayData.nodes.length} matching nodes shown
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 italic">No messages yet — showing full graph</span>
              )}
            </>
          ) : (
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
              Full Knowledge Graph · {allGraphData.nodes.length} nodes · {allGraphData.links.length} edges
            </span>
          )}
          {rootNode && (
            <span className="ml-auto text-[11px] text-slate-400">
              Rooted at: <span className="font-semibold text-violet-700">{rootNode.name}</span>
            </span>
          )}
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-violet-50/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-white/70 backdrop-blur-sm z-20">
              <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-600 rounded-full animate-spin mb-4" />
              <span className="text-slate-500 font-bold text-sm tracking-widest uppercase">Building Mind Map...</span>
            </div>
          )}

          {!loading && allGraphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center flex-col z-20">
              <GitBranch className="w-16 h-16 text-slate-200 mb-4" />
              <span className="text-slate-400 font-medium text-center px-8">
                No knowledge graph data found yet.<br />Upload documents to start building your mind map.
              </span>
            </div>
          )}

          {!loading && displayData.nodes.length > 0 && (
            <ForceGraph2D
              ref={fgRef}
              graphData={displayData}
              nodeLabel="name"
              nodeColor={(node) => getNodeColor(node, rootId)}
              nodeRelSize={7}
              linkColor={() => '#c4b5fd'}
              linkWidth={1.8}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name || '';
                const isRoot = node.id === rootId;
                const fontSize = Math.max(10, 13 / globalScale);
                ctx.font = `${isRoot ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
                const textWidth = ctx.measureText(label).width;
                const pad = fontSize * 0.5;
                const bW = textWidth + pad * 2;
                const bH = fontSize + pad;
                const x0 = node.x - bW / 2;
                const y0 = node.y - bH / 2;
                const r = bH / 2.5;
                ctx.fillStyle = isRoot ? '#6366f1' : '#ede9fe';
                ctx.beginPath();
                ctx.moveTo(x0 + r, y0); ctx.lineTo(x0 + bW - r, y0);
                ctx.quadraticCurveTo(x0 + bW, y0, x0 + bW, y0 + r);
                ctx.lineTo(x0 + bW, y0 + bH - r);
                ctx.quadraticCurveTo(x0 + bW, y0 + bH, x0 + bW - r, y0 + bH);
                ctx.lineTo(x0 + r, y0 + bH);
                ctx.quadraticCurveTo(x0, y0 + bH, x0, y0 + bH - r);
                ctx.lineTo(x0, y0 + r);
                ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
                ctx.closePath(); ctx.fill();
                if (isRoot) { ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 2 / globalScale; ctx.stroke(); }
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = isRoot ? '#ffffff' : '#5b21b6';
                ctx.fillText(label, node.x, node.y);
                node.__bckgDimensions = [bW, bH];
              }}
              nodePointerAreaPaint={(node, color, ctx) => {
                const [bW, bH] = node.__bckgDimensions || [20, 14];
                ctx.fillStyle = color;
                ctx.fillRect(node.x - bW / 2, node.y - bH / 2, bW, bH);
              }}
              onNodeClick={handleNodeClick}
              cooldownTicks={80}
              d3AlphaDecay={0.015}
              d3VelocityDecay={0.3}
              onEngineStop={() => { if (fgRef.current) fgRef.current.zoomToFit(200, 40); }}
            />
          )}
        </div>

        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex-shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-500" /><span>Root</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-violet-200" /><span>Connected</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-violet-300" /><span>Relationship</span></div>
          </div>
          <div>{displayData.nodes.length} nodes · {displayData.links.length} connections · Click to explore</div>
        </div>
      </div>
    </div>
  );
}
