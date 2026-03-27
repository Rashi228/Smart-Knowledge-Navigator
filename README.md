# 🌌 HyperRAG-X: Distributed Knowledge Resilience Node

HyperRAG-X is a high-performance, enterprise-grade hybrid RAG (Retrieval Augmented Generation) platform. It combines a multi-agent orchestration layer with a tripartite storage architecture (Vector, Graph, and Memory) to deliver near-instant, verifiable knowledge synthesis.

## 🚀 Key Features

*   **⚡ Near-Instant Reasoning**: Powered by **Groq Cloud** (Llama 3.3 70B & 3.1 8B) for 10x faster response times compared to local LLMs.
*   **🏢 Enterprise Connectivity**: Native **Confluence Integration** using Playwright (SSO-compatible) and Firecrawl for high-fidelity markdown extraction.
*   **🛡️ Immune System [Macrophage Agent]**: Active background scanning for document contradictions and fact-verification.
*   **🧠 Hybrid Memory Architecture**: 
    1.  **Vector DB (Qdrant)**: High-dimensional semantic search.
    2.  **Knowledge Graph (NetworkX)**: Multi-hop reasoning and entity relationship mapping.
    3.  **Direct Memory Cache**: Instant retrieval of short-form files.
*   **☁️ Cloud Identity**: Integrated **Supabase Auth** for secure, persistent user workspaces and data isolation.

## 🛠️ Tech Stack

- **Backend**: Python (FastAPI, LangGraph, LangChain)
- **Frontend**: React (Vite, Lucide-React)
- **Inference**: Groq Cloud API
- **Databases**: Qdrant (Vector), NetworkX (Graph), Supabase (Metadata & Auth)
- **Crawler**: Playwright + Firecrawl

## 🏁 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq Cloud API Key
- Supabase Project URL & Anon Key

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` # or .\venv\Scripts\Activate.ps1
4. `pip install -r requirements.txt`
5. Create `.env` from the provided template:
   ```text
   GROQ_API_KEY=your_key
   FIRE_CRAWL_API_KEY=your_key
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```
6. `uvicorn main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---
*Built for the Dell Ideathon: Architecting the next generation of knowledge Resilience.*
