import os
import logging
from typing import TypedDict, List
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from storage.vector_db import vector_db
from storage.graph_db import graph_db
from storage.memory_cache import memory_cache
from core.embeddings import LocalEmbedder

load_dotenv()
logger = logging.getLogger(__name__)

# 1. Defined State for All Agents
class AgentState(TypedDict):
    query: str
    original_query: str
    mode: str  # "Private", "Online", or "Hybrid"
    vector_context: List[dict] # [{"source": str, "content": str}]
    graph_context: List[dict]  # [{"source": str, "content": str}]
    memory_context: List[dict] # [{"source": str, "content": str}]
    web_context: List[dict]    # [{"source": str, "content": str}]
    fused_context: str
    citations: List[dict]      # Final list of sources used
    final_answer: str
    confidence: float
    strategy: str
    steps_taken: List[dict]
    retry_count: int
    files: List[str]  # Restricted knowledge scope for this chat

def run_llm(system_prompt: str, user_prompt: str) -> str:
    """Helper to query the Groq Cloud AI (Llama 3 70B) for 10x speed"""
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return "Error: GROQ_API_KEY not found in .env file."
            
        # Use the latest versatile 70B model
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0, groq_api_key=api_key) 
        prompt = ChatPromptTemplate.from_messages([("system", "{sys}"), ("human", "{usr}")])
        chain = prompt | llm
        return chain.invoke({"sys": system_prompt, "usr": user_prompt}).content
    except Exception as e:
        logger.error(f"Groq API Call Failed: {e}")
        return f"Error connecting to Groq Intelligence: {e}"

# ----------------- AGENT 1: PLANNING AGENT -----------------
def planning_node(state: AgentState):
    logger.info("Agent [Planner]: Decomposing query")
    state["steps_taken"] = state.get("steps_taken", [])
    state["steps_taken"].append({"step": "Query Decomposition (Planner)", "status": "Done"})
    
    state["original_query"] = state["query"]
    state["retry_count"] = state.get("retry_count", 0)
    
    # We let Groq rephrase or simplify the query if needed
    if " and " in state["query"].lower() or "compare" in state["query"].lower():
        system = "You are the Planning Agent. Rephrase the user query into clear search engine keywords. Output ONLY the rephrased query."
        # Use a faster, smaller model for planning
        api_key = os.getenv("GROQ_API_KEY")
        llm_fast = ChatGroq(model="llama-3.1-8b-instant", temperature=0.0, groq_api_key=api_key)
        prompt = ChatPromptTemplate.from_messages([("system", system), ("human", f"Fix this: {state['query']}")])
        rephrased_content = (prompt | llm_fast).invoke({}).content
        
        if rephrased_content:
            state["query"] = rephrased_content.strip()
            logger.info(f"Query rephrased to: {state['query']}")
            
    return state

# ----------------- AGENT 2: ADAPTIVE RETRIEVAL AGENT -----------------
def adaptive_retrieval_node(state: AgentState):
    logger.info("Agent [AdaptiveRetriever]: Selecting search domains")
    state["steps_taken"].append({"step": "Adaptive Selection & Retrieval", "status": "Done"})
    
    # 1. Fetch Direct Memory (Small files that bypassed RAG, filtered by chat selection)
    state["memory_context"] = memory_cache.get_context(state.get("files"))
    
    # 2. Qdrant Vector Search (only in Private/Hybrid)
    if state.get("mode", "Private") in ("Private", "Hybrid"):
        try:
            embedder = LocalEmbedder.get_embedder()
            query_vector = embedder.embed_query(state["query"])
            # Pass file filter to vector search for chat isolation
            results = vector_db.search(query_vector, limit=10, file_filter=state.get("files"))
            state["vector_context"] = [
                {"source": r.payload.get("file_name", "Unknown"), "content": r.payload.get("text", "")} 
                for r in results
            ] if results else []
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            state["vector_context"] = []
    else:
        state["vector_context"] = []

    # 3. NetworkX Graph Search (Multi-Hop)
    keywords = state["query"].split()
    g_ctx = []
    for w in keywords:
        if len(w) > 4:  # Quick keyword rule
            g_ctx.extend(graph_db.get_context_for_entity(w, file_filter=state.get("files")))
    state["graph_context"] = g_ctx
    
    # Set the strategy string for Frontend UI tracking
    has_vector = len(state["vector_context"]) > 0
    has_graph = len(state["graph_context"]) > 0
    has_memory = len(state["memory_context"]) > 0
    mode = state.get("mode", "Private")
    
    if mode == "Online":
        state["strategy"] = "Live Web Intelligence Search"
    elif mode == "Hybrid":
        state["strategy"] = "Hybrid: Private Documents + Web Search"
    elif has_memory and not has_vector:
        state["strategy"] = "Direct Knowledge Injection (Small Files)"
    elif has_vector and has_graph:
        state["strategy"] = "Deep Hybrid (Vectors + Graph)"
    elif has_vector:
        state["strategy"] = "Vector Semantic Search"
    else:
        state["strategy"] = "Fallback Deterministic Search"
        
    return state

# ----------------- AGENT 3: WEB SEARCH NODE -----------------
def web_search_node(state: AgentState):
    """Fetches live DuckDuckGo results when mode is Online or Hybrid"""
    mode = state.get("mode", "Private")
    if mode not in ("Online", "Hybrid"):
        state["web_context"] = []
        return state

    logger.info(f"Agent [WebSearch]: Fetching live web results (mode={mode})")
    state["steps_taken"].append({"step": "Live Web Intelligence Fetch", "status": "Done"})
    try:
        from duckduckgo_search import DDGS
        from urllib.parse import urlparse
        with DDGS() as ddgs:
            results = list(ddgs.text(state["query"], max_results=3))
            state["web_context"] = [
                {"source": f"Web: {urlparse(r['href']).netloc}", "content": r["body"], "url": r["href"]} 
                for r in results
            ]
        logger.info(f"WebSearch: Fetched {len(state['web_context'])} live results.")
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        state["web_context"] = []
    return state

# ----------------- AGENT 4: MEMORY BUILDER -----------------
def memory_builder_node(state: AgentState):
    logger.info("Agent [MemoryBuilder]: Fusing distinct records")
    state["steps_taken"].append({"step": "Context Fusion (MemoryBuilder)", "status": "Done"})
    
    all_records = (
        state["vector_context"] +
        state["graph_context"] +
        state["memory_context"] +
        state.get("web_context", [])
    )
    
    # Deduplicate based on content
    seen_content = set()
    unique_records = []
    for r in all_records:
        if r["content"] not in seen_content:
            seen_content.add(r["content"])
            unique_records.append(r)
    
    state["citations"] = unique_records
    
    if unique_records:
        state["fused_context"] = "\n\n---\n\n".join([f"Source: {r['source']}\n{r['content']}" for r in unique_records])
    else:
        state["fused_context"] = "SYSTEM: No exact contexts found. Use general knowledge carefully."
        
    return state

# ----------------- AGENT 4: SYNTHESIS AGENT -----------------
def synthesis_node(state: AgentState):
    logger.info("Agent [Synthesizer]: Crafting final response structure")
    state["steps_taken"].append({"step": "Strict Contextual Synthesis", "status": "Done"})

    # Cap context to 3000 chars to keep LLM prompt short and fast on CPU 
    context = state['fused_context'][:3000] if state['fused_context'] else ""
    
    system = (
        "You are HyperRAG-X, an elite enterprise knowledge assistant. "
        "Your goal is to provide a structured, professional, and VISUAL answer based ONLY on the provided context.\n\n"
        "STRICT FORMATTING RULES:\n"
        "1. Structure your answer using Markdown (bullet points, bold text).\n"
        "2. FOR COMPARISONS: You MUST use Markdown Tables to highlight differences.\n"
        "3. FOR PROCESSES/FLOWS: Use Markdown Tables or nested bullet points to explain visually. DO NOT use Mermaid diagrams.\n"
        "4. DO NOT REPEAT YOURSELF. If you have already stated a fact, move to the next one.\n"
        "5. NEVER use conversational fillers like 'I found the information' or 'You already know this'.\n"
        "6. If multiple questions are asked, answer them as a numbered list.\n"
        "7. If you cannot find the answer in context, say 'Information not found in internal documents' and suggest a broader search.\n"
        "8. PROACTIVE HELPFULNESS: At the end of your response, naturally suggest 1-2 helpful follow-up tips or ask if the user needs more details on a specific related topic (e.g., 'Would you like some tips on preparing for interview rounds mentioned in these guidelines?')."
    )
    user = f"CONTEXT:\n{context}\n\nUSER QUERY: {state['original_query']}\n\nFINAL RESPONSE (Concise & Structured):"
    
    ans = run_llm(system, user)
    state["final_answer"] = ans
    return state

# ----------------- AGENT 5: VERIFIER AGENT (Heuristic, No LLM Call) -----------------
def verifier_node(state: AgentState):
    logger.info("Agent [Verifier]: Grading the Synthesis Output")
    state["steps_taken"].append({"step": "Self-Correction Validation", "status": "Done"})

    answer = state.get("final_answer", "")
    
    # Fast heuristic scoring - no second Ollama call needed
    score = 85.0  # Base: assume good
    
    bad_signals = [
        "i apologize", "no context", "no information", "cannot find",
        "i don't have", "not provided", "no provided", "error connecting", "SYSTEM:"
    ]
    if any(sig in answer.lower() for sig in bad_signals):
        score = 55.0  # Low quality signals detected
    elif len(answer) < 80:
        score = 60.0  # Answer too short to be useful
    elif len(answer) > 200 and state.get("fused_context", ""):
        score = 92.0  # Long answer with context = high confidence
    
    state["confidence"] = score
    # Only retry once if score is really low and data exists
    state["retry_count"] = state.get("retry_count", 0) + 1
    logger.info(f"Heuristic confidence score: {score}")
    return state

# ----------------- CONDITIONAL EDGE -----------------
def should_loop(state: AgentState):
    """Only retry once if confidence is genuinely low (not just a no-context case)."""
    logger.info(f"Verification Score computed: {state['confidence']}")
    # Never loop more than once; never loop if answer exists with real content
    if state["confidence"] < 60.0 and state.get("retry_count", 0) < 2:
        logger.warning(f"Agentic Loop Triggered: Confidence {state['confidence']}. Retry #{state['retry_count']}")
        return "planner"
    return END

# ================= COMPILING LANGGRAPH =================
workflow = StateGraph(AgentState)

workflow.add_node("planner", planning_node)
workflow.add_node("adaptive_retrieval", adaptive_retrieval_node)
workflow.add_node("web_search", web_search_node)
workflow.add_node("memory_builder", memory_builder_node)
workflow.add_node("synthesizer", synthesis_node)
workflow.add_node("verifier", verifier_node)

# Flow: planner → retrieval → web_search → memory_builder → synthesizer → verifier
workflow.set_entry_point("planner")
workflow.add_edge("planner", "adaptive_retrieval")
workflow.add_edge("adaptive_retrieval", "web_search")
workflow.add_edge("web_search", "memory_builder")
workflow.add_edge("memory_builder", "synthesizer")
workflow.add_edge("synthesizer", "verifier")

# The Verification Branch Loop
workflow.add_conditional_edges("verifier", should_loop, {"planner": "planner", END: END})

orchestrator_target = workflow.compile()

def process_query_workflow(query: str, mode: str = "Private", files: List[str] = None):
    """Triggers the multi-agent pipeline with the chosen mode and file filter."""
    initial_state = {
        "query": query,
        "original_query": "",
        "mode": mode,
        "vector_context": [],
        "graph_context": [],
        "memory_context": [],
        "web_context": [],
        "fused_context": "",
        "citations": [],
        "final_answer": "",
        "confidence": 0.0,
        "strategy": "",
        "steps_taken": [],
        "retry_count": 0,
        "files": files or []
    }
    final_output = orchestrator_target.invoke(initial_state)
    return final_output
