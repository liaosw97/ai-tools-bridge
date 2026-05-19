import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function getBody(skillDir: string): string {
  const skillPath = resolveRoot('skills', skillDir, 'SKILL.md');
  return parseSkillFrontmatter(skillPath).body;
}

// ── Task 5.1: sdd-brainstorm 前置校验（无前置依赖，直接通过） ──

describe('sdd-brainstorm: pre-validation', () => {
  test('contains pre-validation section', () => {
    const body = getBody('sdd-brainstorm');
    expect(body).toContain('前置校验');
    expect(body).toContain('无前置依赖');
    expect(body).toContain('直接通过');
  });
});

// ── Task 5.2: sdd-propose 前置校验（警告级：brainstorm 决策空项） ──

describe('sdd-propose: pre-validation', () => {
  test('contains brainstorm decision emptiness check', () => {
    const body = getBody('sdd-propose');
    expect(body).toContain('前置校验');
    expect(body).toContain('brainstorm');
    expect(body).toContain('决策');
    expect(body).toContain('空项');
  });

  test('contains warning and force-continue option', () => {
    const body = getBody('sdd-propose');
    expect(body).toContain('警告');
    expect(body).toContain('强制继续');
  });
});

// ── Task 5.3: sdd-ff 前置校验（阻断：proposal 不存在；警告：影响分析为空） ──

describe('sdd-ff: pre-validation', () => {
  test('contains blocking check for missing proposal', () => {
    const body = getBody('sdd-ff');
    expect(body).toContain('前置校验');
    expect(body).toContain('缺少 proposal');
    expect(body).toContain('阻断');
    expect(body).toContain('/sdd-propose');
  });

  test('contains warning for empty impact analysis', () => {
    const body = getBody('sdd-ff');
    expect(body).toContain('影响分析');
    expect(body).toContain('警告');
  });
});

// ── Task 5.4: sdd-code 前置校验（阻断：tasks 不存在；警告：>15 任务无 plan） ──

describe('sdd-code: pre-validation', () => {
  test('contains blocking check for missing tasks', () => {
    const body = getBody('sdd-code');
    expect(body).toContain('前置校验');
    expect(body).toContain('缺少 tasks');
    expect(body).toContain('阻断');
    expect(body).toContain('/sdd-ff');
  });

  test('contains warning for >15 tasks without plan', () => {
    const body = getBody('sdd-code');
    expect(body).toContain('>15');
    expect(body).toContain('plan');
    expect(body).toContain('警告');
    expect(body).toContain('/sdd-plan');
  });
});

// ── Task 5.5: sdd-review-code 前置校验（阻断：无代码变更或无 spec；警告：场景数 < tasks 数） ──

describe('sdd-review-code: pre-validation', () => {
  test('contains blocking checks for missing code changes and specs', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('前置校验');
    expect(body).toContain('代码变更');
    expect(body).toContain('spec');
    expect(body).toContain('阻断');
  });

  test('contains warning for scenario count < tasks count', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('场景数');
    expect(body).toContain('tasks');
    expect(body).toContain('警告');
  });
});

// ── Task 5.6: sdd-verify 前置校验（阻断：spec 或代码不存在） ──

describe('sdd-verify: pre-validation', () => {
  test('contains blocking checks for missing specs and code', () => {
    const body = getBody('sdd-verify');
    expect(body).toContain('前置校验');
    expect(body).toContain('spec');
    expect(body).toContain('代码');
    expect(body).toContain('阻断');
    expect(body).toContain('不存在');
  });
});

// ── Task 5.7: sdd-ship 前置校验（警告：verify 未执行允许跳过；警告：有未通过 review） ──

describe('sdd-ship: pre-validation', () => {
  test('contains warning check for unexecuted verify', () => {
    const body = getBody('sdd-ship');
    expect(body).toContain('前置校验');
    expect(body).toContain('verify');
    expect(body).toContain('警告');
    expect(body).toContain('/sdd-verify');
    expect(body).toContain('允许跳过');
  });

  test('contains warning for unpassed reviews', () => {
    const body = getBody('sdd-ship');
    expect(body).toContain('review');
    expect(body).toContain('警告');
  });
});

// ── Task 5.8: sdd-continue 前置校验（无前置阻断） ──

describe('sdd-continue: pre-validation', () => {
  test('contains pre-validation section', () => {
    const body = getBody('sdd-continue');
    expect(body).toContain('前置校验');
    expect(body).toContain('无前置阻断');
  });
});
