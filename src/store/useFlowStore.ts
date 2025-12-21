import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import {
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    type NodeChange,
    type EdgeChange,
    type OnConnect,
    addEdge,
} from '@xyflow/react'
import { type WorkflowNodeData } from '@/types/workflow';


//定义节点类型
interface FlowState {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    executionState: 'idle' | 'running' | 'paused'; //整体执行状态
    sidebarOpen: boolean; //侧边栏开关
    selectedNodeId: string | null; //选中的节点ID
    executionStatus: Record<string, 'idle' | 'running' | 'success' | 'error'>;
    executionResults: Record<string, unknown>;
}

//定义节点操作

interface FlowAction {
    //设置节点，边界，侧边栏和执行状态
    setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
    setEdges: (edges: Edge[]) => void;
    toggleSidebar: () => void;
    setExecutionState: (state: 'idle' | 'running' | 'paused') => void;
    //拖拽逻辑
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setSelectedNodeId: (id: string | null) => void;
    updateNodeData: (nodeId: string, newData: Record<string, unknown>) => void;
    
    // 执行引擎相关
    setNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void;
    setNodeResult: (nodeId: string, result: unknown) => void;
    resetExecution: () => void;
}

//创建Store

export const useFlowStore = create<FlowState & FlowAction>()(
    persist(
        immer((set) => ({
            nodes: [],
            edges: [],
            executionState: 'idle',
            sidebarOpen: false,
            selectedNodeId: null,
            executionStatus: {},
            executionResults: {},

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
            //设置选中节点
            setSelectedNodeId: (id: string | null) => set((state) => {
                state.selectedNodeId = id;
            }),


            //拖拽
            onNodesChange: (changes: NodeChange[]) => set((state) => {
                state.nodes = applyNodeChanges(changes, state.nodes);  //React Flow提供的函数
            }),
            onEdgesChange: (changes: EdgeChange[]) => set((state) => {
                state.edges = applyEdgeChanges(changes, state.edges)
            }),
            onConnect: (connection) => set((state) => {
                state.edges = addEdge(connection, state.edges);
            }),

            //精确更新节点数据
            updateNodeData: (nodeId, newData) => set((state) => {
                const node = state.nodes.find((n) => n.id === nodeId);
                if (node) {
                    // Immer 允许直接修改，它会处理好不可变性
                    // 这里做浅合并：保留原有的 data，只覆盖新传入的字段
                    node.data = { ...node.data, ...newData };
                }
            }),

            // 执行引擎相关实现
            setNodeStatus: (nodeId, status) => set((state) => {
                state.executionStatus[nodeId] = status;
            }),
            setNodeResult: (nodeId, result) => set((state) => {
                state.executionResults[nodeId] = result;
            }),
            resetExecution: () => set((state) => {
                state.executionStatus = {};
                state.executionResults = {};
                state.executionState = 'idle';
            }),
        })),
        {
            name: 'edgeflow-storage', // 存储在 LocalStorage 中的 key
        }
    )
)