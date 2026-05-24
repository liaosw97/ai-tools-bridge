import { describe, it, expect } from 'vitest';

// 功能树解析函数
interface TreeNode {
  name: string;
  level: number;
  children: TreeNode[];
}

function parseMarkdownFeatureTree(markdown: string): TreeNode[] {
  const lines = markdown.split('\n').filter(line => line.trim().startsWith('-'));
  const result: TreeNode[] = [];
  const stack: { node: TreeNode; indent: number }[] = [];

  for (const line of lines) {
    const indent = line.search(/\S/);
    const name = line.replace(/^[\s-]+/, '').trim();

    const node: TreeNode = { name, level: Math.floor(indent / 2) + 1, children: [] };

    // 找到父节点
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, indent });
  }

  return result;
}

// 提取叶子节点
function extractLeafNodes(tree: TreeNode[]): string[] {
  const leaves: string[] = [];

  function traverse(node: TreeNode, path: string[]) {
    const currentPath = [...path, node.name];

    if (node.children.length === 0) {
      leaves.push(currentPath.join('/'));
    } else {
      for (const child of node.children) {
        traverse(child, currentPath);
      }
    }
  }

  for (const root of tree) {
    traverse(root, []);
  }

  return leaves;
}

describe('feature tree parsing', () => {
  describe('parseMarkdownFeatureTree', () => {
    it('should parse single level tree', () => {
      const markdown = `
- 模块A
- 模块B
- 模块C
`;
      const tree = parseMarkdownFeatureTree(markdown);
      expect(tree.length).toBe(3);
      expect(tree[0].name).toBe('模块A');
      expect(tree[0].level).toBe(1);
    });

    it('should parse nested tree correctly', () => {
      const markdown = `
- 用户管理模块
  - 用户列表
    - 分页功能
    - 筛选功能
  - 用户创建
`;
      const tree = parseMarkdownFeatureTree(markdown);
      expect(tree.length).toBe(1);
      expect(tree[0].children.length).toBe(2);
      expect(tree[0].children[0].children.length).toBe(2);
      expect(tree[0].children[0].children[0].name).toBe('分页功能');
    });

    it('should handle empty input', () => {
      const tree = parseMarkdownFeatureTree('');
      expect(tree.length).toBe(0);
    });
  });

  describe('extractLeafNodes', () => {
    it('should extract leaf nodes with full path', () => {
      const tree: TreeNode[] = [
        {
          name: '用户管理',
          level: 1,
          children: [
            {
              name: '用户列表',
              level: 2,
              children: [
                { name: '分页功能', level: 3, children: [] },
                { name: '筛选功能', level: 3, children: [] }
              ]
            },
            { name: '用户创建', level: 2, children: [] }
          ]
        }
      ];

      const leaves = extractLeafNodes(tree);
      expect(leaves.length).toBe(3);
      expect(leaves).toContain('用户管理/用户列表/分页功能');
      expect(leaves).toContain('用户管理/用户列表/筛选功能');
      expect(leaves).toContain('用户管理/用户创建');
    });

    it('should return empty for empty tree', () => {
      const leaves = extractLeafNodes([]);
      expect(leaves.length).toBe(0);
    });
  });
});
