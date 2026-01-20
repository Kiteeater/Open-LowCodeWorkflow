import React from 'react';
import { type Control, Controller, useWatch } from 'react-hook-form';
import { type NodeParameter, type WorkflowNodeData } from '@/types/workflow';
import { cn } from '@/lib/utils';
import { Lock, Cpu } from 'lucide-react';
interface ParameterRenderProps {
  parameter: NodeParameter;
  control: Control<WorkflowNodeData>;
}

export const ParameterRender: React.FC<ParameterRenderProps> = ({ parameter, control }) => {
  // 使用 useWatch 监听 provider 变化，用于动态更新模型选项
  const provider = useWatch({
    control,
    name: 'provider',
    defaultValue: 'openai',
  }) as string;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
        {parameter.label}
        <span className="text-[10px] text-slate-400 font-mono opacity-50">{parameter.name}</span>
      </label>

      <Controller
        control={control}
        name={parameter.name}
        defaultValue={parameter.default}
        render={({ field }) => {
          // 类型转换：将 unknown 转换为适当的 HTML 类型
          const value = field.value as string | number | readonly string[] | undefined;

          switch (parameter.type) {
            case 'ai-provider':
              // LLM 供应商选择器（OpenAI / Anthropic）
              return (
                <div className="relative group">
                  <select
                    {...field}
                    value={value ?? 'openai'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={cn(
                      "flex h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-all",
                      "hover:border-slate-300",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <Cpu size={14} />
                  </div>
                </div>
              );

            case 'ai-model':
              // 模型下拉框（根据供应商动态调整）
              const modelOptions = provider === 'anthropic'
                ? [
                    { label: 'Claude 3.5 Sonnet (Latest)', value: 'claude-3-5-sonnet-20241022' },
                    { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                  ]
                : [
                    { label: 'GPT-4o (Recommended)', value: 'gpt-4o' },
                    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                  ];
              return (
                <div className="relative group">
                  <select
                    {...field}
                    value={value ?? undefined}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={cn(
                      "flex h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-all",
                      "hover:border-slate-300",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              );

            case 'encrypted-string':
              // 带锁图标的加密输入字段（API Key）
              return (
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors" size={14} />
                  <input
                    type="password"
                    {...field}
                    value={String(field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={cn(
                      "flex h-9 w-full rounded-md border border-slate-200 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-all",
                      "hover:border-slate-300",
                      "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder={parameter.placeholder}
                  />
                </div>
              );

            case 'number':
              // 数字输入框
              return (
                <input
                  type="number"
                  {...field}
                  value={value ?? 0}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                  step="0.1"
                  className={cn(
                    "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-all",
                    "hover:border-slate-300",
                    "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  placeholder={parameter.placeholder}
                />
              );

            case 'toggle':
              // 高级功能的布尔开关
              return (
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!field.value}
                        onChange={field.onChange}
                        ref={field.ref}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors"></div>
                    <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                        {field.value ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              );

            case 'select':
              return (
                <div className="relative group">
                  <select
                    {...field}
                    value={value ?? undefined}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={cn(
                      "flex h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-all",
                      "hover:border-slate-300",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {parameter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow Icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              );

            case 'boolean':
              return (
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!field.value}
                        onChange={field.onChange}
                        ref={field.ref}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors"></div>
                    <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                        {field.value ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              );

            case 'code':
              return (
                <div className="relative font-mono text-sm group">
                   <textarea
                    {...field}
                    value={String(field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value)}
                    rows={8}
                    className={cn(
                      "flex min-h-[120px] w-full rounded-md border border-slate-200 bg-slate-900 text-slate-50 px-3 py-2 text-sm shadow-sm leading-relaxed",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-slate-600 font-mono tracking-wide"
                    )}
                    placeholder={parameter.placeholder || "// Type your code here..."}
                    spellCheck={false}
                  />
                  <div className="absolute top-2 right-2 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-bold opacity-50 group-hover:opacity-100 transition-opacity">JS</div>
                </div>
              );

            case 'string':
            default:
              return (
                <input
                  type="text"
                  {...field}
                  value={value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-all",
                    "hover:border-slate-300",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  placeholder={parameter.placeholder}
                />
              );
          }
        }}
      />
    </div>
  );
};
