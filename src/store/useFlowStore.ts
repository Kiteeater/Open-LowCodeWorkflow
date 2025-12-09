import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    type NodeChange,
    type EdgeChange
} from '@xyflow/react'


//定义节点类型
interface FlowState {
    nodes: Node[];
    edges: Edge[];
    executionState: 'idle' | 'running' | 'paused'; //node状态
    sidebarOpen: boolean; //侧边栏开关
}

//定义节点操作

interface FlowAction {
    //设置节点，边界，侧边栏和执行状态
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    toggleSidebar: () => void;
    setExecutionState: (state: 'idle' | 'running' | 'paused') => void;
    //拖拽逻辑
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
}

//创建Store

export const useFlowStore = create<FlowState & FlowAction>()(
    immer((set) => ({
        nodes: [],
        edges: [],
        executionState: 'idle',
        sidebarOpen: true,

        //设置节点
        setNodes: (nodes: Node[]) => set((state) => {
            state.nodes = nodes;
        }),
        //设置边界
        setEdges: (edges: Edge[]) => set((state) => {
            state.edges = edges;
        }),
        // 切换侧边栏：取反
        toggleSidebar: () => set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
        }),
        setExecutionState: (status) => set((state) => {
            state.executionState = status;
        }),


        //拖拽
        onNodesChange: (changes: NodeChange[]) => set((state) => {
            state.nodes = applyNodeChanges(changes, state.nodes);  //React Flow提供的函数
        }),
        onEdgesChange: (changes: EdgeChange[]) => set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges)
        }),
    }))
)