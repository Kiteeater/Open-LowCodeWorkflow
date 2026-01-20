import * as Comlink from 'comlink';
import type { Node, Edge } from '@xyflow/react';
import type {
  WorkflowNodeData,
  HttpRequestNodeData,
  CodeNodeData,
  AIAgentNodeData,
} from '../types/workflow';
import { extractDependencies } from '../utils/ast-parser';
import { LLMService } from './services/llm.service';
import { CryptoService } from './services/crypto.service';
import { injectVariables } from './utils/interpolation';
import type { LLMMessage } from '../types/llm';

// 定义回调接口：主线程通过 Comlink.proxy 传递此对象
export interface WorkerCallbacks {
  onNodeStatusChange: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error"
  ) => void;
  onNodeResult?: (nodeId: string, result: unknown) => void;
  onExecutionStateChange?: (state: "idle" | "running" | "paused") => void;
  onNodeError?: (nodeId: string, errorMessage: string) => void;
  getConversationHistory?: (nodeId: string) => LLMMessage[];
  appendConversationHistory?: (nodeId: string, messages: LLMMessage[]) => void;
}

export class WorkflowEngine {
  private llmService = new LLMService();
  private cryptoService = new CryptoService();

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
   * 执行 AI Agent 节点
   */
  private async executeAIAgent(
    node: Node<WorkflowNodeData>,
    contextNodeData: Record<string, { data: unknown }>,
    callbacks: WorkerCallbacks,
    _executionResults: Record<string, unknown>,
    _labelToIdMap: Record<string, string>,
  ): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
    // 类型守卫：确保 node.data 是 AIAgentNodeData
    if (node.type !== 'ai-agent') {
      return { success: false, error: 'Node type mismatch' };
    }

    const nodeData = node.data as AIAgentNodeData;

    // 1. 验证必填字段
    if (!nodeData.apiKey || nodeData.apiKey.trim() === '') {
      return { success: false, error: 'API Key is required' };
    }

    if (!nodeData.model || nodeData.model.trim() === '') {
      return { success: false, error: 'Model is required' };
    }

    try {
      // 2. 解密 API Key
      const decryptResult = await this.cryptoService.decrypt(nodeData.apiKey);
      if (!decryptResult.success) {
        return { success: false, error: 'Failed to decrypt API Key' };
      }
      const apiKey = decryptResult.decrypted;

      // 3. 获取对话历史（如果启用）
      const conversationHistory = nodeData.enableHistory
        ? (callbacks.getConversationHistory?.(node.id) ?? [])
        : [];

      // 4. 对历史进行截断（根据 maxHistoryRounds）
      const maxRounds = nodeData.maxHistoryRounds ?? 5;
      const truncatedHistory = this.truncateHistory(conversationHistory, maxRounds, nodeData.includeSystemMessageInHistory ?? false);

      // 5. 将上下文数据插值到 Prompt
      const interpolatedPrompt = injectVariables(nodeData.prompt, contextNodeData);

      // 6. 构建消息数组
      const messages = this.buildMessages(nodeData, interpolatedPrompt, truncatedHistory);

      // 7. 调用 LLM 服务
      const llmResult = await this.llmService.chat({
        provider: nodeData.provider,
        model: nodeData.model,
        messages,
        apiKey,
        temperature: nodeData.temperature ?? 0.7,
        maxTokens: nodeData.maxTokens ?? 1000,
      });

      if (!llmResult.success) {
        return { success: false, error: llmResult.error.message };
      }

      // 8. 保存对话历史（如果启用）
      if (nodeData.enableHistory) {
        const historyMessages: LLMMessage[] = [
          { role: 'user', content: interpolatedPrompt },
          { role: 'assistant', content: llmResult.data.content },
        ];

        callbacks.appendConversationHistory?.(node.id, historyMessages);
      }

      // 9. 返回结果
      return {
        success: true,
        data: {
          content: llmResult.data.content,
          usage: llmResult.data.usage,
          finishReason: llmResult.data.finishReason,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`AI Agent execution failed for node ${node.data?.label || node.id}:`, error);
      return { success: false, error: message };
    }
  }

  /**
   * 截断对话历史到最大轮数
   */
  private truncateHistory(
    history: LLMMessage[],
    maxRounds: number,
    _includeSystem: boolean,
  ): LLMMessage[] {
    if (history.length === 0) {
      return history;
    }

    // 每轮包含 user + assistant（可能还有 system）
    // 简单估算：每轮 2 条消息（user + assistant）
    const maxMessages = maxRounds * 2;

    if (history.length <= maxMessages) {
      return history;
    }

    // 保留最近的 N 轮
    return history.slice(-maxMessages);
  }

  /**
   * 构建消息数组
   */
  private buildMessages(
    nodeData: AIAgentNodeData,
    interpolatedPrompt: string,
    history: LLMMessage[],
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // 1. 添加历史消息
    messages.push(...history);

    // 2. 添加当前系统消息（如果有且不在历史中）
    if (nodeData.systemMessage && nodeData.systemMessage.trim() !== '') {
      // 检查历史中是否已包含系统消息
      const hasSystemInHistory = history.some(m => m.role === 'system');
      if (!hasSystemInHistory || nodeData.includeSystemMessageInHistory) {
        messages.push({ role: 'system', content: nodeData.systemMessage });
      }
    }

    // 3. 添加当前用户消息
    messages.push({ role: 'user', content: interpolatedPrompt });

    return messages;
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
      if (callbacks.onExecutionStateChange) {
        await callbacks.onExecutionStateChange('running');
      }

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
          } else if (node.type === 'ai-agent') {
            // --- AI Agent 节点执行逻辑 ---
            const aiResult = await this.executeAIAgent(
              node,
              contextNodeData,
              callbacks,
              executionResults,
              labelToIdMap,
            );

            if (!aiResult.success) {
              throw new Error(aiResult.error);
            }

            result = aiResult.data;
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
          if (callbacks.onNodeResult) {
            await callbacks.onNodeResult(nodeId, result);
          }
          await callbacks.onNodeStatusChange(nodeId, 'success');

        } catch (error) {
          const nodeName = node?.data?.label || nodeId;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Worker execution failed at node ${nodeName}:`, error);
          await callbacks.onNodeStatusChange(nodeId, 'error');
          // 调用错误回调
          if (callbacks.onNodeError) {
            await callbacks.onNodeError(nodeId, errorMessage);
          }
          // 遇到错误中断
          if (callbacks.onExecutionStateChange) {
            await callbacks.onExecutionStateChange('idle');
          }
          return;
        }
      }

      // 4. 全部完成
      if (callbacks.onExecutionStateChange) {
        await callbacks.onExecutionStateChange('idle');
      }

    } catch (err) {
      console.error('Workflow execution error:', err);
      if (callbacks.onExecutionStateChange) {
        await callbacks.onExecutionStateChange('idle');
      }
    }
  }
}

Comlink.expose(new WorkflowEngine());
