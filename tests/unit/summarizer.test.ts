import { describe, it, expect } from 'vitest';
import { summarizeSpec, summarizeTasks, calculateCoverage } from '../../lib/summarizer.js';

describe('summarizeSpec', () => {
  it('should extract scenario names from spec content', () => {
    const specContent = `
## ADDED Requirements

### Requirement: Artifact 摘要传递

系统 SHALL 使用摘要代替完整 artifact 内容传递给 subagent。

#### Scenario: spec 场景列表传递
- **GIVEN** spec 文件包含多个 GIVEN/WHEN/THEN 场景
- **WHEN** 传递 spec 给 subagent
- **THEN** 系统传递 spec 场景列表（场景名称 + 关键字段），而非完整 spec 文件

#### Scenario: task 摘要传递
- **GIVEN** tasks.md 包含多个任务项
- **WHEN** 传递 tasks 给 subagent
- **THEN** 系统传递 task 摘要（任务编号 + 描述 + spec 链接），而非完整 tasks.md

#### Scenario: 关键字段保留
- **GIVEN** artifact 包含关键字段
- **WHEN** 生成 artifact 摘要
- **THEN** 系统强制保留以下关键字段，关键信息覆盖率 ≥95%
`;

    const result = summarizeSpec(specContent);

    expect(result.scenarios).toContain('spec 场景列表传递');
    expect(result.scenarios).toContain('task 摘要传递');
    expect(result.scenarios).toContain('关键字段保留');
    expect(result.scenarios.length).toBe(3);
  });

  it('should extract GIVEN/WHEN/THEN triples', () => {
    const specContent = `
#### Scenario: spec 场景列表传递
- **GIVEN** spec 文件包含多个 GIVEN/WHEN/THEN 场景
- **WHEN** 传递 spec 给 subagent
- **THEN** 系统传递 spec 场景列表（场景名称 + 关键字段），而非完整 spec 文件
`;

    const result = summarizeSpec(specContent);

    expect(result.triples.length).toBe(1);
    expect(result.triples[0].given).toContain('spec 文件包含多个 GIVEN/WHEN/THEN 场景');
    expect(result.triples[0].when).toContain('传递 spec 给 subagent');
    expect(result.triples[0].then).toContain('系统传递 spec 场景列表');
  });
});

describe('summarizeTasks', () => {
  it('should extract task numbers and spec links', () => {
    const tasksContent = `
## 1. 懒加载实现

- [ ] 1.1 拆分 sdd-brainstorm（472行 → 3个模块：核心流程、角色系统、拆分模式）[spec:lazy-loading#skill-文件模块化拆分]
- [ ] 1.2 拆分 sdd-plan（285行 → 核心流程 + 分批模式）[spec:lazy-loading#skill-文件模块化拆分]
`;

    const result = summarizeTasks(tasksContent);

    expect(result.tasks.length).toBe(2);
    expect(result.tasks[0].number).toBe('1.1');
    expect(result.tasks[0].specLink).toContain('spec:lazy-loading#skill-文件模块化拆分');
    expect(result.tasks[1].number).toBe('1.2');
  });
});

describe('calculateCoverage', () => {
  it('should calculate coverage percentage', () => {
    const original = 'field1 field2 field3 field4 field5';
    const summary = 'field1 field2 field3';

    const coverage = calculateCoverage(original, summary);

    expect(coverage).toBe(60);
  });

  it('should return 100% for complete coverage', () => {
    const original = 'field1 field2 field3';
    const summary = 'field1 field2 field3';

    const coverage = calculateCoverage(original, summary);

    expect(coverage).toBe(100);
  });
});
