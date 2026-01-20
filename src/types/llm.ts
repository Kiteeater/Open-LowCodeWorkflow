/**
 * LLM 相关类型定义
 * 用于 AI Agent 节点的类型系统
 */

/**
 * 支持的 LLM 供应商
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * LLM 消息角色类型
 */
export type LLMMessageRole = 'system' | 'user' | 'assistant';

/**
 * 单条 LLM 消息
 */
export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

/**
 * Token 使用统计
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  /** 生成的内容 */
  content: string;
  /** Token 使用情况 */
  usage: TokenUsage;
  /** 完成原因（如 'stop', 'length', 'function_call'） */
  finishReason: string;
}

/**
 * LLM 错误
 */
export interface LLMError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** HTTP 状态码（如果适用） */
  statusCode?: number;
}

/**
 * LLM 聊天请求参数
 */
export interface LLMChatParams {
  /** LLM 供应商 */
  provider: LLMProvider;
  /** 模型名称（如 'gpt-4o', 'claude-3-5-sonnet-20241022'） */
  model: string;
  /** 消息列表 */
  messages: LLMMessage[];
  /** API 密钥（已加密或明文） */
  apiKey: string;
  /** 温度（0-2），默认 0.7 */
  temperature?: number;
  /** 最大 Token 数，默认 1000 */
  maxTokens?: number;
}

/**
 * OpenAI 专用配置
 */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Anthropic 专用配置
 */
export interface AnthropicConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 函数调用相关类型（Day 9 预留）
 */
export interface FunctionCall {
  /** 函数名称 */
  name: string;
  /** 函数参数（JSON 字符串） */
  arguments: string;
}

/**
 * 扩展的 LLM 响应（包含函数调用）
 */
export interface LLMResponseWithTools extends LLMResponse {
  /** 函数调用（如果有） */
  functionCall?: FunctionCall;
}
