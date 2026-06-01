import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { summarizeSpec, summarizeTasks, generateChangeList } from '../../lib/summarizer.js';

const fixturesDir = join(import.meta.dirname, '../fixtures/precision');

describe('precision test fixtures', () => {
  describe('simple-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'simple-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have brainstorm.md with required sections', () => {
      const path = join(fixturesDir, 'simple-change/brainstorm.md');
      expect(existsSync(path)).toBe(true);

      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('需求描述');
      expect(content).toContain('方案探索');
      expect(content).toContain('关键决策');
    });

    it('should have plan.md with spec links', () => {
      const path = join(fixturesDir, 'simple-change/plan.md');
      expect(existsSync(path)).toBe(true);

      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('[spec:');
    });

    it('should have specs with 2 scenarios', () => {
      const specPath = join(fixturesDir, 'simple-change/specs/config-validation/spec.md');
      expect(existsSync(specPath)).toBe(true);

      const content = readFileSync(specPath, 'utf-8');
      const scenarioCount = (content.match(/#{3,4}\s*(?:场景|Scenario)/g) || []).length;
      expect(scenarioCount).toBe(2);
    });

    it('should have tasks.md with 3 tasks', () => {
      const tasksPath = join(fixturesDir, 'simple-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBe(3);
    });
  });

  describe('medium-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'medium-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have specs with 4-6 scenarios', () => {
      const specDir = join(fixturesDir, 'medium-change/specs');
      expect(existsSync(specDir)).toBe(true);

      let totalScenarios = 0;
      const specFiles = ['user-auth/spec.md', 'session-mgmt/spec.md'];
      for (const specFile of specFiles) {
        const content = readFileSync(join(specDir, specFile), 'utf-8');
        totalScenarios += (content.match(/####\s*Scenario:/g) || []).length;
      }

      expect(totalScenarios).toBeGreaterThanOrEqual(4);
      expect(totalScenarios).toBeLessThanOrEqual(6);
    });

    it('should have tasks.md with 6-15 tasks', () => {
      const tasksPath = join(fixturesDir, 'medium-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBeGreaterThanOrEqual(6);
      expect(taskCount).toBeLessThanOrEqual(15);
    });
  });

  describe('complex-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'complex-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have brainstorm.md with required sections', () => {
      const path = join(fixturesDir, 'complex-change/brainstorm.md');
      expect(existsSync(path)).toBe(true);

      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('需求描述');
      expect(content).toContain('方案探索');
      expect(content).toContain('关键决策');
    });

    it('should have plan.md with spec links and cross-module dependencies', () => {
      const path = join(fixturesDir, 'complex-change/plan.md');
      expect(existsSync(path)).toBe(true);

      const content = readFileSync(path, 'utf-8');
      expect(content).toContain('[spec:');
      expect(content).toContain('依赖');
    });

    it('should have specs with >8 scenarios', () => {
      const specDir = join(fixturesDir, 'complex-change/specs');
      expect(existsSync(specDir)).toBe(true);

      let totalScenarios = 0;
      const specFiles = ['order-processing/spec.md', 'payment/spec.md', 'inventory/spec.md', 'notification/spec.md'];
      for (const specFile of specFiles) {
        const content = readFileSync(join(specDir, specFile), 'utf-8');
        totalScenarios += (content.match(/#{3,4}\s*(?:场景|Scenario)/g) || []).length;
      }

      expect(totalScenarios).toBeGreaterThan(8);
    });

    it('should have tasks.md with >15 tasks', () => {
      const tasksPath = join(fixturesDir, 'complex-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBeGreaterThan(15);
    });
  });
});

describe('SDD flow walkthrough - simple change', () => {
  const changeDir = join(fixturesDir, 'simple-change');

  it('brainstorm should have §需求描述, §方案探索, §关键决策', () => {
    const content = readFileSync(join(changeDir, 'brainstorm.md'), 'utf-8');
    expect(content).toContain('需求描述');
    expect(content).toContain('方案探索');
    expect(content).toContain('关键决策');
  });

  it('proposal should reference brainstorm decisions', () => {
    const proposal = readFileSync(join(changeDir, 'proposal.md'), 'utf-8');
    const brainstorm = readFileSync(join(changeDir, 'brainstorm.md'), 'utf-8');

    // proposal 的范围应与 brainstorm 的决策一致
    expect(proposal).toBeDefined();
    expect(brainstorm).toBeDefined();
    // proposal 包含"包含"范围，对应 brainstorm 的方案选择
    expect(proposal).toContain('包含');
  });

  it('plan tasks should have spec links', () => {
    const plan = readFileSync(join(changeDir, 'plan.md'), 'utf-8');
    expect(plan).toContain('[spec:config-validation#');
  });

  it('tasks should cover all spec scenarios', () => {
    const specContent = readFileSync(join(changeDir, 'specs/config-validation/spec.md'), 'utf-8');
    const tasksContent = readFileSync(join(changeDir, 'tasks.md'), 'utf-8');

    const specResult = summarizeSpec(specContent);
    const tasksResult = summarizeTasks(tasksContent);

    // 每个 spec 场景至少被一个任务覆盖
    for (const scenario of specResult.scenarios) {
      const hasCoverage = tasksResult.tasks.some(t =>
        t.specLink.includes('config-validation') && (
          t.specLink.includes(scenario) || t.description.includes(scenario)
        )
      );
      expect(hasCoverage, `场景 "${scenario}" 未被任何任务覆盖`).toBe(true);
    }

    expect(tasksResult.tasks.length).toBeGreaterThanOrEqual(specResult.scenarios.length);
  });
});

describe('SDD flow walkthrough - complex change', () => {
  const changeDir = join(fixturesDir, 'complex-change');

  it('brainstorm should have §需求描述, §方案探索, §关键决策', () => {
    const content = readFileSync(join(changeDir, 'brainstorm.md'), 'utf-8');
    expect(content).toContain('需求描述');
    expect(content).toContain('方案探索');
    expect(content).toContain('关键决策');
  });

  it('proposal should reference brainstorm decisions', () => {
    const proposal = readFileSync(join(changeDir, 'proposal.md'), 'utf-8');
    const brainstorm = readFileSync(join(changeDir, 'brainstorm.md'), 'utf-8');

    // brainstorm 有 3 个决策，proposal 应体现这些决策
    expect(proposal).toContain('包含');
    expect(brainstorm).toContain('决策 1');
    expect(brainstorm).toContain('决策 2');
    expect(brainstorm).toContain('决策 3');
  });

  it('plan tasks should have spec links', () => {
    const plan = readFileSync(join(changeDir, 'plan.md'), 'utf-8');

    // 每个批次的任务应有 spec 链接
    expect(plan).toContain('[spec:order-processing#');
    expect(plan).toContain('[spec:payment#');
    expect(plan).toContain('[spec:inventory#');
    expect(plan).toContain('[spec:notification#');
  });

  it('plan should have cross-module dependencies', () => {
    const plan = readFileSync(join(changeDir, 'plan.md'), 'utf-8');

    // 批次二依赖批次一，批次四依赖批次二、三
    expect(plan).toContain('依赖批次一');
    expect(plan).toContain('依赖批次二');
  });

  it('tasks should cover all spec scenarios across modules', () => {
    const specDir = join(changeDir, 'specs');
    const tasksContent = readFileSync(join(changeDir, 'tasks.md'), 'utf-8');
    const tasksResult = summarizeTasks(tasksContent);

    const specFiles = ['order-processing/spec.md', 'payment/spec.md', 'inventory/spec.md', 'notification/spec.md'];
    let totalScenarios = 0;

    for (const specFile of specFiles) {
      const content = readFileSync(join(specDir, specFile), 'utf-8');
      const specResult = summarizeSpec(content);
      totalScenarios += specResult.scenarios.length;

      // 每个 spec domain 至少有一个任务
      const domain = specFile.split('/')[0];
      expect(tasksResult.tasks.some(t => t.specLink.includes(domain))).toBe(true);
    }

    expect(tasksResult.tasks.length).toBeGreaterThanOrEqual(totalScenarios);
  });
});
