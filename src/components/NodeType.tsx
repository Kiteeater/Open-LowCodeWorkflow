import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';
import { memo } from 'react';
import { nodeRegistry, type NodeHandle } from '@/registry/nodeRegistry';
import { cn } from '@/lib/utils';

// 定义特定节点类型的数据结构
export type BasicNodeData = {
  label?: string;
};


// 防止每次父组件更新时，这个节点都跟着重新渲染
export const BasicNode = memo(({ data, isConnectable, type, selected }: NodeProps<Node<BasicNodeData>>) => {
  // 根据 type 从注册表中获取定义
  const definition = type ? nodeRegistry[type] : null;
  const Icon = definition?.icon || HelpCircle;
  const nodeTypeName = definition?.label || 'Unknown Node';

  // 默认句柄：一进（左）一出（右）
  const defaultHandles: NodeHandle[] = [
    { id: 'input', type: 'target', position: Position.Left },
    { id: 'output', type: 'source', position: Position.Right },
  ];

  const handles = definition?.handles || defaultHandles;

  // 分组统计每一侧的句柄，用于自动布局偏移
  const sideCounts: Record<string, number> = {};
  const sideIndex: Record<string, number> = {};
  
  handles.forEach((h) => {
    sideCounts[h.position] = (sideCounts[h.position] || 0) + 1;
  });

  return (
    <div 
        className={cn(
            "relative flex items-center h-[72px] min-w-[240px] bg-white rounded-lg shadow-sm border transition-all duration-200 group",
            // Selected State: Brand Ring
            selected ? "ring-2 ring-primary border-transparent shadow-md" : "border-slate-200 hover:border-blue-300 hover:shadow-md"
        )}
    >
      
      {/* Dynamic Handles */}
      {handles.map((handle) => {
        const pos = handle.position;
        const total = sideCounts[pos];
        const currentIdx = sideIndex[pos] || 0;
        sideIndex[pos] = currentIdx + 1;

        // 计算偏移百分比，确保句柄沿边缘均匀分布
        // 如果只有一个，就是 50%
        // 如果有多个，例如 2 个：33.3% 和 66.6%
        const offset = `${((currentIdx + 1) * 100) / (total + 1)}%`;
        
        const style: React.CSSProperties = {};
        if (pos === Position.Left || pos === Position.Right) {
          style.top = offset;
        } else {
          style.left = offset;
        }

        return (
          <Handle
            key={handle.id}
            id={handle.id}
            type={handle.type}
            position={pos}
            isConnectable={isConnectable}
            style={style}
            className={cn(
                "!w-3 !h-3 transition-all",
                "!bg-slate-400 !border-2 !border-white",
                "group-hover:!bg-primary group-hover:scale-125",
                // 不同位置的微调偏移（使其看起来像在边框边缘）
                pos === Position.Left && "!-left-[6px]",
                pos === Position.Right && "!-right-[6px]",
                pos === Position.Top && "!-top-[6px]",
                pos === Position.Bottom && "!-bottom-[6px]"
            )}
          />
        );
      })}

      {/* Visual Accent Strip (Left) - Optional n8n touch */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/80 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Icon Area */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600 ml-4 mr-3 border border-slate-100 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
        <Icon size={20} strokeWidth={1.5} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden mr-4">
        <div className="truncate text-[13px] font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
          {data.label || nodeTypeName}
        </div>
        <div className="truncate text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">
          {nodeTypeName}
        </div>
      </div>

      {/* Status/Output Area (n8n usually puts status on top right, but we keep it simple) */}
      <div className="pr-4 flex items-center justify-center">
         {/* Placeholder for status or menu dots */}
         <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-green-500 transition-colors" />
      </div>
    </div>
  );
});
