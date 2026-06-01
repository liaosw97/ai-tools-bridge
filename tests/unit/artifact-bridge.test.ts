import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { passSpecToSubagent, passTasksToSubagent } from '../../lib/artifact-bridge.js';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

const testDir = join(import.meta.dirname, '../fixtures');
const specPath = join(testDir, 'test-spec.md');
const tasksPath = join(testDir, 'test-tasks.md');

const specContent = `
## ADDED Requirements

### Requirement: Artifact 摘要传递

#### Scenario: spec 场景列表传递
- **GIVEN** spec 文件包含多个 GIVEN/WHEN/THEN 场景
- **WHEN** 传递 spec 给 subagent
- **THEN** 系统传递 spec 场景列表（场景名称 + 关键字段），而非完整 spec 文件

#### Scenario: task 摘要传递
- **GIVEN** tasks.md 包含多个任务项
- **WHEN** 传递 tasks 给 subagent
- **THEN** 系统传递 task 摘要（任务编号 + 描述 + spec 链接），而非完整 tasks.md
`;

const tasksContent = `
## 1. 懒加载实现

- [ ] 1.1 拆分 sdd-brainstorm（472行 → 3个模块）[spec:lazy-loading#skill-文件模块化拆分]
- [ ] 1.2 拆分 sdd-plan（285行 → 核心流程 + 分批模式）[spec:lazy-loading#skill-文件模块化拆分]
`;

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
  writeFileSync(specPath, specContent);
  writeFileSync(tasksPath, tasksContent);
});

afterEach(() => {
  try {
    unlinkSync(specPath);
    unlinkSync(tasksPath);
  } catch (e) {
    // ignore
  }
});

describe('passSpecToSubagent', () => {
  it('should return summary instead of full content', () => {
    const result = passSpecToSubagent(specPath);

    expect(result).toContain('spec 场景列表传递');
    expect(result).toContain('task 摘要传递');
    expect(result.length).toBeLessThan(specContent.length);
  });

  it('should include scenario names', () => {
    const result = passSpecToSubagent(specPath);

    expect(result).toContain('spec 场景列表传递');
    expect(result).toContain('task 摘要传递');
  });
});

describe('passTasksToSubagent', () => {
  it('should return task summary', () => {
    const result = passTasksToSubagent(tasksPath);

    expect(result).toContain('1.1');
    expect(result).toContain('1.2');
    expect(result).toContain('spec:lazy-loading#skill-文件模块化拆分');
  });

  it('should contain task information', () => {
    const result = passTasksToSubagent(tasksPath);

    expect(result).toContain('1.1');
    expect(result).toContain('1.2');
    expect(result).toContain('拆分 sdd-brainstorm');
    expect(result).toContain('拆分 sdd-plan');
  });
});

describe('error handling', () => {
  it('should return error message for non-existent spec file', () => {
    const result = passSpecToSubagent('/non/existent/spec.md');

    expect(result).toContain('错误');
    expect(result).toContain('/non/existent/spec.md');
  });

  it('should return error message for non-existent tasks file', () => {
    const result = passTasksToSubagent('/non/existent/tasks.md');

    expect(result).toContain('错误');
    expect(result).toContain('/non/existent/tasks.md');
  });
});
