import React from 'react';
import { nodeRegistry } from '@/registry/nodeRegistry';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r border-slate-200/60 bg-white flex flex-col shadow-sm z-10">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          Nodes
        </h2>
        <span className="text-[10px] font-mono text-slate-400">
          {Object.keys(nodeRegistry).length} AVAILABLE
        </span>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.values(nodeRegistry).map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border border-transparent bg-slate-50/50 cursor-grab active:cursor-grabbing transition-all",
                "hover:bg-white hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5",
                "group"
              )}
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white border border-slate-100 text-slate-500 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                <Icon size={16} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-slate-700 truncate group-hover:text-primary transition-colors">
                  {node.label}
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <Plus size={14} className="text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Tip */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 leading-relaxed text-center italic">
          Tip: Drag a node onto the canvas to start your workflow
        </p>
      </div>
    </aside>
  );
}
