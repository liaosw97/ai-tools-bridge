import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter, loadSchema } from '../setup.js';
import fs from 'node:fs';

// ── Task 2.1: 创建 sdd-test-code 目录和 SKILL.md 骨架 ──

describe('sdd-test-code SKILL.md skeleton', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('skills/sdd-test-code/SKILL.md exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  test('SKILL.md has YAML frontmatter with name: sdd-test-code', () => {
    const parsed = parseSkillFrontmatter(skillPath);
    expect(parsed.frontmatter.name).toBe('sdd-test-code');
  });

  test('SKILL.md has non-empty description', () => {
    const parsed = parseSkillFrontmatter(skillPath);
    expect(parsed.frontmatter.description.length).toBeGreaterThan(0);
  });
});

// ── Task 2.2: 三层结构 + 委托 + Override ──

describe('sdd-test-code SKILL.md: three-layer structure', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('前置逻辑 contains "读取 review 报告"', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('前置逻辑');
    expect(body).toContain('review');
  });

  test('核心执行 delegates to superpowers:test-driven-development', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('核心执行');
    expect(body).toContain('superpowers:test-driven-development');
  });

  test('Override contains "不修改实现代码"', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('不修改实现代码');
  });
});

// ── Task 2.3: 读取 spec-compliance 报告 + PARTIAL/MISSING 提取 ──

describe('sdd-test-code SKILL.md: spec-compliance report reading', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains spec-compliance report reference', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('spec-compliance');
  });

  test('contains PARTIAL and MISSING extraction logic', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('PARTIAL');
    expect(body).toContain('MISSING');
  });
});

// ── Task 2.4: 读取 code-quality 报告 + 测试质量 issues ──

describe('sdd-test-code SKILL.md: code-quality report reading', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains code-quality report reference', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('code-quality');
  });

  test('contains test quality issues extraction', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('测试质量');
  });
});

// ── Task 2.5: RED-GREEN 循环 + 独立提交 ──

describe('sdd-test-code SKILL.md: RED-GREEN loop', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains RED and GREEN step descriptions', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('RED');
    expect(body).toContain('GREEN');
  });

  test('contains independent commit per scenario', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('独立提交');
  });
});

// ── Task 2.6: 无缺失时空操作提示 ──

describe('sdd-test-code SKILL.md: no-missing handling', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains no PARTIAL/MISSING judgment', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('无 PARTIAL/MISSING');
  });

  test('contains skip suggestion', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('跳过');
  });
});

// ── Task 2.7: 独立触发时定位最新报告 + 时间跨度警告 ──

describe('sdd-test-code SKILL.md: independent trigger', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains latest report locating logic', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('最新');
  });

  test('contains time span warning', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('时间跨度');
  });
});

// ── Task 2.8: 完成后推荐操作 ──

describe('sdd-test-code SKILL.md: recommendation output', () => {
  const skillPath = resolveRoot('skills', 'sdd-test-code', 'SKILL.md');

  test('contains ★ /sdd-verify', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('/sdd-verify');
  });

  test('contains ○ /sdd-ship', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('/sdd-ship');
  });
});

// ── Task 2.9: reference-tdd-tests.md ──

describe('sdd-test-code reference-tdd-tests.md', () => {
  const refPath = resolveRoot('skills', 'sdd-test-code', 'reference-tdd-tests.md');

  test('file exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  test('contains source attribution', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('skills/engineering/tdd/tests.md');
  });
});

// ── Task 2.10: reference-tdd-mocking.md ──

describe('sdd-test-code reference-tdd-mocking.md', () => {
  const refPath = resolveRoot('skills', 'sdd-test-code', 'reference-tdd-mocking.md');

  test('file exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  test('contains source attribution', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('skills/engineering/tdd/mocking.md');
  });
});

// ── L2 integration: sdd-test-code in delegation list ──

describe('sdd-test-code schema action consistency', () => {
  test('schema actions includes sdd-test-code with reviews/ requirement', () => {
    const schema = loadSchema();
    const action = schema.actions['sdd-test-code'];
    expect(action).toBeDefined();
    expect(action.requires).toContain('reviews/');
  });
});
