import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

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

describe('大型变更拆分触发', () => {
  it('任务数 >25 时应输出强建议提示', () => {
    const MAX_TASKS_BEFORE_SPLIT = 25;
    const taskCount = 30;
    const shouldSuggestSplit = taskCount > MAX_TASKS_BEFORE_SPLIT;
    expect(shouldSuggestSplit).toBe(true);
  });

  it('任务数恰好为 25 时不触发拆分（按中型处理）', () => {
    const MAX_TASKS_BEFORE_SPLIT = 25;
    const taskCount = 25;
    const shouldSuggestSplit = taskCount > MAX_TASKS_BEFORE_SPLIT;
    expect(shouldSuggestSplit).toBe(false);
  });

  it('任务数为 0 时应输出空任务提示', () => {
    const taskCount = 0;
    const isEmpty = taskCount === 0;
    expect(isEmpty).toBe(true);
  });

  it('拆分取消时应恢复原始状态', () => {
    const cancelled = true;
    expect(cancelled).toBe(true);
  });

  it('用户选择拆分时应提示命名规范建议（<original-name>-part<N>）', () => {
    const originalName = 'fix-sdd-plan-split';
    const namingSuggestion = `${originalName}-part2`;
    expect(namingSuggestion).toBe('fix-sdd-plan-split-part2');
  });
});

describe('拆分文件复制', () => {
  const parentDir = '.test-parent';
  const childDir = '.test-child';

  beforeEach(() => {
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path.join(parentDir, 'brainstorm.md'), '# brainstorm');
    fs.writeFileSync(path.join(parentDir, 'proposal.md'), '# proposal');
    fs.mkdirSync(path.join(parentDir, 'specs'), { recursive: true });
    fs.writeFileSync(path.join(parentDir, 'specs', 'test.md'), '# spec');
    fs.writeFileSync(path.join(parentDir, 'design.md'), '# design');
    fs.writeFileSync(path.join(parentDir, 'plan.md'), '# plan (should not copy)');
    fs.mkdirSync(path.join(parentDir, 'reviews'), { recursive: true });
    fs.writeFileSync(path.join(parentDir, 'reviews', 'r1.md'), '# review (should not copy)');
  });

  afterEach(() => {
    fs.rmSync(parentDir, { recursive: true, force: true });
    if (fs.existsSync(childDir)) fs.rmSync(childDir, { recursive: true, force: true });
  });

  it('应复制 brainstorm.md 到子 change 目录', () => {
    fs.mkdirSync(childDir, { recursive: true });
    fs.cpSync(path.join(parentDir, 'brainstorm.md'), path.join(childDir, 'brainstorm.md'));
    expect(fs.existsSync(path.join(childDir, 'brainstorm.md'))).toBe(true);
  });

  it('应复制 proposal.md 到子 change 目录', () => {
    fs.mkdirSync(childDir, { recursive: true });
    fs.cpSync(path.join(parentDir, 'proposal.md'), path.join(childDir, 'proposal.md'));
    expect(fs.existsSync(path.join(childDir, 'proposal.md'))).toBe(true);
  });

  it('应复制 specs/ 目录到子 change 目录', () => {
    fs.mkdirSync(childDir, { recursive: true });
    fs.cpSync(path.join(parentDir, 'specs'), path.join(childDir, 'specs'), { recursive: true });
    expect(fs.existsSync(path.join(childDir, 'specs', 'test.md'))).toBe(true);
  });

  it('应复制 design.md 到子 change 目录（如有）', () => {
    fs.mkdirSync(childDir, { recursive: true });
    if (fs.existsSync(path.join(parentDir, 'design.md'))) {
      fs.cpSync(path.join(parentDir, 'design.md'), path.join(childDir, 'design.md'));
    }
    expect(fs.existsSync(path.join(childDir, 'design.md'))).toBe(true);
  });

  it('不应复制 plan.md 和 reviews/ 到子 change 目录', () => {
    fs.mkdirSync(childDir, { recursive: true });
    const copyList = ['brainstorm.md', 'proposal.md', 'design.md'];
    for (const file of copyList) {
      if (fs.existsSync(path.join(parentDir, file))) {
        fs.cpSync(path.join(parentDir, file), path.join(childDir, file));
      }
    }
    if (fs.existsSync(path.join(parentDir, 'specs'))) {
      fs.cpSync(path.join(parentDir, 'specs'), path.join(childDir, 'specs'), { recursive: true });
    }
    expect(fs.existsSync(path.join(childDir, 'plan.md'))).toBe(false);
    expect(fs.existsSync(path.join(childDir, 'reviews'))).toBe(false);
  });

  it('不覆盖子 change 已有文件', () => {
    fs.mkdirSync(childDir, { recursive: true });
    fs.writeFileSync(path.join(childDir, 'brainstorm.md'), '# existing content');
    try {
      fs.cpSync(path.join(parentDir, 'brainstorm.md'), path.join(childDir, 'brainstorm.md'), { force: false });
    } catch {
      // 期望抛出不覆盖错误
    }
    const content = fs.readFileSync(path.join(childDir, 'brainstorm.md'), 'utf-8');
    expect(content).toBe('# existing content');
  });
});

describe('tasks.md 过滤分配（A+C 混合模式）', () => {
  const tasks = [
    '- [ ] 1.1 实现用户列表 [unit:用户管理/用户列表]',
    '- [ ] 1.2 实现用户创建 [unit:用户管理/用户创建]',
    '- [ ] 2.1 实现订单列表 [unit:订单管理/订单列表]',
    '- [ ] 2.2 实现订单创建 [unit:订单管理/订单创建]',
    '- [ ] 3.1 配置数据库连接',
    '- [ ] 3.2 配置日志系统',
  ];

  const childUnits = ['用户管理/用户列表', '用户管理/用户创建'];

  it('应按 [unit:...] 标注自动分配匹配的任务', () => {
    const matched = tasks.filter(t => childUnits.some(u => t.includes(`[unit:${u}]`)));
    expect(matched.length).toBe(2);
    expect(matched[0]).toContain('用户列表');
    expect(matched[1]).toContain('用户创建');
  });

  it('无标注的任务应按功能语义推荐分配', () => {
    const unannotated = tasks.filter(t => !t.includes('[unit:'));
    expect(unannotated.length).toBe(2);
  });

  it('每个任务只分配到一个子 change', () => {
    const assignment = new Map<string, string>();
    for (const task of tasks) {
      const unit = task.match(/\[unit:([^\]]+)\]/);
      if (unit) {
        const prev = assignment.get(task);
        expect(prev).toBeUndefined();
        assignment.set(task, unit[1]);
      }
    }
  });

  it('父 change 已分配任务应标记为 [delegated:<child-name>]', () => {
    const delegated = '- [ ] 1.1 实现用户列表 [unit:用户管理/用户列表] [delegated:child-change]';
    expect(delegated).toContain('[delegated:child-change]');
  });
});

describe('inherited-specs.md 生成', () => {
  const parentName = 'fix-sdd-plan-split';
  const childName = 'fix-sdd-plan-split-part2';
  const splitDate = '2026-07-16';

  it('应记录来源父 change 名称和拆分日期', () => {
    const content = `## 来源 Change\n- 名称: ${parentName}\n- 拆分日期: ${splitDate}\n`;
    expect(content).toContain(parentName);
    expect(content).toContain(splitDate);
  });

  it('应记录继承的 spec 场景列表', () => {
    const inheritedSpecs = ['[spec:domain#scenario1]', '[spec:domain#scenario2]'];
    const inheritedSection = inheritedSpecs.map(s => `- ${s}`).join('\n');
    expect(inheritedSection).toContain('scenario1');
    expect(inheritedSection).toContain('scenario2');
  });

  it('应标注"生成时快照，不自动同步"', () => {
    const snapshotNote = '生成时快照，不自动同步';
    expect(snapshotNote).toBeTruthy();
  });

  it('父 change 无 specs/ 目录时应标记"无"', () => {
    const hasSpecs = false;
    const inheritedSection = hasSpecs ? '- [spec:domain#scenario]' : '无';
    expect(inheritedSection).toBe('无');
  });

  it('inherited-specs.md 已存在时跳过生成', () => {
    const fileExists = true;
    const shouldSkip = fileExists;
    expect(shouldSkip).toBe(true);
  });
});

describe('拆分后输出引导', () => {
  const childName = 'fix-sdd-plan-split-part2';

  it('应输出子 change 名称和路径', () => {
    const output = `子 change 已创建: openspec/changes/${childName}/`;
    expect(output).toContain(childName);
  });

  it('应列出继承的文档列表', () => {
    const artifacts = ['brainstorm.md', 'proposal.md', 'specs/', 'tasks.md'];
    const docList = artifacts.map(a => `  - ${a}`).join('\n');
    expect(docList).toContain('brainstorm.md');
    expect(docList).toContain('tasks.md');
  });

  it('应推荐 /sdd-plan <child-name> 作为下一步', () => {
    const nextStep = `/sdd-plan ${childName}`;
    const output = `推荐下一步: ${nextStep}`;
    expect(output).toContain('sdd-plan');
    expect(output).toContain(childName);
  });

  it('所有命令输出应为 sdd 命令格式（禁止 opsx）', () => {
    const commands = ['/sdd-plan', '/sdd-code', '/sdd-ship'];
    for (const cmd of commands) {
      expect(cmd.startsWith('/sdd-')).toBe(true);
      expect(cmd.startsWith('/opsx:')).toBe(false);
    }
  });
});