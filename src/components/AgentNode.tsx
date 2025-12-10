import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Bot } from 'lucide-react';
import { memo } from 'react';

// 定义特定节点类型的数据结构
export type AgentNodeData = {
  label: string;
};


// 防止每次父组件更新时，这个节点都跟着重新渲染
export const AgentNode = memo(({ data, isConnectable }: NodeProps<Node<AgentNodeData>>) => {
  return (
    // group 类名允许我们在悬停整个容器时改变子元素的样式
    <div className="relative flex items-center h-20 min-w-[240px] rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all hover:shadow-md hover:border-blue-400 group">
      
      {/* 输入连接点 (左侧) - 样式调整得更干净 */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-4 !h-4 !-left-[8px] !bg-slate-400 !border-2 !border-white transition-colors group-hover:!bg-blue-500"
      />

      {/* 左侧图标区域  */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mr-4">
        {/* 图标来自 lucide-react 库 */}
        <Bot size={22} />
      </div>

      {/* 中间标题区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-sm font-bold text-slate-800">
          {data.label || 'Agent Node'}
        </div>
        <div className="truncate text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          AI Agent
        </div>
      </div>

      {/* 右侧状态点 (n8n 风格) - 通常用于指示“运行中”、“成功”或“失败” */}
      {/* 目前是写死的绿色，后面我们可以让它动起来 */}
      <div className="ml-4 flex items-center justify-center">
         <div className="h-2 w-2 rounded-full bg-green-500 ring-4 ring-green-100" />
      </div>

      {/* 输出连接点 (右侧) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-4 !h-4 !-right-[8px] !bg-slate-400 !border-2 !border-white transition-colors group-hover:!bg-blue-500"
      />
    </div>
  );
});
