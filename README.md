# n8n-lite: High-Performance Workflow Engine

## 📅 Project Plan Checklist

### Day 1: Canvas Core —— React Flow & Zustand Integration

**Goal:** Build project skeleton, implement canvas drag & drop, connections, and state storage.

- [x] **1.1 Environment Setup (1h)**

  - [x] Initialize Vite + React + TypeScript.
  - [x] Install dependencies: @xyflow/react, zustand, immer, lucide-react.
  - [x] Configure Tailwind CSS.

- [x] **1.2 State Management Design (2h)**

  - [x] Principles: Understand Zustand `set`/`get`, and why `immer` is needed for nested objects.
  - [x] Implementation: Create `store.ts`. Define `nodes`, `edges` state. Implement `onNodesChange`, `onEdgesChange`, `onConnect` actions.
  - [ ] _Study: Zustand Best Practices_

- [ ] **1.3 Custom Node UI (3h)**
  - [ ] Principles: React Flow Custom Node (`nodeTypes`) mechanics.
  - [ ] Implementation:
    - [ ] Create `AgentNode.tsx`.
    - [ ] Style: Left Icon, Center Title, Right Status Dot (n8n style).
    - [ ] Key: Use `<Handle />` component. Implement "Left-In, Right-Out" layout.
  - [ ] _Reference: React Flow Custom Node Example_

---

### Day 2: Metadata Driven —— Dynamic Form System

**Goal:** "Configuration is UI". Click node -> Open Drawer -> Generate Form based on config.

- [ ] **2.1 Sidebar Drawer & Selection Logic (2h)**

  - [ ] Implementation: Import `shadcn/ui` Sheet component.
  - [ ] Logic: Click node -> Store records `selectedNodeId` -> Trigger Sidebar open.

- [ ] **2.2 JSON Schema Design (2h)**

  - [ ] Principles: Understand n8n `INodeType` interface design.
  - [ ] Implementation: Create `nodeRegistry.ts`. Define config for Webhook and LLM Chain (properties: label, inputs, parameters).
  - [ ] _Reference: n8n Node Definition Source (properties only)_

- [ ] **2.3 Dynamic Form Rendering (4h)**
  - [ ] Principles: React Hook Form `useForm` and `Controller`.
  - [ ] Implementation:
    - [ ] Create `ParameterRender` component.
    - [ ] Iterate node configuration `parameters`.
    - [ ] If `type: 'string'` -> Render Input.
    - [ ] If `type: 'select'` -> Render Select.
  - [ ] Challenge: Sync updates to Store's Node `data` field when form changes.

---

### Day 3: Initial Run —— Main Thread Executor

**Goal:** Run logic without Workers first.

- [ ] **3.1 Simple Topological Sort (3h)**

  - [ ] Principles: DAG (Directed Acyclic Graph) & BFS (Breadth-First Search).
  - [ ] Implementation: Write helper function `getExecutionSequence(nodes, edges)`.
  - [ ] _Study: Graph Traversal Algorithms_

- [ ] **3.2 Mock Execution Logic (3h)**

  - [ ] Implementation: Implement `runWorkflow` function.
  - [ ] Traverse nodes in sequence.
  - [ ] If LLM Node: `await new Promise(...)` to simulate request.
  - [ ] Write results to Store's `executionResults`.

- [ ] **3.3 Visual Feedback (2h)**
  - [ ] Implementation: Change node border color based on `executionResults` status (Loading Yellow -> Success Green).

---

### Phase 2: Architecture Refactoring & Deep Tech (Day 4 - Day 7)

**Goal:** Transform simple React App into a high-performance, Worker & AST based professional engine.

### Day 4: Layered Architecture —— Web Worker Multithreading

**Goal:** Move execution logic out of main thread. UI is UI, Calculation is Calculation.

- [ ] **4.1 Web Worker Basics (2h)**

  - [ ] Principles: Event Loop, Worker communication.
  - [ ] Implementation: Create simple `test.worker.ts`, Main sends "ping", Worker replies "pong".
  - [ ] _Study: MDN Web Workers API_

- [ ] **4.2 Introduce Comlink (2h)**

  - [ ] Principles: RPC (Remote Procedure Call) concept.
  - [ ] Implementation: Wrap Worker with `comlink`. Expose Worker functions as Promise objects.

- [ ] **4.3 Migrate Execution Engine (4h)**
  - [ ] Implementation:
    - [ ] Move `runWorkflow` logic from Day 3 to Worker.
    - [ ] Main Thread responsibility: 1. Send full Graph JSON to Worker. 2. Listen for progress events from Worker.

---

### Day 5: Intelligent Core —— AST Syntax Analysis

**Goal:** Implement real variable reference `{{ $node["A"].data }}` instead of regex replacement.

- [ ] **5.1 Abstract Syntax Tree (AST) Cognition (2h)**

  - [ ] Principles: Lexer -> Parser.
  - [ ] Tool: Play with AST Explorer (Input `$node.MyNode.data` -> Observe Tree).

- [ ] **5.2 Introduce Acorn Parser (3h)**

  - [ ] Implementation: Install `acorn`.
  - [ ] Write `parseExpression(code)`.
  - [ ] Identify `MemberExpression`, extract all referenced node names.

- [ ] **5.3 Dependency Injection (3h)**
  - [ ] Logic: Before executing node code in Worker, analyze AST, look up upstream node data in `executionResults`, and inject into execution context.

---

### Day 6: Security Sandbox —— Proxy & Execution Environment

**Goal:** Execute user code safely in Worker.

- [ ] **6.1 Proxy Object (3h)**

  - [ ] Principles: ES6 Proxy `get` trap.
  - [ ] Implementation: Create `sandboxProxy`. Intercept access to `window`, `document`, `fetch` (return undefined or throw error).
  - [ ] _Study: MDN Proxy_

- [ ] **6.2 Function Constructor Execution (3h)**
  - [ ] Implementation:
    ```javascript
    const safeRun = new Function(
      "sandbox",
      "with(sandbox) { return " + userCode + " }"
    );
    safeRun(sandboxProxy);
    ```
  - [ ] Test: Try `window.location.href = ...` in input, ensure intercepted.

---

### Day 7: Final Polish & Resume Output

**Goal:** Optimize experience, fix bugs, clean code, prepare interview materials.

- [ ] **7.1 Monaco Editor Integration (3h)**

  - [ ] Implementation: Replace Day 2 Input with Monaco Editor.
  - [ ] Show-off: Use Day 5 AST analysis results to implement simple code autocomplete.

- [ ] **7.2 Data Perspective Overlay (2h)**

  - [ ] Implementation: Hover node to show final JSON data generated in Worker.

- [ ] **7.3 Resume & Demo Preparation (3h)**
  - [ ] Task: Record GIF (Drag -> Connect -> Code Ref -> Run -> Animation -> Result).
  - [ ] Update README with tech keywords used in these 7 days.

---

## 🚀 How to Sync to GitHub

1.  **Initialize Git** (if not already done):

    ```bash
    git init
    ```

2.  **Add Files**:

    ```bash
    git add .
    ```

3.  **Commit**:

    ```bash
    git commit -m "Initial commit: Project scaffold and plan"
    ```

4.  **Create a Repository on GitHub**:

    - Go to [GitHub.com/new](https://github.new)
    - Name it `n8n-lite-graph` (or similar).
    - Do **not** check "Initialize with README".

5.  **Link Remote & Push**:
    - Copy the URL provided by GitHub.
    - Run:
    ```bash
    git remote add origin https://github.com/your-username/n8n-lite.git
    git branch -M main
    git push -u origin main
    ```
