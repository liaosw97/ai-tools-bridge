import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

const skillPath = resolveRoot('skills', 'sdd-plan', 'SKILL.md');

function getBody(): string {
  return parseSkillFrontmatter(skillPath).body;
}

// ── Task 3.1: 前置逻辑增加任务规模检测（≤10/11-25/>25） ──

describe('sdd-plan SKILL.md: task scale detection', () => {
  test('contains scale tiers: 小型(≤10), 中型(11-25), 大型(>25)', () => {
    const body = getBody();
    expect(body).toContain('小型');
    expect(body).toContain('中型');
    expect(body).toContain('大型');
    expect(body).toContain('≤10');
    expect(body).toContain('11-25');
    expect(body).toContain('>25');
  });

  test('small scale maps to normal generation', () => {
    const body = getBody();
    expect(body).toContain('正常生成');
  });
});

// ── Task 3.2: 中型任务提示选择模式 ──

describe('sdd-plan SKILL.md: medium task prompt', () => {
  test('contains one-shot and batch generation options', () => {
    const body = getBody();
    expect(body).toContain('一次性生成');
    expect(body).toContain('分批生成');
  });
});

// ── Task 3.3: 大型任务强建议拆分或分批 ──

describe('sdd-plan SKILL.md: large task recommendation', () => {
  test('contains split change option', () => {
    const body = getBody();
    expect(body).toContain('拆分为多个 change');
  });

  test('contains batch generation option for large tasks', () => {
    const body = getBody();
    expect(body).toContain('分批生成');
  });
});

// ── Task 3.4: 分批生成逻辑 + checkpoint 格式 ──

describe('sdd-plan SKILL.md: batch generation logic', () => {
  test('contains batch size guidance (5-10 tasks per batch)', () => {
    const body = getBody();
    expect(body).toContain('5-10 个任务');
  });

  test('contains dependency-based grouping', () => {
    const body = getBody();
    expect(body).toContain('依赖关系');
  });

  test('contains checkpoint format', () => {
    const body = getBody();
    expect(body).toContain('checkpoint');
  });

  test('contains sequential batch generation flow', () => {
    const body = getBody();
    expect(body).toContain('逐批生成');
  });
});

// ── Task 3.5: 拆分 change 提示 ──

describe('sdd-plan SKILL.md: split change prompt', () => {
  test('contains /sdd-propose fallback suggestion', () => {
    const body = getBody();
    expect(body).toContain('/sdd-propose');
  });
});

// ── Task 3.6: 分批模式 reviewer ──

describe('sdd-plan SKILL.md: batch reviewer', () => {
  test('contains per-batch independent review', () => {
    const body = getBody();
    expect(body).toContain('按批次独立审查');
  });

  test('contains cross-batch dependency consistency check', () => {
    const body = getBody();
    expect(body).toContain('跨批次');
    expect(body).toContain('一致性');
  });
});

// ── Task 3.7: 前置校验（tasks.md + spec 存在性检查） ──

describe('sdd-plan SKILL.md: pre-validation', () => {
  test('contains tasks.md existence check with blocking message', () => {
    const body = getBody();
    expect(body).toContain('前置校验');
    expect(body).toContain('缺少 tasks.md');
    expect(body).toContain('请先执行 /sdd-ff');
  });

  test('contains spec existence check with blocking message', () => {
    const body = getBody();
    expect(body).toContain('缺少 spec 文件');
    expect(body).toContain('请先执行 /sdd-ff');
  });

  test('contains empty tasks.md blocking', () => {
    const body = getBody();
    expect(body).toContain('tasks.md 无任务项');
  });

  test('contains blocking condition description', () => {
    const body = getBody();
    expect(body).toContain('阻断');
  });

  test('contains spec link warning for tasks missing [spec:domain#scenario]', () => {
    const body = getBody();
    expect(body).toContain('[spec:domain#scenario]');
    expect(body).toContain('警告');
    expect(body).toContain('缺少链接的任务列表');
  });
});

// ── Task 3.8: 后置推荐操作（★ /sdd-code, ○ /sdd-review-spec） ──

describe('sdd-plan SKILL.md: post-recommendation', () => {
  test('contains ★ /sdd-code recommendation', () => {
    const body = getBody();
    expect(body).toContain('★');
    expect(body).toContain('/sdd-code');
  });

  test('contains ○ /sdd-review-spec recommendation', () => {
    const body = getBody();
    expect(body).toContain('○');
    expect(body).toContain('/sdd-review-spec');
  });
});
