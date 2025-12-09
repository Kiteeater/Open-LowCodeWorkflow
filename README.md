# n8n-lite: High-Performance Workflow Engine

## 📅 Project Plan Checklist

### Day 1: High-Performance Graph Core & State Architecture

**Focus:** Zustand + Immer State Management, Selective Rendering, Custom Nodes.

- [x] **1.1 Project Initialization & Configuration**

  - [x] Initialize Vite + React + TS project
  - [x] Configure Path Alias (`@/*`)
  - [x] Install dependencies (Zustand, Immer, @xyflow/react, shadcn/ui utils, Tailwind)
  - [x] Directory Structure (`src/store`, `src/nodes`, `src/components/canvas`)

- [ ] **1.2 Zustand Store (With Immer)**

  - [ ] Create `src/store/useFlowStore.ts`
  - [ ] Implement `nodes`, `edges`, `executionState`, `sidebarOpen`
  - [ ] Implement `onNodesChange` and `onEdgesChange` actions
  - [ ] Implement `toggleSidebar` action

- [ ] **1.3 Selective Rendering Optimization**

  - [ ] Use Selector Pattern (e.g. `useFlowStore(s => s.nodes)`)
  - [ ] Verify Canvas doesn't re-render on Sidebar toggle

- [ ] **1.4 "n8n Style" Custom Node**

  - [ ] Create `src/nodes/AgentNode.tsx`
  - [ ] UI: Header (Icon/Title/Status), Content (Params Preview)
  - [ ] Custom `<Handle />` styling

- [ ] **1.5 Dynamic Animated Edge**

  - [ ] Create `src/components/canvas/CustomEdge.tsx`
  - [ ] Implement `stroke-dasharray` animation based on `data.animated`
  - [ ] Use `getBezierPath`

- [ ] **1.6 Cycle Detection**
  - [ ] Implement Ancestor Check in `onConnect`
  - [ ] Prevent cyclic connections

---

### Day 2: Metadata-Driven & Dynamic Form Engine

**Focus:** Low-Code Metadata, React Hook Form, Custom Expression Input.

- [ ] **2.1 Node Registry**

  - [ ] Create `src/config/nodeRegistry.ts`
  - [ ] Define Schema: Inputs, Outputs, Properties (UI config)

- [ ] **2.2 Sidebar Drawer Integration**

  - [ ] Implement Sidebar with `Sheet` / Drawer component
  - [ ] Connect `selectedNodeId` from Store

- [ ] **2.3 React Hook Form Integration**

  - [ ] Setup `useForm` in Sidebar
  - [ ] Implement `useEffect` to reset form when Node selection changes

- [ ] **2.4 Expression Input Component**

  - [ ] Create `<ExpressionInput />`
  - [ ] Implement "Fixed" vs "Expression" mode toggle

- [ ] **2.5 Simple Autocomplete**
  - [ ] Implement `{{` trigger in Expression mode
  - [ ] Filter upstream nodes for autocomplete suggestions

---

### Day 3: Execution Simulator & Visual Debugging

**Focus:** FSM (Finite State Machine), Graph Traversal, Visual Feedback.

- [ ] **3.1 Topological Sort**

  - [ ] Implement `getExecutionOrder(nodes, edges)` utility

- [ ] **3.2 Execution State Machine**

  - [ ] Add `execution` slice to Store (`status`, `nodeStatus`, `nodeData`)

- [ ] **3.3 Frontend Execution Engine**

  - [ ] Implement `runWorkflow()` runner
  - [ ] Simulate async API calls (delay)
  - [ ] Write Output Data to Store

- [ ] **3.4 Node State Visual Feedback**

  - [ ] Update `AgentNode` to reflect `running` (pulse), `completed` (check), `error` states

- [ ] **3.5 Data Overlay Popover**

  - [ ] Implement Hover Card for "Input/Output Snapshot"
  - [ ] Render data JSON

- [ ] **3.6 Final Integration Test**
  - [ ] E2E Flow: Chat Input -> LLM Chain (with Expression) -> Run -> Inspect

---

## 🚀 How to Sync to GitHub

It looks like this is a new project. Here is how to push it to GitHub:

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
    - Do **not** check "Initialize with README" (since we have one).

5.  **Link Remote & Push**:
    - Copy the URL provided by GitHub (e.g., `https://github.com/your-username/n8n-lite.git`).
    - Run:
    ```bash
    git remote add origin https://github.com/your-username/n8n-lite.git
    git branch -M main
    git push -u origin main
    ```
