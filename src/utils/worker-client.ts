import * as Comlink from 'comlink';
import type { WorkflowEngine, WorkerCallbacks } from '../workers/workflow.worker';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from '../types/workflow';
import { useFlowStore } from '../store/useFlowStore';

export class WorkflowWorkerClient {
  private worker: Worker;
  private remoteApi: Comlink.Remote<WorkflowEngine>;

  constructor() {
    this.worker = new Worker(
      new URL('../workers/workflow.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.remoteApi = Comlink.wrap<WorkflowEngine>(this.worker);
    console.log('Workflow Worker initialized with Comlink!');
  }

  public async runWorkflow(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    callbacks: WorkerCallbacks
  ) {
    await this.remoteApi.runWorkflow(nodes, edges, this.wrapCallbacks(callbacks));
  }

  /**
   * 包装回调函数，添加错误处理和对话历史管理
   */
  private wrapCallbacks(callbacks: WorkerCallbacks): WorkerCallbacks {
    const { setNodeError, getConversationHistory, appendConversationHistory } = useFlowStore.getState();

    return Comlink.proxy({
      onNodeStatusChange: (nodeId: string, status: "idle" | "running" | "success" | "error") => {
        callbacks.onNodeStatusChange(nodeId, status);
      },
      onNodeResult: (nodeId: string, result: unknown) => {
        callbacks.onNodeResult?.(nodeId, result);
      },
      onExecutionStateChange: (state: "idle" | "running" | "paused") => {
        callbacks.onExecutionStateChange?.(state);
      },
      // 错误处理回调（8.7 错误显示系统）
      onNodeError: (nodeId: string, errorMessage: string) => {
        setNodeError(nodeId, errorMessage);
        callbacks.onNodeError?.(nodeId, errorMessage);
      },
      // 对话历史管理回调（8.6 Worker 集成）
      getConversationHistory: (nodeId: string) => {
        return getConversationHistory(nodeId);
      },
      appendConversationHistory: (nodeId: string, messages) => {
        appendConversationHistory(nodeId, messages);
        callbacks.appendConversationHistory?.(nodeId, messages);
      },
    }) as WorkerCallbacks;
  }
}

export const workerClient = new WorkflowWorkerClient();
