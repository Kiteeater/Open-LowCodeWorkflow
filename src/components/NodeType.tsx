import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { HelpCircle, Check, AlertCircle, Loader2 } from 'lucide-react';
import { memo } from 'react';
import { nodeRegistry } from '@/registry/nodeRegistry';
import { type NodeHandle, type WorkflowNodeData } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/store/useFlowStore';

// 防止每次父组件更新时，这个节点都跟着重新渲染
export const BasicNode = memo(({ id, data, isConnectable, type, selected }: NodeProps<Node<WorkflowNodeData>>) => {
  // 获取当前节点的执行状态
  const status = useFlowStore(state => state.executionStatus[id]);

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
            selected ? "ring-2 ring-primary border-transparent shadow-md" : "border-slate-200 hover:border-blue-300 hover:shadow-md",
            // Execution state border highlight
            status === 'running' && "border-blue-500 shadow-blue-100",
            status === 'success' && "border-emerald-500",
            status === 'error' && "border-rose-500"
        )}
    >
      
      {/* Execution Status Indicator Badge */}
      {status && (
        <div className="absolute -top-3 -right-2 z-20 transition-all animate-in zoom-in-50 duration-300">
          {status === 'running' && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 shadow-md ring-4 ring-white">
               <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 shadow-md ring-4 ring-white">
               <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-rose-500 shadow-md ring-4 ring-white">
               <AlertCircle className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
          )}
        </div>
      )}

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

      {/* Visual Accent Strip (Left) */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 bg-primary/80 rounded-l-lg transition-all",
        status === 'success' ? "bg-emerald-500 opacity-100" : 
        status === 'error' ? "bg-rose-500 opacity-100" : 
        status === 'running' ? "bg-blue-500 opacity-100 animate-pulse" : 
        "opacity-0 group-hover:opacity-100"
      )} />

      {/* Icon Area */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600 ml-4 mr-3 border border-slate-100 transition-colors",
        status === 'running' && "bg-blue-50 text-blue-500 border-blue-100",
        status === 'success' && "bg-emerald-50 text-emerald-500 border-emerald-100",
        status === 'error' && "bg-rose-50 text-rose-500 border-rose-100",
        !status && "group-hover:text-primary group-hover:bg-primary/5"
      )}>
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

      {/* Status/Output Area */}
      <div className="pr-4 flex items-center justify-center">
         <div className={cn(
           "h-2 w-2 rounded-full transition-all duration-500 shadow-sm",
           status === 'success' ? "bg-emerald-500 scale-125" : 
           status === 'error' ? "bg-rose-500 scale-125 animate-pulse" : 
           status === 'running' ? "bg-blue-500 scale-125 animate-bounce" : 
           "bg-slate-300 group-hover:bg-green-500"
         )} />
      </div>
    </div>
  );
});

