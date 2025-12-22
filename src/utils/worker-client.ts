import * as Comlink from 'comlink';
import type { WorkflowEngine, WorkerCallbacks } from '../workers/workflow.worker';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from '../types/workflow';
//看不懂的一段代码
export class WorkflowWorkerClient {
  private worker: Worker;
  private remoteApi: Comlink.Remote<WorkflowEngine>;

  constructor() {
    this.worker = new Worker(
      new URL('../workers/workflow.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.remoteApi = Comlink.wrap<WorkflowEngine>(this.worker); //comlink提供的代理

    console.log('Workflow Worker initialized with Comlink!');
  }


  public async runWorkflow(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    callbacks: WorkerCallbacks
  ) {
    // 关键：将回调对象包装为 Proxy，否则无法跨线程调用函数
    await this.remoteApi.runWorkflow(nodes, edges, Comlink.proxy(callbacks));
  }
}

// 单例模式，方便全局调用
export const workerClient = new WorkflowWorkerClient();
