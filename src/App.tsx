import './App.css'
import FlowSidebar from './components/FlowSidebar';
import {useFlowStore} from './store/useFlowStore'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css';
import { AgentNode } from './components/AgentNode';

const nodeTypes = {
  agent: AgentNode,
};

function App() {
  // 获取设置选中节点的方法
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId } = useFlowStore();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        
        // <--- 关键：点击节点时，更新 Store
        onNodeClick={(_, node) => {
            console.log('Clicked node:', node.id);
            setSelectedNodeId(node.id);
        }}
        // 点击画布空白处时，取消选中 (可选，体验更好)
        onPaneClick={() => setSelectedNodeId(null)} 
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#94a3b8" />
      </ReactFlow>
      {/* <--- 关键：放入侧边栏组件 */}
      <FlowSidebar />
    </div>
  )
}

export default App
