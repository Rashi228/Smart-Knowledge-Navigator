# HyperRAG-X Implementation Plan: Phase 2 (Backend API & Intelligence Layers)

## Goal Description
Build the core intelligence and storage layers of HyperRAG-X, bridging the React frontend to the backend data pipelines. This phase scaffolds the FastAPI server, initializes the graph-based and vector-based storage, and sets up the foundational multi-agent orchestration architecture using LangGraph/LlamaIndex.

## Proposed Architecture & Layers

### 1. API Layer (`backend/api/`)
- **Framework:** FastAPI
- **Endpoints:**
  - `POST /upload`: Handles document ingestion (PDF, TXT, DOCX) and assigns user-specific metadata.
  - `POST /query`: Handles natural language queries and streams back the final answer alongside citations, confidence scores, and reasoning steps.
  - `GET /history`: Retrieves recent queries per user.

### 2. Storage & Retrieval Layer (`backend/storage/`)
- **Vector DB Integration:** Set up connections for semantic document retrieval via embedding. (Will use Qdrant/Chroma locally for development, mimicking Pinecone/Milvus).
- **Graph DB Integration:** Set up Neo4j client connection to store and traverse extracted hypergraph relationships (Entity A -> Relationship -> Entity B).
- **LlamaIndex Pipelines:** Create NodeParsers and Chunkers for incoming documents.

### 3. Orchestration Layer (`backend/agents/`)
Utilizing LangGraph to handle the stateful lifecycle of an incoming query:
- `PlanningAgent`: Decomposes user inputs into sub-queries.
- `AdaptiveRetrievalAgent`: Selects simple vector search, multi-hop graph traversal, or both.
- `MemoryBuilder`: Fuses Vector and Graph records into working context.
- `SynthesisAgent`: Crafts the final response structure with citations.
- `VerifierAgent`: Validates the response against source chunks and computes confidence.

### 4. Immune System Layer (`backend/immune/`)
- Implement a background task framework (e.g., Celery/APScheduler) that triggers macro/T-cell agent loops.
- `MacrophageAgent`: Scans for newly uploaded documents causing contradictory claims.
- `TCellAgent`: Validates which source holds higher priority and updates relationship statuses in Neo4j to "deprecated".

### 5. Authentication & Identity Layer (`backend/api/auth.py`)
- **Technology:** OAuth2 with JWT (JSON Web Tokens), `passlib` for password hashing, and SQLite (via SQLAlchemy) for user persistence.
- **Why:** HyperRAG-X is designed for "multi-user personalized knowledge spaces," which fundamentally requires robust identity partitioning.
- **Endpoints:**
  - `POST /register`: Accepts email/password, creates a new user, and initializes their isolated knowledge graph workspace.
  - `POST /login`: Validates credentials and returns an `access_token`.
  - `GET /me`: Verifies the token and retrieves user workspace settings.

## Phase 4: Core Implementation Logic
Replacing the scaffolds/mocks with actual production code utilizing:
1. **LlamaIndex Pipelines:**
   - Ingest uploaded PDFs/Docs to `/upload`.
   - Parse and chunk them using `SimpleNodeParser`.
   - Connect to OpenAI's `text-embedding-3-small` (or local HuggingFace equivalent) to vectorize.
2. **Qdrant Vector Integration:** Start a local `:memory:` or disk Qdrant client to store chunks.
3. **Neo4j Graph Construction:** Extract metadata/relations (Entity-Relation-Entity) using an LLM layer during ingestion and save to a local Neo4j desktop instance. *(Requires user to download Neo4j locally, or we can fallback to NetworkX for the ideathon prototype).*
4. **LangGraph Multi-Agent RAG Orchestration:**
   - Instead of a mock `dict`, `/query` triggers a LangGraph `StateGraph`.
   - `Planner Node` -> `Retriever Node` (Querying Qdrant) -> `Graph Node` (Querying Neo4j) -> `Synthesizer Node` -> `Verifier Node`.

## Proposed Changes (Auth Scaffolding)
- Update `backend/requirements.txt` with `python-jose`, `passlib[bcrypt]`, `SQLAlchemy`.
- Create `backend/db/models.py` for the SQLite User Table.
- Create `backend/api/auth.py` for routing.
- Add Login/Register Views logically into the React Frontend (`src/components/Auth/Login.jsx`).

## Verification Plan
1. **API Roots:** Hit `GET /` to verify there is no longer a 404 (Implemented).
2. **Auth Generation:** successfully register a user and exchange credentials for a token.
3. **Protected Routes:** Guarantee that triggering a query without a Bearer Token yields a `401 Unauthorized` error.
4. **Mock Integration:** Test the frontend `ChatInterface.jsx` against a mock `POST /query` endpoint to ensure the layout properly renders confidence scores and strategy states.
5. **Database Handshaking:** Log successful connections to the Vector and Graph databases locally.
