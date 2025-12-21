import { Position } from '@xyflow/react';
import React from 'react';

/**
 * 💡 什么是 ParameterType？
 * 它是表单项的“基因”。后续渲染器会根据这个类型决定：
 * 'string' -> 显示输入框
 * 'boolean' -> 显示开关
 * 'select' -> 显示下拉菜单
 * 'code' -> 代码编辑器
 */
export type ParameterType = 'string' | 'boolean' | 'select' | 'code';

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
 * 联合类型，方便后续扩展
 */
export type WorkflowNodeData = HttpRequestNodeData | CodeNodeData;
