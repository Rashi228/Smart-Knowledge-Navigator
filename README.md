# HyperRAG-X: Distributed Knowledge Resilience Node

HyperRAG-X is a high-performance, enterprise-grade hybrid Retrieval-Augmented Generation (RAG) platform. It combines a multi-agent orchestration layer with a tripartite storage architecture (Vector, Graph, and Memory) to deliver near-instant, verifiable knowledge synthesis and management.

## Key Features

* **Near-Instant Reasoning:** Powered by Groq Cloud (Llama 3.3 70B and 3.1 8B) for high-speed inference and reasoning.
* **Enterprise Connectivity:** Native Confluence Integration utilizing Playwright (SSO-compatible) and Firecrawl for high-fidelity Markdown structural extractions.
* **Immune System (Macrophage Agent):** Active, asynchronous background scanning for internal contradictions and fact-verification across uploaded documents.
* **Tripartite Memory Architecture:**
    1. **Vector Database (Qdrant):** High-dimensional semantic search and chunk embeddings.
    2. **Knowledge Graph (NetworkX):** Multi-hop reasoning and interconnected entity relationship mapping.
    3. **Direct Memory Cache:** Instant retrieval buffer for short-form files, bypassing heavy vector searches.
* **Persistent Cloud Identity:** Robust Supabase Integration for secure authentication, session management, and data isolation.
* **Interactive Knowledge Visualization:** Visually explore document connections and entities using dynamic 2D force graphs.

## Technology Stack

### Backend
* **Framework:** Python 3.10+ and FastAPI
* **AI and LLM Ops:** LangGraph, LangChain, Groq API (Inference)
* **Vector Database:** Qdrant
* **Graph Database:** NetworkX (with localized JSON storage)
* **Authentication:** Supabase Auth integration
* **Web Crawling:** Playwright, Firecrawl

### Frontend
* **Framework:** React 18, Vite
* **Styling:** Tailwind CSS, PostCSS
* **Animations:** Framer Motion
* **Visualizations:** React Force Graph 2D, D3-Force, Mermaid (Markdown visualization)
* **Icons:** Lucide-React

## API Endpoints

The FastAPI backend exposes the following endpoints (prefixed by `/api/v1` for core features).

### Base and Status
* **`GET /`**: Root status, verifying API availability.
* **`GET /health`**: System health check.

### Authentication (`/api/v1/auth`)
* **`POST /auth/register`**: Register a new user with Supabase. Requires email, password, and username.
* **`POST /auth/login`**: Authenticate user credentials and receive a JWT access token.
* **`GET /auth/me`**: Returns the authenticated user profile metadata.

### Documents and Ingestion (`/api/v1/`)
* **`POST /upload`**: Ingests `.txt`, `.pdf`, `.docx`, and `.pptx` documents. Utilizes dynamic routing to index in Memory Cache or Qdrant background tasks based on file size.
* **`DELETE /documents/{filename}`**: Deletes an uploaded document entirely from the Vector DB and Knowledge cache.
* **`GET /documents`**: Returns a combined list of all indexed filenames.
* **`POST /confluence/sync`**: Authenticates and seamlessly synchronizes an Atlassian Confluence space using credentials.

### Queries and Intelligence (`/api/v1/`)
* **`POST /query`**: Execute natural language questions against the multi-agent workflow. Supports Local, Online, and Hybrid strategies.
* **`GET /immune/status`**: Exponent for frontend monitoring of the Macrophage threat detection system (contradictions and anomalies).
* **`GET /suggestions`**: Fetches randomly sampled graph entities to populate dynamic suggested query interactions.

### Knowledge Graph (`/api/v1/graph`)
* **`GET /graph/data`**: Fetches full spatial graph JSON metadata for Frontend UI force-graph renderings.
* **`GET /graph/stats`**: Debug stat collection highlighting vector caching states, graph nodes, and edges.

## Installation and Running Guide

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher
* Groq Cloud API Key
* Supabase Project URL and Anon Key
* Firecrawl API Key (optional, for specific web scrapes)

### Setting up the Backend

1. Navigate to the backend directory:
    ```bash
    cd backend
    ```

2. Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # On Linux/MacOS
    source venv/bin/activate
    # On Windows
    .\venv\Scripts\Activate.ps1
    ```

3. Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the `backend/` directory with the following contents:
    ```text
    GROQ_API_KEY=your_groq_key
    FIRE_CRAWL_API_KEY=your_firecrawl_key
    SUPABASE_URL=your_project_url
    SUPABASE_ANON_KEY=your_anon_key
    ```

5. Run the FastAPI application:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

### Setting up the Frontend

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install the necessary packages:
    ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```
