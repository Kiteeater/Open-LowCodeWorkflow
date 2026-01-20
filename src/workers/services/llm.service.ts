/**
 * LLM 服务
 *
 * 支持多个 LLM 供应商（OpenAI、Anthropic）
 * 提供统一的聊天接口和错误处理
 */

import type {
  LLMChatParams,
  LLMResponse,
  LLMError,
} from '@/types/llm';

/**
 * OpenAI API 响应格式
 */
interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Anthropic API 响应格式
 */
interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

/**
 * LLM 服务类
 */
export class LLMService {
  /**
   * 聊天接口（路由到对应供应商）
   */
  async chat(params: LLMChatParams): Promise<{ success: true; data: LLMResponse } | { success: false; error: LLMError }> {
    // 参数验证
    const validationResult = this.validateParams(params);
    if (validationResult) {
      return validationResult;
    }

    try {
      // 根据供应商路由
      switch (params.provider) {
        case 'openai':
          return await this.chatOpenAI(params);
        case 'anthropic':
          return await this.chatAnthropic(params);
        default:
          return {
            success: false,
            error: {
              code: 'INVALID_PROVIDER',
              message: `Unsupported provider: ${params.provider}`,
            },
          };
      }
    } catch (error) {
      // 统一错误处理
      if (error instanceof Error) {
        // 尝试从响应中解析错误
        if (this.isHttpError(error)) {
          return this.handleHttpError(error);
        }
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error.message || 'Network error occurred',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * OpenAI 聊天接口
   */
  private async chatOpenAI(params: LLMChatParams): Promise<{ success: true; data: LLMResponse } | { success: false; error: LLMError }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        return this.handleHttpError(response);
      }

      const data = (await response.json()) as OpenAIResponse;

      // 解析响应
      const content = data.choices[0]?.message.content ?? '';
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          };
      const finishReason = data.choices[0]?.finish_reason ?? 'unknown';

      return {
        success: true,
        data: {
          content,
          usage,
          finishReason,
        },
      };
    } catch (error) {
      if (error instanceof Error && this.isHttpError(error)) {
        return this.handleHttpError(error);
      }
      throw error;
    }
  }

  /**
   * Anthropic 聊天接口
   */
  private async chatAnthropic(params: LLMChatParams): Promise<{ success: true; data: LLMResponse } | { success: false; error: LLMError }> {
    try {
      // 提取系统消息（如果有）
      const systemMessage = params.messages.find(m => m.role === 'system');
      const conversationMessages = params.messages.filter(m => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': params.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model,
          system: systemMessage?.content,
          messages: conversationMessages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        return this.handleHttpError(response);
      }

      const data = (await response.json()) as AnthropicResponse;

      // 解析响应
      const content = data.content[0]?.text ?? '';
      const usage = data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          };
      const finishReason = data.stop_reason;

      return {
        success: true,
        data: {
          content,
          usage,
          finishReason,
        },
      };
    } catch (error) {
      if (error instanceof Error && this.isHttpError(error)) {
        return this.handleHttpError(error);
      }
      throw error;
    }
  }

  /**
   * 参数验证
   */
  private validateParams(params: LLMChatParams): { success: false; error: LLMError } | null {
    if (!params.messages || params.messages.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'Messages array cannot be empty',
        },
      };
    }

    if (!params.apiKey || params.apiKey.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'API key is required',
        },
      };
    }

    if (params.temperature !== undefined) {
      if (params.temperature < 0 || params.temperature > 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Temperature must be between 0 and 2',
          },
        };
      }
    }

    if (params.maxTokens !== undefined) {
      if (params.maxTokens <= 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Max tokens must be greater than 0',
          },
        };
      }
    }

    return null;
  }

  /**
   * 处理 HTTP 错误
   */
  private handleHttpError(error: Response | Error): { success: false; error: LLMError } {
    let statusCode = 0;
    let errorMessage = 'Unknown error';

    if (error instanceof Response) {
      statusCode = error.status;
      errorMessage = error.statusText || `HTTP ${statusCode}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // 错误码映射
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return {
      success: false,
      error: {
        code: errorCodes[statusCode] || 'API_ERROR',
        message: this.getUserFriendlyMessage(statusCode, errorMessage),
        statusCode,
      },
    };
  }

  /**
   * 获取用户友好的错误消息
   */
  private getUserFriendlyMessage(statusCode: number, rawMessage: string): string {
    const messages: Record<number, string> = {
      401: 'API Key 无效，请检查配置',
      403: '访问被拒绝，请检查权限',
      404: 'API 端点不存在',
      429: '请求频率过高，请稍后再试',
      500: '服务暂时不可用，请稍后再试',
      502: '服务网关错误，请稍后再试',
      503: '服务维护中，请稍后再试',
    };

    return messages[statusCode] || rawMessage;
  }

  /**
   * 判断是否为 HTTP 错误
   */
  private isHttpError(error: unknown): error is Response {
    return error instanceof Response;
  }
}

/**
 * 导出单例实例
 */
export const llmService = new LLMService();
