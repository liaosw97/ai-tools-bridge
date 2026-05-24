import { describe, it, expect } from 'vitest';

// 功能树解析函数
interface FeatureNode {
  name: string;
  level: number;
  children: FeatureNode[];
  isLeaf: boolean;
}

function parseFeatureTree(markdown: string): FeatureNode[] {
  const lines = markdown.split('\n').filter(line => line.trim().startsWith('-'));
  const nodes: FeatureNode[] = [];
  let currentL1: FeatureNode | null = null;
  let currentL2: FeatureNode | null = null;

  for (const line of lines) {
    const indent = line.search(/\S/);
    const name = line.replace(/^[\s-]+/, '').trim();

    if (indent === 0) {
      // L1 模块
      currentL1 = { name, level: 1, children: [], isLeaf: false };
      nodes.push(currentL1);
    } else if (indent === 2 && currentL1) {
      // L2 单元
      currentL2 = { name, level: 2, children: [], isLeaf: false };
      currentL1.children.push(currentL2);
    } else if (indent === 4 && currentL2) {
      // L3 功能点
      const leafNode: FeatureNode = { name, level: 3, children: [], isLeaf: true };
      currentL2.children.push(leafNode);
    }
  }

  // 标记叶子节点：没有子节点的节点
  for (const node of nodes) {
    for (const child of node.children) {
      if (child.children.length === 0) {
        child.isLeaf = true;
      }
    }
  }

  return nodes;
}

// 依赖检测函数
interface Dependency {
  from: string;
  to: string;
  type: 'data' | 'api' | 'ui';
}

function detectDependencies(features: FeatureNode[]): Dependency[] {
  const deps: Dependency[] = [];
  // 简化实现：检测同层级功能单元之间的隐式依赖
  for (const module of features) {
    const units = module.children;
    for (let i = 0; i < units.length - 1; i++) {
      // 相邻单元可能有数据依赖
      deps.push({
        from: units[i + 1].name,
        to: units[i].name,
        type: 'data'
      });
    }
  }
  return deps;
}

// 循环依赖检测
function detectCircularDependency(deps: Dependency[]): string[] {
  const cycles: string[] = [];
  const graph = new Map<string, string[]>();

  for (const dep of deps) {
    if (!graph.has(dep.from)) graph.set(dep.from, []);
    graph.get(dep.from)!.push(dep.to);
  }

  // 简化检测：查找直接循环 A → B → A
  for (const dep of deps) {
    const reverseDeps = graph.get(dep.to);
    if (reverseDeps && reverseDeps.includes(dep.from)) {
      cycles.push(`${dep.from} ↔ ${dep.to}`);
    }
  }

  return cycles;
}

// 任务组标注解析
function parseTaskUnitAnnotation(taskDescription: string): string | null {
  const match = taskDescription.match(/\[unit:([^\]]+)\]/);
  return match ? match[1] : null;
}

describe('sdd-plan dependency detection', () => {
  // Task 0.2 骨架已存在
  describe('parseFeatureTree', () => {
    it('should parse L1/L2/L3 hierarchy from markdown', () => {
      const markdown = `
- 用户管理模块
  - 用户列表
    - 分页功能
  - 用户创建
`;
      const tree = parseFeatureTree(markdown);
      expect(tree.length).toBe(1);
      expect(tree[0].level).toBe(1);
      expect(tree[0].name).toBe('用户管理模块');
      expect(tree[0].children.length).toBe(2);
      expect(tree[0].children[0].level).toBe(2);
      expect(tree[0].children[0].children[0].level).toBe(3);
    });

    it('should identify leaf nodes correctly', () => {
      const markdown = `
- 模块A
  - 单元B（无子节点）
  - 单元C
    - 功能点D
`;
      const tree = parseFeatureTree(markdown);
      expect(tree[0].children[0].isLeaf).toBe(true);
      expect(tree[0].children[1].isLeaf).toBe(false);
      expect(tree[0].children[1].children[0].isLeaf).toBe(true);
    });
  });

  describe('detectDependencies', () => {
    it('should detect data dependency between adjacent units', () => {
      const features: FeatureNode[] = [
        {
          name: '用户模块',
          level: 1,
          children: [
            { name: '用户创建', level: 2, children: [], isLeaf: true },
            { name: '用户列表', level: 2, children: [], isLeaf: true }
          ],
          isLeaf: false
        }
      ];
      const deps = detectDependencies(features);
      expect(deps.length).toBeGreaterThan(0);
      expect(deps[0].type).toBe('data');
    });
  });

  describe('detectCircularDependency', () => {
    it('should detect A → B → A pattern', () => {
      const deps: Dependency[] = [
        { from: 'A', to: 'B', type: 'data' },
        { from: 'B', to: 'A', type: 'data' }
      ];
      const cycles = detectCircularDependency(deps);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('A ↔ B');
    });

    it('should return empty for non-circular deps', () => {
      const deps: Dependency[] = [
        { from: 'A', to: 'B', type: 'data' },
        { from: 'B', to: 'C', type: 'data' }
      ];
      const cycles = detectCircularDependency(deps);
      expect(cycles.length).toBe(0);
    });
  });

  describe('parseTaskUnitAnnotation', () => {
    it('should parse [unit:模块/单元] annotation', () => {
      const task = '实现用户列表功能 [unit:用户管理/用户列表]';
      const unit = parseTaskUnitAnnotation(task);
      expect(unit).toBe('用户管理/用户列表');
    });

    it('should return null for missing annotation', () => {
      const task = '实现用户列表功能';
      const unit = parseTaskUnitAnnotation(task);
      expect(unit).toBeNull();
    });
  });
});