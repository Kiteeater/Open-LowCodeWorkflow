import './App.css'
import React, { useCallback, useRef } from 'react';
import FlowSidebar from './components/FlowSidebar';
import NodePalette from './components/NodePalette';
import { useFlowStore } from './store/useFlowStore'
import { ReactFlow, Background, Controls, MiniMap, type ReactFlowInstance, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css';
import { BasicNode } from './components/NodeType';
import { runWorkflow } from './utils/flowEngine';
import { Play, Loader2 } from 'lucide-react';

// ⚡️ 映射所有注册的节点类型到我们的 AgentNode 组件
const nodeTypes = {
  'agent': BasicNode,         // 兼容旧节点
  'ai-agent': BasicNode,      // 匹配 registry
  'http-request': BasicNode,
  'code': BasicNode,
};

function App() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, setNodes,
    executionState, setNodeStatus, setNodeResult, setExecutionState, resetExecution
  } = useFlowStore();

  // ⚡️ 执行工作流
  const handleRun = async () => {
    resetExecution();
    await runWorkflow(nodes, edges, {
      setNodeStatus,
      setNodeResult,
      setExecutionState
    });
  };

  // ⚡️ 处理拖拽逻辑
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // 验证是否存在该类型
      if (typeof type === 'undefined' || !type) return;

      // 获取鼠标在画布上的位置
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (position) {
          const newNode = {
            id: `${type}-${Date.now()}`, // 唯一 ID
            type,
            position,
            data: { label: `New ${type}` }, // 初始数据
          };
          
          setNodes([...nodes, newNode]);
      }
    },
    [reactFlowInstance, nodes, setNodes]
  );

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      {/* 🚀 左侧：节点库 */}
      <NodePalette />

      {/* 🎨 中间：主画布 */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* ⚡️ 控制栏：运行按钮 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <button
            onClick={handleRun}
            disabled={executionState === 'running'}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold shadow-lg transition-all
              ${executionState === 'running' 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}
            `}
          >
            {executionState === 'running' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {executionState === 'running' ? 'Running...' : 'Run Workflow'}
          </button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)} 
          fitView
        >
          {/* 使用 CSS 变量或更淡的 Slate 色 */}
          <Background color="#94a3b8" gap={20} size={1} variant={BackgroundVariant.Dots} className="opacity-20" />
          <Controls showInteractive={false} className="bg-white border-none shadow-lg rounded-lg text-slate-600" />
          <MiniMap 
            nodeColor="#64748b" 
            style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} 
            maskColor="rgba(248, 250, 252, 0.8)" 
            className="bg-white shadow-sm"
          />
        </ReactFlow>
      </div>

      {/* 🛠️ 右侧：配置详情 (由 selectedNodeId 驱动) */}
      <FlowSidebar />
    </div>
  );
}

export default App;
