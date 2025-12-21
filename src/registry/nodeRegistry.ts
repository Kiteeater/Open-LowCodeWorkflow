//想要新节点就在这里加
import { Globe, Code, Sparkles } from 'lucide-react';
import React from 'react';
import { Position } from '@xyflow/react';
/**
 * 💡 什么是 ParameterType？
 * 它是表单项的“基因”。后续渲染器会根据这个类型决定：
 * 'string' -> 显示输入框
 * 'boolean' -> 显示开关
 * 'select' -> 显示下拉菜单
 * 'code' -> 代码编辑器
 */
export type ParameterType = 'string' | 'boolean' | 'select' | 'code';

// 定义句柄的标准格式
export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: Position;
  label?: string; // 可选，用于显示提示
}

// 定义每一个参数（零件）的标准格式
export interface NodeParameter {
  name: string;         // 字段名，如 "url"
  label: string;        // 显示名，如 "目标网址"
  type: ParameterType;  // 类型
  default?: any;        // 默认值
  options?: { label: string; value: string }[]; // 专门给下拉菜单用的选项
  placeholder?: string; // 输入框的提示文字
}

// 定义一类节点完整图纸的标准格式
export interface NodeDefinition {
  type: string;         // 节点类型标识
  label: string;        // 节点名称
  icon: React.ElementType; // 节点图标组件
  description: string;  // 节点描述
  parameters: NodeParameter[]; // 节点包含的所有参数
  handles?: NodeHandle[]; // 节点包含的所有句柄
}

/**
 * 🌟 nodeRegistry：这就我们的“中央手册”
 * 以后想增加新节点，只需在下方增加配置即可，无需改动任何 UI 逻辑。
 */
export const nodeRegistry: Record<string, NodeDefinition> = {
  // 1. HTTP 请求节点
  'http-request': {
    type: 'http-request',
    label: 'HTTP Request',
    icon: Globe,
    description: '发送 API 请求到指定服务器',
    parameters: [
      {
        name: 'label',
        label: 'Node Name',
        type: 'string',
        default: 'HTTP Request',
      },
      {
        name: 'url',
        label: 'URL',
        type: 'string',
        default: 'https://api.example.com',
        placeholder: '请输入请求地址',
      },
      {
        name: 'method',
        label: 'Method',
        type: 'select',
        default: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        name: 'body',
        label: 'Body',
        type: 'string',
        default: '{}',
      },
      {
        name: 'useProxy',
        label: 'Use Proxy',
        type: 'boolean',
        default: false,
      },
    ],
  },

  // 2. 自定义代码节点
  'code': {
    type: 'code',
    label: 'Code Node',
    icon: Code,
    description: '通过 JavaScript 处理数据',
    parameters: [
      {
        name: 'label',
        label: 'Node Name',
        type: 'string',
        default: 'Code Node',
      },
      {
        name: 'code',
        label: 'Javascript Code',
        type: 'code',
        default: '// 在这里编写你的逻辑\nreturn $node["previous"].data;',
      },
    ],
  },

  // 3. AI 智能节点 
  'ai-agent': {
    type: 'ai-agent',
    label: 'AI Agent',
    icon: Sparkles,
    description: '使用大语言模型 (LLM) 处理任务或生成内容',
    parameters: [
      {
        name: 'label',
        label: 'Node Name',
        type: 'string',
        default: 'AI Agent',
      },
      {
        name: 'model',
        label: 'Model',
        type: 'select',
        default: 'gpt-3.5-turbo',
        options: [
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
        ],
      },
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'string',
        default: '请帮我总结以下内容：{{ $node["previous"].data }}',
        placeholder: '请输入给 AI 的指令',
      },
      {
        name: 'systemMessage',
        label: 'System Message',
        type: 'string',
        default: '你是一个专业的助手。',
      },
      {
        name: 'apiKey',
        label: 'OpenAI API Key',
        type: 'string',
        placeholder: 'sk-...',
      },
    ],
    handles: [
      { id: 'main-input', type: 'target', position: Position.Left },
      { id: 'main-output', type: 'source', position: Position.Right },
      { id: 'model-input', type: 'target', position: Position.Top },
      { id: 'tools-input', type: 'target', position: Position.Bottom },
    ],
  },
};