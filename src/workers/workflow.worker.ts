import * as Comlink from 'comlink';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData, HttpRequestNodeData, CodeNodeData } from '../types/workflow';
import { extractDependencies } from '../utils/ast-parser';

// 定义回调接口：主线程通过 Comlink.proxy 传递此对象
export interface WorkerCallbacks {
  onNodeStatusChange: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error"
  ) => void;
  onNodeResult: (nodeId: string, result: unknown) => void;
  onExecutionStateChange: (state: "idle" | "running" | "paused") => void;
}

export class WorkflowEngine {

  /**
   * 获取工作流节点的执行序列 (基于 Kahn's Algorithm 拓扑排序)
   */
  private getExecutionSequence(nodes: Node[], edges: Edge[]): string[] {
    const inDegree: Record<string, number> = {};
    const adjacencyList: Record<string, string[]> = {};

    // 1. 初始化
    nodes.forEach((node) => {
      inDegree[node.id] = 0;
      adjacencyList[node.id] = [];
    });

    // 2. 构建图
    edges.forEach((edge) => {
      const { source, target } = edge;
      if (inDegree[target] !== undefined && adjacencyList[source] !== undefined) {
        inDegree[target]++;
        adjacencyList[source].push(target);
      }
    });

    // 3. 寻找入度为 0 的节点 (按原始顺序)
    const queue: string[] = nodes
      .filter((node) => inDegree[node.id] === 0)
      .map((node) => node.id);

    const sequence: string[] = [];

    // 4. BFS
    while (queue.length > 0) {
      const u = queue.shift()!;
      sequence.push(u);

      const neighbors = adjacencyList[u];
      if (neighbors) {
        neighbors.forEach((v) => {
          inDegree[v]--;
          if (inDegree[v] === 0) {
            queue.push(v);
          }
        });
      }
    }

    return sequence;
  }

  /**
   * 执行工作流
   * 注意：actions 必须是 Comlink.proxy(callbacks) 包装过的远程对象
   */
  public async runWorkflow(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    callbacks: WorkerCallbacks
  ) {
    try {
      // 1. 计算执行顺序
      const sequence = this.getExecutionSequence(nodes, edges);

      // 2. 通知开始
      await callbacks.onExecutionStateChange('running');

      // 3. 结果池与名称映射（node里只有id没有label  ）
      const executionResults: Record<string, unknown> = {};
      const labelToIdMap: Record<string, string> = {};
      nodes.forEach(n => {
        if (n.data?.label) {
          labelToIdMap[n.data.label] = n.id;
        }
      });

      // 4. 顺序执行
      for (const nodeId of sequence) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // 状态：运行中
        await callbacks.onNodeStatusChange(nodeId, 'running');

        try {
          let result: unknown = null;

          // --- 智能化核心：数据感知与注入 ---
          const nodeCode = (node.type === 'code' ? (node.data as CodeNodeData).code : '') || '';
          const dependencies = extractDependencies(nodeCode);
          // console.log('dependencies', dependencies)
          const contextNodeData: Record<string, { data: unknown }> = {};

          dependencies.forEach(depLabel => {
            const depId = labelToIdMap[depLabel];
            if (depId && executionResults[depId] !== undefined) {
              contextNodeData[depLabel] = { data: executionResults[depId] };
            } else {
              console.warn(`[WorkflowWorker] Node "${node.data.label || nodeId}" references "${depLabel}", but its data is not available yet.`);
            }
          });

          // 打印感知到的数据上下文 (调试用)
          if (Object.keys(contextNodeData).length > 0) {
            console.log(
              `[WorkflowWorker] Node "${
                node.data.label || nodeId
              }" injected with context:`,
              contextNodeData
            );
          }

          // --- 执行逻辑 (保留原 flowEngine 逻辑) ---
          if (node.type === 'http-request') {
            const data = node.data as HttpRequestNodeData;
            const { url, method = 'GET', useProxy } = data;

            if (!url) throw new Error('HTTP Request node missing URL');

            const finalUrl = useProxy
              ? `https://cors-anywhere.herokuapp.com/${url}`
              : url;

            const response = await fetch(finalUrl, {
              method,
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error(`HTTP Error: ${response.status}`);
            }

            result = await response.json();
          } else if (node.type === 'code') {
            try {
              // 模拟耗时 (可选，为了 UI 效果)
              // await new Promise((resolve) => setTimeout(resolve, 300));

              // 构造执行环境
              // 注意：为了让用户能直接写 "$node["A"].data"，我们需要将代码包装一下
              // 或者约定用户代码需要 return 一个值
              const userCode = (node.data as CodeNodeData).code || '';

              // 构造执行环境 (Task 6.1)
              const context = {
                $node: contextNodeData,
                utils: {
                  json: (val: unknown) => JSON.stringify(val, null, 2),
                },
                console: {
                  log: (...args: unknown[]) => console.log(`[Node: ${node.data.label || nodeId}]`, ...args),
                }
              };

              const scopeKeys: string[] = Object.keys(context);
              const scopeValues: unknown[] = Object.values(context);
              
              // 安全加固 (Task 6.3)：影子屏蔽危险全局 API
              const forbiddenGlobals = ['fetch', 'self', 'XMLHttpRequest', 'indexedDB', 'postMessage', 'importScripts'];
              forbiddenGlobals.forEach(key => {
                if (!scopeKeys.includes(key)) {
                  scopeKeys.push(key);
                  scopeValues.push(null);
                }
              });
              
              // 构造动态函数 (Task 6.2)：支持 async/await 和 return
              // 将 userCode 包装在 async 立即执行函数中
              const sandbox = new Function(...scopeKeys, `
                return (async () => {
                  ${userCode.includes('return') ? userCode : `return (${userCode})`}
                })();
              `);
              
              result = await sandbox(...scopeValues);
              console.log(`[WorkflowWorker] Node "${node.data.label || nodeId}" execution result:`, result);
            } catch (evalError: unknown) {
              const message = evalError instanceof Error ? evalError.message : String(evalError);
              throw new Error(`Code Node execution failed: ${message}`);
            }
          } else {
            // 模拟耗时
            await new Promise((resolve) => setTimeout(resolve, 800));
            result = {
              executedAt: new Date().toISOString(),
              message: `Node ${node.id} executed successfully (in Worker)`,
            };
          }

          // 存入结果池
          executionResults[nodeId] = result;

          // 结果回传
          await callbacks.onNodeResult(nodeId, result);
          await callbacks.onNodeStatusChange(nodeId, 'success');

        } catch (error) {
          const nodeName = node?.data?.label || nodeId;
          console.error(`Worker execution failed at node ${nodeName}:`, error);
          await callbacks.onNodeStatusChange(nodeId, 'error');
          // 遇到错误中断
          await callbacks.onExecutionStateChange('idle');
          return;
        }
      }

      // 4. 全部完成
      await callbacks.onExecutionStateChange('idle');
      
    } catch (err) {
      console.error('Workflow execution error:', err);
      await callbacks.onExecutionStateChange('idle');
    }
  }
}

Comlink.expose(new WorkflowEngine());
