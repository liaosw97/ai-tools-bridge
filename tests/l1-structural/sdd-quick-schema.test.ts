import { describe, test, expect } from 'vitest';
import { loadSchema, resolveRoot, parseSkillFrontmatter } from '../setup.js';
import fs from 'node:fs';
import path from 'node:path';

// ── Task 7.1: schema.yaml 新增 sdd-quick 和 sdd-test-code action 定义 ──

describe('schema.yaml: sdd-quick and sdd-test-code actions', () => {
  test('schema contains sdd-quick action definition', () => {
    const schema = loadSchema();
    // schema.yaml 应新增 actions 节（区别于现有 artifacts 节）
    expect(schema.actions).toBeDefined();
    expect(schema.actions).toHaveProperty('sdd-quick');
  });

  test('schema contains sdd-test-code action definition', () => {
    const schema = loadSchema();
    expect(schema.actions).toHaveProperty('sdd-test-code');
  });

  test('sdd-quick has no required prerequisites (can be triggered independently)', () => {
    const schema = loadSchema();
    const quick = schema.actions['sdd-quick'];
    expect(quick.description).toBeDefined();
    // sdd-quick 可独立触发，无必需前置
    expect(quick.requires).toEqual([]);
  });

  test('sdd-test-code requires reviews/', () => {
    const schema = loadSchema();
    const testCode = schema.actions['sdd-test-code'];
    expect(testCode.description).toBeDefined();
    expect(testCode.requires).toContain('reviews/');
  });
});

// ── Task 7.2: plugin.json 注册 sdd-quick 和 sdd-test-code ──

describe('plugin.json: sdd-quick and sdd-test-code registration', () => {
  let plugin: Record<string, unknown>;

  test('plugin.json parses successfully', () => {
    const pluginPath = resolveRoot('.claude-plugin', 'plugin.json');
    const content = fs.readFileSync(pluginPath, 'utf-8');
    plugin = JSON.parse(content);
    expect(plugin).toBeDefined();
  });

  test('skills array includes sdd-quick', () => {
    const skills = plugin!.skills as string[];
    expect(skills).toContain('./skills/sdd-quick');
  });

  test('skills array includes sdd-test-code', () => {
    const skills = plugin!.skills as string[];
    expect(skills).toContain('./skills/sdd-test-code');
  });
});

// ── Task 1.1: 创建 sdd-quick 目录结构 + SKILL.md 骨架 ──

describe('sdd-quick SKILL.md skeleton', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('skills/sdd-quick/SKILL.md exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  test('SKILL.md has YAML frontmatter with name: sdd-quick', () => {
    const parsed = parseSkillFrontmatter(skillPath);
    expect(parsed.frontmatter.name).toBe('sdd-quick');
  });

  test('SKILL.md has non-empty description', () => {
    const parsed = parseSkillFrontmatter(skillPath);
    expect(parsed.frontmatter.description.length).toBeGreaterThan(0);
  });
});

// ── Task 1.2: 前置逻辑 + 核心执行 + 后置逻辑 三段结构 ──

describe('sdd-quick SKILL.md: three-layer structure', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('contains 前置逻辑 section', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('前置逻辑');
  });

  test('核心执行 delegates to openspec-continue-change and superpowers:test-driven-development', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('核心执行');
    expect(body).toContain('openspec-continue-change');
    expect(body).toContain('superpowers:test-driven-development');
  });

  test('contains 后置逻辑 section', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('后置逻辑');
  });
});

// ── Task 1.3: 前置自检逻辑 — 复杂度评估 + 回退提示 ──

describe('sdd-quick SKILL.md: complexity self-check', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('contains complexity evaluation logic', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('疑似复杂');
  });

  test('contains /sdd-propose fallback suggestion', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('/sdd-propose');
  });

  test('contains "是否继续" user confirmation', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('是否继续');
  });
});

// ── Task 1.4: proposal 存在时跳过交互收集 ──

describe('sdd-quick SKILL.md: proposal exists shortcut', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('contains proposal.md existence check', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('proposal.md');
  });

  test('contains skip interaction collection path', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('跳过交互收集');
  });
});

// ── Task 1.5: 场景/任务上限检测 + 超限回退 ──

describe('sdd-quick SKILL.md: upper limit detection', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('contains scenario > 5 and task > 10 detection', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('5');
    expect(body).toContain('10');
  });

  test('contains intermediate artifacts reusable hint', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('中间产物可复用');
  });

  test('contains /sdd-propose or /sdd-ff fallback suggestion', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    const hasFallback =
      body.includes('/sdd-propose') || body.includes('/sdd-ff');
    expect(hasFallback).toBe(true);
  });
});

// ── Task 1.6: 完成后 ★○△ 推荐操作 ──

describe('sdd-quick SKILL.md: recommendation output', () => {
  const skillPath = resolveRoot('skills', 'sdd-quick', 'SKILL.md');

  test('contains ★ recommendation header', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('★');
  });

  test('recommends /sdd-review-code or /sdd-ship', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    const hasRecommendation =
      body.includes('/sdd-review-code') || body.includes('/sdd-ship');
    expect(hasRecommendation).toBe(true);
  });

  test('optionally contains /sdd-verify', () => {
    const body = parseSkillFrontmatter(skillPath).body;
    expect(body).toContain('/sdd-verify');
  });
});
