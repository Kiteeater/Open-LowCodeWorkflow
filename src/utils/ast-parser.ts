import * as acorn from 'acorn';


/**
 * 从代码字符串中提取所有的 $node["XXX"] 或 $node.XXX 引用
 * @param code 待解析的代码或表达式
 * @returns 去重后的节点名称列表
 */
export function extractDependencies(code: string): string[] {
  const dependencies = new Set<string>();

  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });

    /**
     * 深度优先遍历 AST
     */
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;

      // 我们要找的是 MemberExpression (成员访问)
      // 模式：object 必须是名为 "$node" 的标识符
      if (node.type === 'MemberExpression') {
        const obj = node.object;
        if (obj.type === 'Identifier' && obj.name === '$node') {
          const prop = node.property;
          
          if (node.computed) {
            // 情况 A: $node["Weather"] -> property 是 Literal
            if (prop.type === 'Literal' && typeof prop.value === 'string') {
              dependencies.add(prop.value);
            }
          } else {
            // 情况 B: $node.Weather -> property 是 Identifier
            if (prop.type === 'Identifier') {
              dependencies.add(prop.name);
            }
          }
        }
      }

      // 递归遍历所有子节点
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(traverse);
          } else if (child && typeof child === 'object') {
            traverse(child);
          }
        }
      }
    };

    traverse(ast);
  } catch (err) {
    console.warn('AST Parsing warning (likely incomplete fragment):', err);
  }

  return Array.from(dependencies);
}

