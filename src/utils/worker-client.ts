import * as Comlink from 'comlink';
import type { WorkflowEngine } from '../workers/workflow.worker';
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

  public async testConnection(name: string) {
    const result = await this.remoteApi.testConnection(name);
    console.log('Comlink RPC Result:', result);
    return result;
  }
}

// 单例模式，方便全局调用
export const workerClient = new WorkflowWorkerClient();
