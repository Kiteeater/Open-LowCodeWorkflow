//想要新节点就在这里加
import { Globe, Code, Sparkles } from 'lucide-react';
import { Position } from '@xyflow/react';
import { type NodeDefinition } from '@/types/workflow';

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