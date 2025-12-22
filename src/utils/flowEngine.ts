import { type Node, type Edge } from '@xyflow/react';
import { 
  type WorkflowNodeData, 
  type HttpRequestNodeData 
} from '@/types/workflow';

/**
 * 获取工作流节点的执行序列 (基于 Kahn's Algorithm 拓扑排序)
 * 
 * 算法逻辑：
 * 1. 初始化入度 (inDegree) 和邻接表 (adjacencyList)。
 * 2. 统计每个节点的入度 (有多少条边指向该节点)。
 * 3. 将所有入度为 0 的节点加入初始队列。
 * 4. 循环处理队列：
 *    - 出队一个节点，放入结果序列。
 *    - 遍历该节点指向的所有下游节点，将其入度减 1。
 *    - 如果下游节点入度减为 0，则入队。
 * 5. 如果没有连线，算法会按 nodes 数组的原始顺序处理入度为 0 的节点。
 * 
 * 
 * @param nodes ReactFlow 节点数组
 * @param edges ReactFlow 连线数组
 * @returns 排序后的 nodeId 字符串数组
 * 
 * @deprecated Logic moved to Web Worker (workflow.worker.ts)
 */
export function getExecutionSequence(nodes: Node[], edges: Edge[]): string[] {
  const inDegree: Record<string, number> = {};
  const adjacencyList: Record<string, string[]> = {};

  // 1. 初始化，确保所有节点都在 map 中
  nodes.forEach((node) => {
    inDegree[node.id] = 0;
    adjacencyList[node.id] = [];
  });

  // 2. 构建图结构：计算入度并填充邻接表
  edges.forEach((edge) => {
    const { source, target } = edge;
    // 只有当源节点和目标节点都存在于节点列表中时才统计 (过滤可能的失效连线)
    if (inDegree[target] !== undefined && adjacencyList[source] !== undefined) {
      inDegree[target]++;
        adjacencyList[source].push(target);
    }
  });

  // 3. 将初始入度为 0 的节点加入队列
  // 按 nodes 数组的原始顺序加入，以满足“无连线按原始顺序”的需求
  const queue: string[] = nodes
    .filter((node) => inDegree[node.id] === 0)
    .map((node) => node.id);

  const sequence: string[] = [];

  // 4. BFS 拓扑排序核心逻辑
  while (queue.length > 0) {
    const u = queue.shift()!;
    sequence.push(u);

    const neighbors = adjacencyList[u];
    if (neighbors) {
      neighbors.forEach((v) => {
        inDegree[v]--;
        // 如果入度减到 0，意味着其依赖已全部排入序列
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      });
    }
  }

  // 注意：如果图中存在环，sequence 的长度将小于实际节点数
  // 在当前阶段，如果需要返回所有节点，可以在此处将未排序的节点补齐
  // 但标准的拓扑排序通常只返回可排序的结果。根据需求，这里直接返回 sequence。
  
  return sequence;
}

/**
 * 异步执行工作流引擎
 * 
 * @param nodes 节点数组
 * @param edges 连线数组
 * @param actions 状态更新回调对象
 * 
 * @deprecated Logic moved to Web Worker (workflow.worker.ts)
 */
export async function runWorkflow(  
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  actions: {
    setNodeStatus: (id: string, status: 'idle' | 'running' | 'success' | 'error') => void;
    setNodeResult: (id: string, result: unknown) => void;
    setExecutionState: (state: 'idle' | 'running' | 'paused') => void;
  }
) {
  // 1. 获取执行顺序
  const sequence = getExecutionSequence(nodes as Node[], edges);
  
  // 2. 设置全局执行状态
  actions.setExecutionState('running');

  // 3. 按序执行节点
  for (const nodeId of sequence) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // 更新当前节点状态为运行中
    actions.setNodeStatus(nodeId, 'running');

    try {
      let result: unknown = null;

      // 特化处理 HTTP 节点
      if (node.type === 'http-request') {
        const data = node.data as HttpRequestNodeData;
        const { url, method = 'GET', useProxy } = data;
        
        if (!url) {
          throw new Error('HTTP Request node missing URL');
        }

        // 处理代理逻辑：绕过 CORS
        const finalUrl = useProxy 
          ? `https://cors-anywhere.herokuapp.com/${url}` 
          : url;

        const response = await fetch(finalUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        result = await response.json();
      } else {
        // 其他类型节点模拟执行逻辑
        await new Promise((resolve) => setTimeout(resolve, 800));
        result = { 
          executedAt: new Date().toISOString(),
          message: `Node ${node.id} executed successfully` 
        };
      }

      // 存储结果并更新状态为成功
      actions.setNodeResult(nodeId, result);
      actions.setNodeStatus(nodeId, 'success');

    } catch (error) {
      // 捕获异常：记录错误并中断后续节点的执行
      console.error(`Execution failed at node ${nodeId}:`, error);
      actions.setNodeStatus(nodeId, 'error');
      
      // 中断流程
      actions.setExecutionState('idle');
      return; 
    }
  }

  // 4. 所有节点执行完毕，恢复全局状态
  actions.setExecutionState('idle');
}

