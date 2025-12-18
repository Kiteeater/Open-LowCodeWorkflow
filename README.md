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

- [ ] **2.2 JSON Schema Registry (2h)**

  - [ ] Create `nodeRegistry.ts`.
  - [ ] Define "HTTP Request" Node (inputs: URL, Method, Body, **UseProxy**).
  - [ ] Define "Code" Node (inputs: Javascript Code).

- [ ] **2.3 Dynamic Form Rendering (4h)**
  - [ ] Use `react-hook-form`.
  - [ ] Create `ParameterRender` component.
  - [ ] Sync form changes back to Store Node Data (`updateNodeData`).

---

### Day 3: Initial Run —— Logic & Network Layer

**Goal:** Execute logic in Main Thread first, handling real network requests.

- [ ] **3.1 Topological Sort (3h)**

  - [ ] Implement `getExecutionSequence(nodes, edges)` using BFS/Kahn's Algorithm.

- [ ] **3.2 Execution Engine with Proxy Strategy (3h)**

  - [ ] Implement `runWorkflow` function.
  - [ ] **⚠️ [NEW] HTTP Node Implementation**:
    - [ ] Add logic: Check `node.data.useProxy`.
    - [ ] If true: Prepend `https://cors-anywhere.herokuapp.com/` to target URL.
    - [ ] If false: Fetch directly (Direct Mode).
  - [ ] Store results in `executionResults`.

- [ ] **3.3 Visual Feedback (2h)**
  - [ ] Update Node UI based on status (Yellow -> Green/Red).

---

### Phase 2: Architecture Refactoring (Day 4 - Day 7)

**Goal:** Transform into a professional, non-blocking engine.

### Day 4: Layered Architecture —— Web Worker & Comlink

**Goal:** Offload execution to Worker to keep UI at 60FPS.

- [ ] **4.1 Web Worker Setup (2h)**

  - [ ] Create `workflow.worker.ts`.
  - [ ] Test basic Ping/Pong message.

- [ ] **4.2 Comlink Integration (2h)**

  - [ ] Install `comlink`.
  - [ ] Expose Worker functions as RPC Promise objects.

- [ ] **4.3 Engine Migration (4h)**
  - [ ] Move `runWorkflow` and Topo Sort logic into Worker.
  - [ ] Main Thread: Send Graph JSON -> Await Result.

---

### Day 5: Intelligent Core —— AST Dependency Analysis

**Goal:** Support `{{ $node["A"].data }}` via static analysis.

- [ ] **5.1 AST Setup (2h)**

  - [ ] Install `acorn`.
  - [ ] Test parsing simple JS expressions in console.

- [ ] **5.2 Dependency Extraction (3h)**

  - [ ] Implement `extractDependencies(code)` using Acorn.
  - [ ] Walk the AST tree to find `MemberExpression` (e.g., `$node.Http`).

- [ ] **5.3 Data Injection Logic (3h)**
  - [ ] In Worker: Before running a node, parse its code.
  - [ ] Find dependencies -> Fetch data from `executionResults` -> Inject into context.

---

### Day 6: Secure Runtime —— Strict Mode Compatible Sandbox

**Goal:** Execute user code safely without using `with` (to support React Strict Mode).

- [ ] **6.1 Scope Preparation (2h)**

  - [ ] Define the context object: `const context = { $node: ..., utils: ..., console: ... }`.
  - [ ] Extract keys and values: `Object.keys(context)`, `Object.values(context)`.

- [ ] **6.2 Safe Execution Implementation (4h)**

  - [ ] **⚠️ [NEW] Replace `with` logic**:

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

  - [ ] Verify: Ensure variables defined in `context` are accessible in user code.

- [ ] **6.3 Security Hardening (Optional)**
  - [ ] Shadow dangerous globals in the Worker scope (e.g., `self.fetch = null` if needed).

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
