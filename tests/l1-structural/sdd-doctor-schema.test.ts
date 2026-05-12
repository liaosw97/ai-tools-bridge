import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

const skillPath = resolveRoot('skills', 'sdd-doctor', 'SKILL.md');

function getBody(): string {
  return parseSkillFrontmatter(skillPath).body;
}

// ── Task 4.1: sdd-doctor 增加复杂度评估段落（五维度 + S/M/L 评级） ──

describe('sdd-doctor SKILL.md: complexity assessment', () => {
  test('contains five-dimension assessment', () => {
    const body = getBody();
    expect(body).toContain('spec 场景数量');
    expect(body).toContain('tasks 数量');
    expect(body).toContain('影响文件数');
    expect(body).toContain('涉及领域数');
    expect(body).toContain('外部依赖变更');
  });

  test('contains S/M/L rating rules', () => {
    const body = getBody();
    expect(body).toContain('简单');
    expect(body).toContain('中等');
    expect(body).toContain('复杂');
    expect(body).toContain('1-3');
    expect(body).toContain('≤5');
    expect(body).toContain('4-8');
    expect(body).toContain('6-15');
    expect(body).toContain('>8');
    expect(body).toContain('>15');
  });

  test('contains "take highest" rule for conflicting dimensions', () => {
    const body = getBody();
    expect(body).toContain('就高不就低');
  });
});

// ── Task 4.2: 纯环境诊断保持原有行为（无 change 时不评估） ──

describe('sdd-doctor SKILL.md: no-change behavior', () => {
  test('skips complexity assessment when no active changes', () => {
    const body = getBody();
    expect(body).toContain('无活跃变更');
    expect(body).toContain('跳过复杂度评估');
  });
});

// ── Task 4.3: 无 spec/tasks 时仅输出环境状态 ──

describe('sdd-doctor SKILL.md: missing artifacts behavior', () => {
  test('skips assessment when specs/ and tasks.md are missing', () => {
    const body = getBody();
    expect(body).toContain('缺少 specs/ 和 tasks.md');
    expect(body).toContain('根据缺失制品推荐下一步');
  });
});

// ── Task 4.4: 简单(S)推荐 /sdd-quick ──

describe('sdd-doctor SKILL.md: simple (S) recommendation', () => {
  test('recommends /sdd-quick for simple rating', () => {
    const body = getBody();
    expect(body).toContain('/sdd-quick');
    expect(body).toContain('标准路径');
  });
});

// ── Task 4.5: 中等(M)推荐标准路径 ──

describe('sdd-doctor SKILL.md: medium (M) recommendation', () => {
  test('recommends standard path for medium rating', () => {
    const body = getBody();
    expect(body).toContain('/sdd-propose');
    expect(body).toContain('/sdd-ff');
    expect(body).toContain('/sdd-plan');
    expect(body).toContain('/sdd-code');
    expect(body).toContain('可跳过 brainstorm');
  });
});

// ── Task 4.6: 复杂(L)推荐完整流程 ──

describe('sdd-doctor SKILL.md: large (L) recommendation', () => {
  test('recommends full workflow for complex rating', () => {
    const body = getBody();
    expect(body).toContain('brainstorm');
    expect(body).toContain('propose');
    expect(body).toContain('plan');
    expect(body).toContain('review');
    expect(body).toContain('verify');
    expect(body).toContain('ship');
  });

  test('suggests batch plan generation for large changes', () => {
    const body = getBody();
    expect(body).toContain('分批生成');
  });
});

// ── Task 4.7: sdd-doctor 增加后置推荐操作 ──

describe('sdd-doctor SKILL.md: post-recommendation', () => {
  test('contains ★ complexity-based path recommendation', () => {
    const body = getBody();
    expect(body).toContain('★');
    expect(body).toContain('推荐下一步');
  });

  test('contains ○ manual start option', () => {
    const body = getBody();
    expect(body).toContain('○');
    expect(body).toContain('/sdd-brainstorm');
  });
});
