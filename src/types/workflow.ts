import { Position } from '@xyflow/react';
import React from 'react';
import type { LLMProvider } from './llm';

/**
 * 💡 什么是 ParameterType？
 * 它是表单项的"基因"。后续渲染器会根据这个类型决定：
 * 'string' -> 显示输入框
 * 'boolean' -> 显示开关
 * 'select' -> 显示下拉菜单
 * 'code' -> 代码编辑器
 * 'ai-provider' -> LLM 供应商选择器（OpenAI / Anthropic）
 * 'ai-model' -> 模型下拉框（根据供应商动态调整）
 * 'encrypted-string' -> 带锁图标的加密输入字段（API Key）
 * 'number' -> 温度/Token 的数字输入框
 * 'toggle' -> 高级功能的布尔开关
 */
export type ParameterType =
  | 'string'
  | 'boolean'
  | 'select'
  | 'code'
  | 'ai-provider'
  | 'ai-model'
  | 'encrypted-string'
  | 'number'
  | 'toggle';

/**
 * 定义句柄的标准格式
 */
export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: Position;
  label?: string; // 可选，用于显示提示
}

/**
 * 定义每一个参数（零件）的标准格式
 */
export interface NodeParameter {
  name: string;         // 字段名，如 "url"
  label: string;        // 显示名，如 "目标网址"
  type: ParameterType;  // 类型
  default?: unknown;    // 默认值
  options?: { label: string; value: string }[]; // 专门给下拉菜单用的选项
  placeholder?: string; // 输入框的提示文字
}

/**
 * 定义一类节点完整图纸的标准格式
 */
export interface NodeDefinition {
  type: string;         // 节点类型标识
  label: string;        // 节点名称
  icon: React.ElementType; // 节点图标组件
  description: string;  // 节点描述
  parameters: NodeParameter[]; // 节点包含的所有参数
  handles?: NodeHandle[]; // 节点包含的所有句柄
}

/**
 * 基础节点数据接口
 */
export interface BaseNodeData {
  label?: string;
  [key: string]: unknown;
}

/**
 * HTTP 请求节点数据
 */
export interface HttpRequestNodeData extends BaseNodeData {
  url?: string;
  method?: string;
  useProxy?: boolean;
}

/**
 * 代码节点数据
 */
export interface CodeNodeData extends BaseNodeData {
  code?: string;
}

/**
 * AI Agent 节点数据
 */
export interface AIAgentNodeData extends BaseNodeData {
  /** LLM 供应商 */
  provider: LLMProvider;
  /** 模型名称 */
  model: string;
  /** API 密钥（存储时加密） */
  apiKey: string;
  /** 系统消息（可选） */
  systemMessage?: string;
  /** 提示词（支持 `{{ $node["X"].data }}` 变量插值） */
  prompt: string;
  /** 温度（0-2），默认 0.7 */
  temperature?: number;
  /** 最大 Token 数，默认 1000 */
  maxTokens?: number;
  /** 是否启用函数调用 */
  enableFunctionCalling?: boolean;
  /** 是否启用对话历史存储 */
  enableHistory?: boolean;
  /** 对话历史最大轮数（1-20轮），默认 5 */
  maxHistoryRounds?: number;
  /** 历史中是否包含系统消息 */
  includeSystemMessageInHistory?: boolean;
}

/**
 * 联合类型，方便后续扩展
 */
export type WorkflowNodeData = HttpRequestNodeData | CodeNodeData | AIAgentNodeData;
