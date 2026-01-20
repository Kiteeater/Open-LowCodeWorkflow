/**
 * 变量插值工具
 *
 * 支持在模板字符串中插入节点数据
 * 语法：{{ $node["NodeName"].path.to.data }}
 */

/**
 * 插值正则表达式
 * 匹配：{{ $node["NodeName"].path.to.data }}
 */
const INTERPOLATION_REGEX = /\{\{\s*\$node\["([^"]+)"\]((?:\.[\w.]+)?)\s*\}\}/g;

/**
 * 简单的引用类型（避免循环依赖）
 */
type NodeDataContext = Record<string, unknown>;

/**
 * 将模板中的变量替换为实际值
 *
 * @param template - 包含变量占位符的模板字符串
 * @param context - 节点数据上下文
 * @returns 插值后的字符串
 *
 * @example
 * ```typescript
 * const template = '总结：{{ $node["HTTP Request"].data.summary }}';
 * const context = {
 *   'HTTP Request': { data: { summary: 'Hello World' } }
 * };
 * injectVariables(template, context); // "总结：Hello World"
 * ```
 */
export function injectVariables(
  template: string,
  context: NodeDataContext,
): string {
  return template.replace(INTERPOLATION_REGEX, (_match, nodeName, path) => {
    // 查找节点数据
    const nodeData = context[nodeName];

    // 如果节点不存在，返回占位符
    if (nodeData === undefined) {
      return `[MISSING: ${nodeName}]`;
    }

    // 如果没有路径，直接使用节点数据
    if (!path || path === '') {
      return formatValue(nodeData);
    }

    // 解析路径并获取值
    const value = getNestedValue(nodeData, path.slice(1)); // 跳过开头的点

    // 如果值不存在，返回占位符
    if (value === undefined) {
      return `[MISSING: ${nodeName}${path}]`;
    }

    return formatValue(value);
  });
}

/**
 * 提取模板中引用的所有节点名称
 *
 * @param template - 模板字符串
 * @returns 引用的节点名称数组
 *
 * @example
 * ```typescript
 * extractNodeReferences('{{ $node["A"].data }} and {{ $node["B"].value }}');
 * // ["A", "B"]
 * ```
 */
export function extractNodeReferences(template: string): string[] {
  const references: string[] = [];
  const regex = new RegExp(INTERPOLATION_REGEX, 'g');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      references.push(match[1]);
    }
  }

  // 去重
  return Array.from(new Set(references));
}

/**
 * 从对象中获取嵌套值
 *
 * @param obj - 目标对象
 * @param path - 点分隔的路径（如 'data.user.name'）
 * @returns 路径对应的值，如果不存在则返回 undefined
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * 格式化值为字符串
 *
 * @param value - 要格式化的值
 * @returns 格式化后的字符串
 */
function formatValue(value: unknown): string {
  // 处理 null 和 undefined
  if (value === null || value === undefined) {
    return '';
  }

  // 处理对象和数组（JSON 序列化）
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '[Object]';
    }
  }

  // 处理基本类型
  return String(value);
}

/**
 * 检查模板是否包含有效的变量引用
 *
 * @param template - 模板字符串
 * @returns 是否包含变量引用
 */
export function hasVariableReferences(template: string): boolean {
  return INTERPOLATION_REGEX.test(template);
}

/**
 * 获取模板中的所有变量引用（详细）
 *
 * @param template - 模板字符串
 * @returns 变量引用数组
 */
export function extractVariableReferences(
  template: string,
): Array<{ nodeName: string; path: string; fullMatch: string }> {
  const references: Array<{ nodeName: string; path: string; fullMatch: string }> = [];
  const regex = new RegExp(INTERPOLATION_REGEX, 'g');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      references.push({
        nodeName: match[1],
        path: match[2] || '',
        fullMatch: match[0],
      });
    }
  }

  return references;
}
