import { useEffect, useMemo } from 'react';
import { useFlowStore } from '@/store/useFlowStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { nodeRegistry } from '@/registry/nodeRegistry';
import { type NodeParameter } from '@/types/workflow';
import { useForm } from 'react-hook-form';
import { ParameterRender } from './ParameterRender';

export default function FlowSidebar() {
    // 1. 从 Store 获取状态
    const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
    const setSelectedNodeId = useFlowStore((state) => state.setSelectedNodeId);
    const nodes = useFlowStore((state) => state.nodes);
    const updateNodeData = useFlowStore((state) => state.updateNodeData);

    // 2. 计算当前选中的节点和它的定义（图纸）
    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId),
        [nodes, selectedNodeId]
    );
    
    // 如果找不到定义（比如选中了一个不存在的类型），稍微防个呆
    const nodeType = selectedNode?.type;
    const nodeDefinition = nodeType ? nodeRegistry[nodeType] : null;
    const Icon = nodeDefinition?.icon;

    const isOpen = !!selectedNodeId;

    // 3. 初始化表单引擎
    const { control, reset, watch } = useForm({
        defaultValues: selectedNode?.data || {},
    });

    // 4. 同步逻辑：Store -> Form
    // 当切换选中的节点时，重置表单数据为该节点的最新数据
    useEffect(() => {
        if (selectedNodeId && selectedNode) {
            reset(selectedNode.data);
        }
        // Exclude selectedNode to prevent loop: Form Change -> Store Update -> Node Update -> Effect -> Reset
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId, reset]);

    // 5. 同步逻辑：Form -> Store
    // 监听表单变化，实时写入 Store
    useEffect(() => {
        const subscription = watch((value) => {
            if (selectedNodeId) {
                updateNodeData(selectedNodeId, value);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, selectedNodeId, updateNodeData]);

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setSelectedNodeId(null);
                }
            }}
        >
            <SheetContent 
                className="w-[400px] sm:w-[540px] shadow-2xl border-l border-slate-200 bg-white p-0 overflow-y-auto"
            >
                {selectedNode && nodeDefinition ? (
                    <>
                        {/* Header Area */}
                        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 support-[backdrop-filter]:bg-white/50">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    {Icon && <Icon className="w-5 h-5" strokeWidth={1.5} />}
                                </div>
                                <SheetTitle className="text-lg font-bold text-slate-800">
                                    {nodeDefinition.label}
                                </SheetTitle>
                                <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider border border-slate-200">
                                    {selectedNodeId}
                                </span>
                            </div>
                            
                            <SheetDescription className="text-slate-500 text-sm leading-relaxed" asChild>
                                <div>
                                    {nodeDefinition.description}
                                </div>
                            </SheetDescription>
                        </SheetHeader>

                        {/* Form Area using ParameterRender */}
                        <div className="p-6 pb-20">
                            {nodeDefinition.parameters.map((param: NodeParameter) => (
                                <div key={param.name} className="mb-6 last:mb-0">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                                        {param.label}
                                    </label>
                                    <ParameterRender
                                        parameter={param}
                                        control={control}
                                    />
                                    {/* Optional: Helper text support could go here */}
                                </div>
                            ))}

                            {nodeDefinition.parameters.length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 mx-4">
                                    <p className="text-sm">此节点无需配置参数</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Fallback state
                    <>
                        <SheetHeader className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                            <SheetTitle className="text-xl font-bold text-slate-800">
                                Node Details
                            </SheetTitle>
                            <SheetDescription className="text-slate-500">
                                Please select a node to view its configuration.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 opacity-50">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <span className="text-2xl">⚡️</span>
                            </div>
                            <p className="text-slate-500 font-medium">Select a node to configure</p>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
