/**
 * 错误模态框组件
 *
 * 用于显示节点执行的完整错误信息
 */

import React, { useState } from 'react';
import { X, Copy, AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 节点 ID */
  nodeId: string;
  /** 节点名称 */
  nodeName?: string;
  /** 错误消息 */
  errorMessage: string;
  /** 错误代码（可选） */
  errorCode?: string;
  /** HTTP 状态码（可选） */
  statusCode?: number;
}

/**
 * 常见错误建议
 */
const ERROR_SUGGESTIONS: Record<string, { title: string; steps: string[] }> = {
  'UNAUTHORIZED': {
    title: 'API Key 无效',
    steps: [
      '检查 API Key 是否正确',
      '确认 API Key 未过期',
      '检查供应商是否正确（OpenAI / Anthropic）',
    ],
  },
  'RATE_LIMIT_EXCEEDED': {
    title: '请求频率过高',
    steps: [
      '稍等几分钟后再试',
      '检查是否有其他程序在大量调用 API',
      '考虑升级到付费计划',
    ],
  },
  'NETWORK_ERROR': {
    title: '网络连接失败',
    steps: [
      '检查网络连接',
      '确认 API 服务是否正常运行',
      '检查防火墙或代理设置',
    ],
  },
  'API_ERROR': {
    title: 'API 调用失败',
    steps: [
      '稍后重试',
      '查看 API 控制台获取更多信息',
      '联系技术支持',
    ],
  },
  'DECRYPTION_ERROR': {
    title: 'API Key 解密失败',
    steps: [
      '清除浏览器缓存',
      '重新输入 API Key',
      '检查主密钥是否已损坏',
    ],
  },
};

/**
 * 获取错误建议
 */
function getErrorSuggestion(errorCode?: string) {
  return ERROR_SUGGESTIONS[errorCode || 'API_ERROR'] || ERROR_SUGGESTIONS['API_ERROR'];
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeName,
  errorMessage,
  errorCode,
  statusCode,
}) => {
  const [copied, setCopied] = useState(false);
  const suggestion = getErrorSuggestion(errorCode);

  const handleCopyError = () => {
    const errorDetails = {
      nodeId,
      nodeName,
      errorMessage,
      errorCode,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    onClose();
    // 触发重新执行（通过点击运行按钮）
    const runButton = document.querySelector('button:has(.loader2)');
    if (runButton) {
      (runButton as HTMLButtonElement).click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Execution Error</h2>
              <p className="text-sm text-slate-600">
                {nodeName || `Node ${nodeId}`} execution failed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 错误详情 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Error Message</h3>
            <p className="text-base text-red-900 font-mono whitespace-pre-wrap break-all">
              {errorMessage}
            </p>
          </div>

          {/* 技术信息 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Technical Details</h3>
            <div className="space-y-2 text-sm">
              {errorCode && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Error Code:</span>
                  <code className="bg-slate-200 px-2 py-1 rounded text-slate-800">
                    {errorCode}
                  </code>
                </div>
              )}
              {statusCode && (
                <div className="flex justify-between">
                  <span className="text-slate-600">HTTP Status:</span>
                  <span className="bg-slate-200 px-2 py-1 rounded text-slate-800 font-mono">
                    {statusCode}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Node ID:</span>
                <code className="bg-slate-200 px-2 py-1 rounded text-slate-800">
                  {nodeId}
                </code>
              </div>
              {nodeName && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Node Name:</span>
                  <span className="text-slate-800">
                    {nodeName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 修复建议 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {suggestion.title}
            </h3>
            <ul className="space-y-2">
              {suggestion.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            type="button"
            onClick={handleCopyError}
            disabled={copied}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Error'}
          </button>
        </div>
      </div>
    </div>
  );
};
