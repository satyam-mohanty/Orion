# Graph Report - Orion  (2026-10-31)

## Corpus Check
- 67 files · ~62,159 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 946 nodes · 1837 edges · 51 communities (41 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6ea0532`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- models.py
- schemas.py
- PersistentVectorStore
- Session
- generate_notebook_artifact
- DualSpeakerAudioEngine
- main.py
- api-client.ts
- batch4-verification.test.mjs
- TestGroundedAIChat
- StudioPanel.tsx
- create_notebook_source
- TestPersistentChatHistory
- TestSemanticRetrieval
- TestSourceLifecycleAndPersistence
- page.tsx
- MockOllamaClient
- TestNotebookLifecycleAndPersistence
- ChatWorkspace.tsx
- package.json
- compilerOptions
- MockEmbeddingService
- create_notebook_artifact
- 2. Quickstart Training Pipeline
- download_kaggle_data.py
- smoke_test_local_model.py
- test_batch4_contracts.py
- build_orion_ppt.py
- dependencies
- SourceManager.tsx
- devDependencies
- extractors.py
- get_utc_now
- layout.tsx
- scripts
- ocr-runner.js
- ocr/route.ts
- .test_10_persistence_across_reconnection
- start_backend.sh
- next.config.js
- declarations.d.ts
- AGENTS.md
- rules/graphify.md
- workflows/graphify.md
- BaseEmbeddingService
- TestRetrievalGroundingRegression
- ollama_client.py
- set_sqlite_pragma

## God Nodes (most connected - your core abstractions)
1. `PersistentVectorStore` - 44 edges
2. `MockOllamaClient` - 42 edges
3. `TestStudioArtifacts` - 39 edges
4. `BaseEmbeddingService` - 27 edges
5. `DualSpeakerAudioEngine` - 27 edges
6. `_get_notebook_or_404()` - 25 edges
7. `set_ollama_client()` - 24 edges
8. `MockEmbeddingService` - 23 edges
9. `generate_notebook_artifact()` - 23 edges
10. `OllamaClient` - 23 edges

## Surprising Connections (you probably didn't know these)
- `chat_notebook()` --uses--> `BaseEmbeddingService`  [INFERRED]
  backend/main.py → backend/embedding.py
- `create_notebook_source()` --uses--> `BaseEmbeddingService`  [INFERRED]
  backend/main.py → backend/embedding.py
- `generate_notebook_artifact()` --uses--> `BaseEmbeddingService`  [INFERRED]
  backend/main.py → backend/embedding.py
- `regenerate_notebook_artifact()` --uses--> `BaseEmbeddingService`  [INFERRED]
  backend/main.py → backend/embedding.py
- `reindex_notebook_sources()` --uses--> `BaseEmbeddingService`  [INFERRED]
  backend/main.py → backend/embedding.py

## Import Cycles
- None detected.

## Communities (51 total, 10 thin omitted)

### Community 0 - "models.py"
Cohesion: 0.21
Nodes (19): get_db(), FastAPI dependency that yields a database session per request and guarantees…, generate_message_id(), Orion Phase 7 Automated Test Suite: Persistent Chat History Tests conversation…, Orion Phase 6B Automated Test Suite: Source-Grounded AI Chat Tests notebook-…, Orion Phase 6C Regression Test Suite: Retrieval Accuracy & Citation Grounding…, Orion Phase 6A Automated Test Suite: Local Semantic Retrieval Validates…, Test Studio Artifacts Engine and Endpoints (Phase 8 Unit & Integration Suite)… (+11 more)

### Community 1 - "schemas.py"
Cohesion: 0.08
Nodes (33): Performs local semantic similarity retrieval across document chunks in a…, search_notebook_sources(), ArtifactBase, ArtifactCreate, ArtifactGenerateRequest, ArtifactRegenerateRequest, ArtifactResponse, ArtifactUpdate (+25 more)

### Community 2 - "PersistentVectorStore"
Cohesion: 0.10
Nodes (16): get_vector_index(), 11. Vector store persists embeddings across client/process recreation., get_vector_store(), PersistentVectorStore, Any, Removes all vectors belonging to a deleted source., Removes all vectors belonging to a deleted notebook., Hybrid retrieval combining local dense vector similarity with lexical BM25,… (+8 more)

### Community 3 - "Session"
Cohesion: 0.08
Nodes (41): create_notebook(), delete_notebook(), delete_notebook_artifact(), delete_notebook_conversation(), delete_notebook_source(), _get_artifact_or_404(), get_conversation_messages(), _get_conversation_or_404() (+33 more)

### Community 4 - "generate_notebook_artifact"
Cohesion: 0.23
Nodes (16): generate_notebook_artifact(), Generates and persists a functional, source-grounded studio artifact: 1.…, Regenerates an existing studio artifact with fresh content grounded in active…, regenerate_notebook_artifact(), OllamaClient, Client for interacting with local Ollama REST API., build_source_context_block(), clean_json_string() (+8 more)

### Community 5 - "DualSpeakerAudioEngine"
Cohesion: 0.10
Nodes (12): AudioPlayer(), AudioPlayerProps, audioPlayerEngine, cleanSpokenText(), DualSpeakerAudioEngine, getVoiceGenderAffinity(), isNaturalVoice(), normalizeSpeakerKey() (+4 more)

### Community 6 - "main.py"
Cohesion: 0.08
Nodes (36): PodcastDialogueGenerator, Any, Orion Audio Studio & Dialogue Synthesis Pipeline (Module 3 Core) Generates…, Two-host podcast dialogue synthesis engine. - Host A (Alex): Curious, probing,…, init_db(), Initializes database tables., api_extract_url(), api_extract_youtube() (+28 more)

### Community 7 - "api-client.ts"
Cohesion: 0.09
Nodes (36): BackendArtifactResponse, BackendChatResponse, BackendMessageResponse, BackendSourceResponse, createArtifact(), formatMessageTime(), getArtifact(), getConversation() (+28 more)

### Community 8 - "batch4-verification.test.mjs"
Cohesion: 0.06
Nodes (21): ref_node_assert, ref_node_child_process, ref_node_fs, ref_node_path, codeBuffer, headings, lines, olItems (+13 more)

### Community 9 - "TestGroundedAIChat"
Cohesion: 0.07
Nodes (15): 2. Chat in Notebook A never retrieves Notebook B's sources., 3. Chat respects selected_source_ids filter., 4. Unrelated questions or empty retrieval return clear refusal without fake…, 5. Asking questions in an empty notebook informs the user to add sources., 6. Rejects empty and whitespace-only message strings with 422., 7. Chat on unknown notebook returns 404., 8. Returns 503 Service Unavailable when Ollama daemon is offline., 9. Returns 504 Gateway Timeout when Ollama times out. (+7 more)

### Community 10 - "StudioPanel.tsx"
Cohesion: 0.10
Nodes (32): lucide-react, NotificationBanner(), NotificationBannerProps, NotificationState, NotificationType, SourceManagerProps, SourceViewerModal(), SourceViewerModalProps (+24 more)

### Community 11 - "create_notebook_source"
Cohesion: 0.09
Nodes (16): create_notebook_source(), Ingests and persists a document into the notebook with semantic chunking in a…, Conversation, generate_chunk_id(), generate_source_id(), Notebook, Source, SourceChunk (+8 more)

### Community 12 - "TestPersistentChatHistory"
Cohesion: 0.08
Nodes (13): Lists conversations ordered by updated_at descending., Retrieves conversation details and messages list., Renames a conversation and validates input., Deleting a conversation deletes all associated messages., Conversations are isolated per notebook and cross-notebook requests return 404., Invalid notebook or conversation IDs return 404., Sending grounded message persists user message and assistant response with…, When Ollama fails, user message is safely persisted to SQLite and not lost. (+5 more)

### Community 13 - "TestSemanticRetrieval"
Cohesion: 0.08
Nodes (12): 2. Notebook A cannot retrieve Notebook B's sources even with identical queries., 3. Deleting a source removes its vectors from search results., 4. Deleting a notebook removes all associated vectors., 5. Re-indexing does not duplicate vectors or degrade search accuracy., 6. Rejects empty, whitespace, and malformed queries with 422 Unprocessable…, 7. Return 404 for unknown notebook search and reindex requests., 8. Similarity threshold filters out low-relevance results., 9. Selected source IDs restrict retrieval to specified sources. (+4 more)

### Community 14 - "TestSourceLifecycleAndPersistence"
Cohesion: 0.08
Nodes (11): 3. Verify document chunks are persisted in stable chunk_index order., 4. Verify sources in Notebook A do not appear in Notebook B., 5. Reject empty content, whitespace title, and invalid source types with 422., 6. Return 404 for nonexistent notebook or nonexistent source., 7. Reject source ID belonging to Notebook A when accessed via Notebook B., 8. Deleting a source deletes the source record and all its chunks., 9. Deleting a notebook removes all its sources and their chunks., 11. Verify PATCH endpoint toggles is_selected and updates title. (+3 more)

### Community 15 - "page.tsx"
Cohesion: 0.18
Nodes (16): react, MobileViewTab, OrionHome(), Header(), HeaderProps, ModelSettingsModal(), ModelSettingsModalProps, createNotebook() (+8 more)

### Community 16 - "MockOllamaClient"
Cohesion: 0.06
Nodes (16): MockOllamaClient, Any, Checks if Ollama is running and lists local models., Deterministic offline mock Ollama client for automated testing. Never initiates…, Returns valid structured JSON for a given studio tool type., Allows test harness to inject mock client., set_ollama_client(), 1. Successful regeneration updates and returns a newly generated dialogue with… (+8 more)

### Community 17 - "TestNotebookLifecycleAndPersistence"
Cohesion: 0.10
Nodes (9): Verify updating notebook title and description with PATCH., Verify notebook deletion and subsequent 404., Verify data persistence across simulated backend restart: Close session and…, Verify that all existing endpoints still register and function as before., Verify notebook creation with 201 status and auto-generated fields., Verify validation rules: empty title or whitespace-only is rejected with 422., Verify notebook listing ordered by most recently updated first., Verify retrieving a notebook by ID and 404 for missing ID. (+1 more)

### Community 18 - "ChatWorkspace.tsx"
Cohesion: 0.16
Nodes (19): ChatWorkspace(), ChatWorkspaceProps, BlockToken, MarkdownRenderer(), MarkdownRendererProps, createConversation(), deleteConversation(), getConversationMessages() (+11 more)

### Community 19 - "package.json"
Cohesion: 0.10
Nodes (19): name, optionalDependencies, @next/swc-darwin-arm64, private, version, autoprefixer, clsx, @next/swc-darwin-arm64 (+11 more)

### Community 20 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "MockEmbeddingService"
Cohesion: 0.15
Nodes (3): MockEmbeddingService, Deterministic, offline embedding service for automated unit tests. Requires no…, Generates normalized vector embedding for a single search query.

### Community 22 - "create_notebook_artifact"
Cohesion: 0.40
Nodes (4): create_notebook_artifact(), Directly creates and persists a new studio artifact for a notebook., Artifact, generate_artifact_id()

### Community 23 - "2. Quickstart Training Pipeline"
Cohesion: 0.12
Nodes (14): 1. Launch Frontend, 2. Optional: Connect Local Ollama Daemon, 3. Optional: Run Local Python Backend, 📊 Kaggle Datasets & Training Suite, 🌟 Key Features, Orion — Local AI Research Notebook & Audio Studio, 🚀 Quickstart, 1. Verified Kaggle Datasets (+6 more)

### Community 24 - "download_kaggle_data.py"
Cohesion: 0.14
Nodes (6): argparse, torch, Orion Kaggle & Hugging Face Dataset Downloader Downloads SQuAD 2.0, Inshorts…, Orion GGUF & Ollama Exporter Merges LoRA adapter with base model and converts…, Orion Dataset Preprocessor Formats raw QA and dialogue datasets into Alpaca /…, Orion 4-Bit QLoRA Fine-Tuning Script Fine-tunes LLaMA 3.2 / Qwen 2.5 / Mistral…

### Community 25 - "smoke_test_local_model.py"
Cohesion: 0.28
Nodes (4): Production local embedding service powered by sentence-transformers. Runs 100%…, SentenceTransformerEmbeddingService, Orion Real Local Model Smoke Test (Phase 6A) Executes end-to-end embedding…, run_smoke_test()

### Community 26 - "test_batch4_contracts.py"
Cohesion: 0.18
Nodes (11): escape_xml(), Tests for Batch 4 contracts: Markdown citations, Studio SVG payload validation,…, Mirrors the frontend XML escape helper., Verify that unescaped characters like &, <, >, \", ' generate valid XML when…, Verify that citation indices [n] in model output are strictly detected and…, Ensure raw markdown headers (#, ##, **), citations, and quotes are stripped for…, test_clean_note_title_extraction(), test_markdown_citation_regex_contract() (+3 more)

### Community 27 - "build_orion_ppt.py"
Cohesion: 0.18
Nodes (9): replace_in_text_frame(), update_existing_template(), Path, pptx, pptx_dml_color, pptx_enum_shapes, pptx_enum_text, pptx_util (+1 more)

### Community 28 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, clsx, lucide-react, next, next-themes, pdf-parse, pdfjs-dist, react (+3 more)

### Community 29 - "SourceManager.tsx"
Cohesion: 0.13
Nodes (20): ActiveInputMode, SourceManager(), ApiError, createSource(), deleteNotebook(), deleteSource(), extractFileContent(), extractImageOcr() (+12 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/pdf-parse, @types/react, @types/react-dom (+1 more)

### Community 31 - "extractors.py"
Cohesion: 0.09
Nodes (27): extract_docx(), extract_epub(), extract_pdf(), extract_website(), extract_youtube(), extract_youtube_video_id(), Any, Orion Document & Media Extractors Handles robust extraction for: - Websites /… (+19 more)

### Community 32 - "get_utc_now"
Cohesion: 0.19
Nodes (13): create_notebook_conversation(), list_notebook_conversations(), Renames an existing conversation., Updates a notebook's title and/or description., Updates source selection state or metadata within a notebook., Lists all conversations for a notebook, ordered by updated_at desc., Creates a new conversation in the specified notebook., rename_notebook_conversation() (+5 more)

### Community 33 - "layout.tsx"
Cohesion: 0.33
Nodes (4): next-themes, src_app_globals, metadata, ThemeProvider()

### Community 34 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 35 - "ocr-runner.js"
Cohesion: 0.33
Nodes (4): ref_fs, tesseract.js, fs, Tesseract

### Community 36 - "ocr/route.ts"
Cohesion: 0.20
Nodes (9): ref_child_process, next, ref_os, ref_path, pdf-parse, ref_util, execFileAsync, POST() (+1 more)

### Community 48 - "BaseEmbeddingService"
Cohesion: 0.12
Nodes (19): ABC, BaseEmbeddingService, get_embedding_service(), Orion Local Embedding Service Provides pluggable local embedding models without…, Abstract base interface for embedding generation., Returns the active embedding service instance. If ORION_USE_MOCK_EMBEDDINGS is…, Allows test suites or runtime configs to set the active embedding service., Returns the dimensionality of the generated vectors. (+11 more)

### Community 49 - "TestRetrievalGroundingRegression"
Cohesion: 0.12
Nodes (8): Splits text using semantic boundaries (headers, paragraphs, tables) while…, SemanticChunker, 1. Final revision points question retrieves the exact final section on Page 45., 2. Straightforward question about tokenization retrieves the tokenization…, 3. Question about unmentioned information returns clear refusal without…, 4. Every returned citation maps accurately to a retrieved chunk with valid…, 5. Notebook isolation and selected-source filtering under hybrid search., TestRetrievalGroundingRegression

### Community 53 - "ollama_client.py"
Cohesion: 0.11
Nodes (26): chat_notebook(), Sends a message to an existing conversation. 1. Persists user message…, Grounded AI Chat: Retrieves notebook-scoped semantic passages matching the…, send_conversation_message(), Message, OllamaConnectionError, OllamaError, OllamaModelNotFoundError (+18 more)

### Community 54 - "set_sqlite_pragma"
Cohesion: 0.67
Nodes (3): Enforces SQLite foreign key constraints and cascade deletions., set_sqlite_pragma(), listens_for

## Knowledge Gaps
- **109 isolated node(s):** `start_backend.sh script`, `nextConfig`, `name`, `version`, `private` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 420 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PersistentVectorStore` connect `PersistentVectorStore` to `models.py`, `schemas.py`, `Session`, `generate_notebook_artifact`, `main.py`, `TestGroundedAIChat`, `create_notebook_source`, `TestPersistentChatHistory`, `TestSemanticRetrieval`, `TestSourceLifecycleAndPersistence`, `BaseEmbeddingService`, `TestRetrievalGroundingRegression`, `ollama_client.py`, `MockEmbeddingService`, `smoke_test_local_model.py`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `MockOllamaClient` connect `MockOllamaClient` to `models.py`, `generate_notebook_artifact`, `main.py`, `TestGroundedAIChat`, `TestPersistentChatHistory`, `TestRetrievalGroundingRegression`, `ollama_client.py`, `MockEmbeddingService`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `TestGroundedAIChat` connect `TestGroundedAIChat` to `models.py`, `MockOllamaClient`, `PersistentVectorStore`, `MockEmbeddingService`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `PersistentVectorStore` (e.g. with `chat_notebook()` and `create_notebook_source()`) actually correct?**
  _`PersistentVectorStore` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `MockOllamaClient` (e.g. with `TestPersistentChatHistory` and `TestGroundedAIChat`) actually correct?**
  _`MockOllamaClient` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `BaseEmbeddingService` (e.g. with `chat_notebook()` and `create_notebook_source()`) actually correct?**
  _`BaseEmbeddingService` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `start_backend.sh script`, `nextConfig`, `name` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._