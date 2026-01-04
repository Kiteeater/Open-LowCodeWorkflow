# EdgeFlow: High-Performance Browser-Based Workflow Engine

## 📅 Project Plan Checklist

### 💡 Key Optimizations (Refactored)

1.  **Persistence**: Added `zustand/persist` to save work across reloads.
2.  **Network**: Added "Proxy Mode" to bypass CORS restrictions during demos.
3.  **Sandbox**: Replaced `with` syntax with `new Function(...args)` to support React Strict Mode.

---

### Day 1: Canvas Core —— React Flow & State Persistence

**Goal:** Build project skeleton, implement canvas drag & drop, and ensure data survives page reloads.

- [x] **1.1 Environment Setup (1h)**

  - [x] Initialize Vite + React + TypeScript.
  - [x] Install dependencies: `@xyflow/react`, `zustand`, `immer`, `lucide-react`.
  - [x] Configure Tailwind CSS.

- [x] **1.2 State Management & Persistence (2h)**

  - [x] Principles: Understand Zustand `set`/`get`.
  - [x] Implementation: Create `store.ts`. Define `nodes`, `edges`, `onNodesChange`, `onConnect`.
  - [x] **⚠️ [NEW] Persistence Integration**:
    - [x] Import `persist` from `zustand/middleware`.
    - [x] Wrap store config to save to LocalStorage (key: `edgeflow-storage`).
    - [x] _Test: Refresh page -> Canvas state should remain._

- [x] **1.3 Custom Node UI (3h)**
  - [x] Create `AgentNode.tsx` with "Left-In, Right-Out" Handle layout.
  - [x] Style: Icon, Title, Status Indicator (Loading/Success/Error).
  - [x] Register in `nodeTypes`.

---

### Day 2: Metadata Driven —— Dynamic Form System

**Goal:** "Configuration is UI". Click node -> Open Drawer -> Generate Form based on JSON Schema.

- [x] **2.1 Sidebar Drawer Logic (2h)**

  - [x] Import `shadcn/ui` Sheet component.
  - [x] Logic: Click node -> Set `selectedNodeId` -> Open Sheet.

- [x] **2.2 JSON Schema Registry (2h)**

  - [x] Create `nodeRegistry.ts`.
  - [x] Define "HTTP Request" Node (inputs: URL, Method, Body, **UseProxy**).
  - [x] Define "Code" Node (inputs: Javascript Code).
  - [x] **[NEW]** Define "AI Agent" Node (inputs: Model, Prompt, API Key).

- [x] **2.3 Dynamic Form Rendering (4h)**
  - [x] Use `react-hook-form`.
  - [x] Create `ParameterRender` component.
  - [x] Sync form changes back to Store Node Data (`updateNodeData`).

---

### Day 3: Initial Run —— Logic & Network Layer

**Goal:** Execute logic in Main Thread first, handling real network requests.

- [x] **3.1 Topological Sort (3h)**

  - [x] Implement `getExecutionSequence(nodes, edges)` using BFS/Kahn's Algorithm.

- [x] **3.2 Execution Engine with Proxy Strategy (3h)**

  - [x] Implement `runWorkflow` function.
  - [x] **⚠️ [NEW] HTTP Node Implementation**:
    - [x] Add logic: Check `node.data.useProxy`.
    - [x] If true: Prepend `https://cors-anywhere.herokuapp.com/` to target URL.
    - [x] If false: Fetch directly (Direct Mode).
  - [x] Store results in `executionResults`.

- [x] **3.3 Visual Feedback (2h)**
  - [x] Update Node UI based on status (Yellow -> Green/Red).

---

### Phase 2: Architecture Refactoring (Day 4 - Day 7)

**Goal:** Transform into a professional, non-blocking engine.

### Day 4: Layered Architecture —— Web Worker & Comlink

**Goal:** Offload execution to Worker to keep UI at 60FPS.

- [x] **4.1 Web Worker Setup (2h)**

  - [x] Create `workflow.worker.ts`.
  - [x] Test basic Ping/Pong message.

- [x] **4.2 Comlink Integration (2h)**

  - [x] Install `comlink`.
  - [x] Expose Worker functions as RPC Promise objects.

- [x] **4.3 Engine Migration (4h)**
  - [x] Move `runWorkflow` and Topo Sort logic into Worker.
  - [x] Main Thread: Send Graph JSON -> Await Result.

---

### Day 5: Intelligent Core —— AST Dependency Analysis

**Goal:** Support `{{ $node["A"].data }}` via static analysis.

- [x] **5.1 AST Setup (2h)**

  - [x] Install `acorn`.
  - [x] Test parsing simple JS expressions in console.

- [x] **5.2 Dependency Extraction (3h)**

  - [x] Implement `extractDependencies(code)` using Acorn.
  - [x] Walk the AST tree to find `MemberExpression` (e.g., `$node.Http`).

- [x] **5.3 Data Injection Logic (3h)**
  - [x] In Worker: Before running a node, parse its code.
  - [x] Find dependencies -> Fetch data from `executionResults` -> Inject into context.

---

### Day 6: Secure Runtime —— Strict Mode Compatible Sandbox

**Goal:** Execute user code safely without using `with` (to support React Strict Mode).

- [x] **6.1 Scope Preparation (2h)**

  - [x] Define the context object: `const context = { $node: ..., utils: ..., console: ... }`.
  - [x] Extract keys and values: `Object.keys(context)`, `Object.values(context)`.

- [x] **6.2 Safe Execution Implementation (4h)**

  - [x] **⚠️ [NEW] Replace `with` logic**:

    ```javascript
    // Create function with explicit arguments
    const safeFn = new Function(...scopeKeys, `return ${userCode}`);

    // Execute with actual values
    try {
      const result = safeFn(...scopeValues);
    } catch (e) {
      throw new Error(`Execution failed: ${e.message}`);
    }
    ```

  - [x] Verify: Ensure variables defined in `context` are accessible in user code.

- [x] **6.3 Security Hardening (Optional)**
  - [x] Shadow dangerous globals in the Worker scope (e.g., `self.fetch = null` if needed).

---

### Day 7: Final Polish & Portfolio Ready

**Goal:** High-end UX and Interview Prep.

- [ ] **7.1 Monaco Editor Integration (3h)**

  - [ ] Replace standard Textarea with Monaco Editor for Code Nodes.
  - [ ] (Bonus) Add syntax highlighting.

- [ ] **7.2 Data Inspector (2h)**

  - [ ] Hover/Click a node after run to see Input/Output JSON in a nice viewer.

- [ ] **7.3 Resume & Demo Assets (3h)**
  - [ ] Record GIF: Drag Node -> Config (Proxy On) -> Connect -> Run -> Result.
  - [ ] Update README with "Off-Main-Thread", "AST", "Strict Mode Sandbox".

---

### Day 8: AI Agent Node - Core Implementation

**Goal:** Implement fully functional AI Agent node with LLM integration, secure storage, and multi-turn conversations.

- [ ] **8.1 Type System Extension (30min)**
  - [ ] Extend `ParameterType` with `'ai-model' | 'ai-template' | 'skill-source'`
  - [ ] Define `AIAgentNodeData` interface:
    - [ ] Basic config: model, provider, apiKey, temperature, maxTokens
    - [ ] Prompt config: systemMessage, prompt
    - [ ] Advanced toggles: enableStream, enableFunctionCalling, enableMultiTurn
    - [ ] SKILL config: skillSources array
    - [ ] Conversation config: conversationId, maxHistoryLength
  - [ ] Define `LLMMessage`, `LLMResponse`, `FunctionCall`, `SkillSource` interfaces
  - [ ] Update `WorkflowNodeData` union type

- [ ] **8.2 Node Registry Configuration (30min)**
  - [ ] Configure complete `ai-agent` parameters in `nodeRegistry.ts`:
    - [ ] Node name, provider selector, model selector
    - [ ] API Key input (with encryption hint)
    - [ ] System Message (code type)
    - [ ] User Prompt (code type, support `{{ $node["XXX"].data }}` syntax)
    - [ ] Temperature & Max Tokens parameters
    - [ ] Advanced feature toggles
    - [ ] Max history length setting
  - [ ] Configure multiple handles (main-input/output, context-input, tool-output)

- [ ] **8.3 Encryption Service (1h)**
  - [ ] Create `src/workers/services/crypto.service.ts`
  - [ ] Implement `CryptoService` class with Web Crypto API:
    - [ ] `encrypt(plaintext, password?)`: AES-GCM 256-bit, PBKDF2 key derivation
    - [ ] `decrypt(ciphertext, password?)`: Decrypt and return plaintext
    - [ ] `getDefaultKey()`: localStorage-based key persistence
  - [ ] Error handling: return null on decryption failure

- [ ] **8.4 LLM Service Implementation (2h)**
  - [ ] Create `src/workers/services/llm.service.ts`
  - [ ] Define `LLMChatParams` and `LLMStreamParams` interfaces
  - [ ] Implement `chat(params)`: Route to OpenAI or Anthropic
  - [ ] Implement `chatOpenAI(params)`:
    - [ ] Build request body (model, messages, temperature, max_tokens)
    - [ ] Fetch `https://api.openai.com/v1/chat/completions`
    - [ ] Parse response and return `LLMResponse`
  - [ ] Implement `chatAnthropic(params)`:
    - [ ] Extract system message
    - [ ] Fetch `https://api.anthropic.com/v1/messages`
    - [ ] Parse Claude format response
  - [ ] Error handling: unified error format with status code

- [ ] **8.5 Worker Execution Engine Integration (1.5h)**
  - [ ] Import services: `LLMService`, `CryptoService`, `ConversationService`
  - [ ] Instantiate services in `WorkflowEngine` class
  - [ ] Implement private method `executeAIAgent(...)`:
    - [ ] Decrypt API Key
    - [ ] Call `injectVariables` to inject data into Prompt
    - [ ] Build messages array (system + history + user)
    - [ ] Call `llmService.chat`
    - [ ] Save to conversation history if multi-turn enabled
    - [ ] Return `LLMResponse`
  - [ ] Implement `injectVariables(template, contextNodeData)`:
    - [ ] Regex replace `{{ $node["XXX"].data }}`
    - [ ] Inject data as JSON string
  - [ ] Add `ai-agent` node handling in `runWorkflow` method

- [ ] **8.6 Conversation Storage Service (30min)**
  - [ ] Create `src/workers/services/conversation.service.ts`
  - [ ] Define `Conversation` interface (id, createdAt, updatedAt, messages)
  - [ ] Implement `ConversationService` class (memory + localStorage):
    - [ ] `createConversation()`: Generate UUID, init empty messages
    - [ ] `getConversation(id)`: Retrieve from Map
    - [ ] `addMessage(conversationId, message)`: Add and update timestamp
    - [ ] `getRecentMessages(conversationId, maxCount)`: Get last N messages
    - [ ] `deleteConversation(id)`: Remove conversation
    - [ ] `loadFromStorage()` / `saveToStorage()`: Persistence

---

### Day 9: AI Agent Node - Advanced Features

**Goal:** Add streaming output, function calling, SKILL plugin system, and upgrade to IndexedDB.

- [ ] **9.1 Streaming Output (1.5h)**
  - [ ] Implement `streamChat(params)` in `llm.service.ts`
  - [ ] Implement `streamOpenAI(params)`:
    - [ ] Add `stream: true` to request body
    - [ ] Use `response.body?.getReader()` to read stream
    - [ ] Parse SSE format (`data: {...}`)
    - [ ] Accumulate content and call `onChunk(delta)` callback
    - [ ] Return complete `LLMResponse`
  - [ ] Implement `streamAnthropic(params)`: Parse Claude SSE format
  - [ ] Error handling: fallback to non-streaming on failure

- [ ] **9.2 Worker Callback Extension (30min)**
  - [ ] Extend `WorkerCallbacks` interface:
    - [ ] Add `onStreamChunk?(nodeId, chunk)` optional callback
  - [ ] Update `executeAIAgent`:
    - [ ] Pass `onChunk` callback in streaming mode
    - [ ] Call `callbacks.onStreamChunk?.(nodeId, chunk)`

- [ ] **9.3 IndexedDB Storage Upgrade (1h)**
  - [ ] Install dependency: `npm install idb`
  - [ ] Create `src/utils/indexeddb.ts`
  - [ ] Define `EdgeFlowDB` schema:
    - [ ] `conversations` store (id index + updatedAt index)
    - [ ] `apiKeys` store (id index)
  - [ ] Implement `IndexedDBService` class:
    - [ ] `init()`: Initialize with `openDB`
    - [ ] `saveConversation(conversation)`
    - [ ] `getConversation(id)`
    - [ ] `getAllConversations()`
    - [ ] `deleteConversation(id)`
  - [ ] Replace localStorage with IndexedDB in `ConversationService`

- [ ] **9.4 Function Calling Implementation (1.5h)**
  - [ ] Create `src/workers/services/function-calling.service.ts`
  - [ ] Define `FunctionDefinition` and `FunctionExecutionResult` interfaces
  - [ ] Implement `FunctionCallingService` class:
    - [ ] `registerFunction(name, fn, definition)`: Register tool function
    - [ ] `getFunctionDefinitions()`: Get all definitions for LLM
    - [ ] `executeFunctionCall(name, arguments_)`: Execute and return result
    - [ ] `handleLLMFunctionCall(functionCall)`: Process LLM tool call
  - [ ] Integrate in `LLMService`:
    - [ ] Add `functions?` optional parameter to `chat()`
    - [ ] Include `tools` field in request body
    - [ ] Detect `finish_reason: 'function_call'` or `tool_calls`
    - [ ] Return `functionCall` field in response
  - [ ] Update `WorkflowEngine`:
    - [ ] Detect `functionCall` in response
    - [ ] Call `FunctionCallingService` to execute
    - [ ] Append result to messages and call LLM again

- [ ] **9.5 SKILL Plugin System (1.5h)**
  - [ ] Create `src/workers/services/skill-loader.service.ts`
  - [ ] Define `Skill` interface (name, version, description, execute)
  - [ ] Implement `SkillLoaderService` class:
    - [ ] `loadFromGitHub(url)`: Fetch raw code and eval
    - [ ] `loadFromNPM(packageName)`: Dynamic import via esm.sh CDN
    - [ ] `evalSkill(code)`: Sandbox with `new Function`, validate interface
    - [ ] `getSkill(name)`: Retrieve loaded skill
    - [ ] `executeSkill(name, input)`: Execute skill
  - [ ] Integrate in `WorkflowEngine`:
    - [ ] Preload configured SKILLS on startup
    - [ ] Register SKILLS as Function Calling tools
    - [ ] Unified execution entry point

- [ ] **9.6 Prompt Template Management (30min)**
  - [ ] Create `src/utils/prompt-templates.ts`
  - [ ] Define `PromptTemplate` interface
  - [ ] Define `PROMPT_TEMPLATES` constant array:
    - [ ] Text Summarization
    - [ ] Code Review
    - [ ] Translation
    - [ ] JSON Transformation
    - [ ] Blog Generation
  - [ ] Implement `PromptTemplateService` class:
    - [ ] `getAllTemplates()`
    - [ ] `getTemplate(id)`
    - [ ] `addTemplate(template)`
    - [ ] `removeTemplate(id)`
  - [ ] Add template selector in `nodeRegistry.ts`

- [ ] **9.7 UI Component Updates (Optional)**
  - [ ] Extend `ParameterRender` component:
    - [ ] `ai-template` type: Dropdown for template selection
    - [ ] `skill-source` type: SKILL source configuration form
  - [ ] Add template auto-fill logic
  - [ ] Add streaming output UI display

---

## 🚀 Git Workflow

```bash
# Initialize
git init
git add .
git commit -m "Initial: Project scaffold with detailed plan"

# Create Repo on GitHub called 'edgeflow'
git remote add origin https://github.com/YOUR_USER/edgeflow.git
git push -u origin main
```
