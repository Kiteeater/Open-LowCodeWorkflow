//监听selectedNodeId，选中了则显示抽屉

import React from 'react';
import {useFlowStore} from '@/store/useFlowStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

//为什么设计成export default？
export default function FlowSidebar() {
    // 从Store中获取状态和方法
    const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
    const setSelectedNodeId  = useFlowStore((state) => state.setSelectedNodeId);

    // isOpen，只要Id不为空就打开
    const isOpen = !!selectedNodeId; 

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedNodeId(null);
                }
            }}
        >
            <SheetContent className="w-[400px] sm:w-[540px] shadow-2xl border-l border-slate-100 p-0">
                <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                         <span>🛠️</span> Node Settings
                    </SheetTitle>
                    <SheetDescription className="text-slate-500">
                        Configure the properties for node <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded text-slate-700">{selectedNodeId}</span>
                    </SheetDescription>
                </SheetHeader>
                
                <div className="p-6 space-y-6">
                    {/* Mock Settings Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Node Name</label>
                            <input 
                                type="text" 
                                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="My Agent"
                                defaultValue="Test Agent 🤖"
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-700">Model</label>
                             <select className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                <option>GPT-4o</option>
                                <option>Claude 3.5 Sonnet</option>
                                <option>Gemini 1.5 Pro</option>
                             </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">System Prompt</label>
                            <textarea 
                                className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                placeholder="You are a helpful assistant..."
                            ></textarea>
                            <p className="text-[10px] text-slate-400">Define how the agent should behave.</p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}