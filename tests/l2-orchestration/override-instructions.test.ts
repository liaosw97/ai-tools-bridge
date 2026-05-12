import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function readSkillBody(skillName: string): string {
  const filePath = resolveRoot('skills', skillName, 'SKILL.md');
  return parseSkillFrontmatter(filePath).body;
}

function extractOverrideSection(body: string): string {
  // 提取从 "Override 指令" 到下一个 "##" 级别标题之间的内容
  const match = body.match(/Override 指令([\s\S]*?)(?=\n##[^#]|\n---\n|$)/);
  return match ? match[0] : body; // fallback to full body if pattern fails
}

describe('override instructions completeness', () => {
  test('sdd-brainstorm Override covers 4 elements', () => {
    const body = readSkillBody('sdd-brainstorm');
    const section = extractOverrideSection(body);
    expect(section, 'Missing output redirect').toContain('openspec/changes');
    expect(section, 'Missing template format').toContain('templates');
    expect(section, 'Missing no auto-chain').toContain('不要自动');
    expect(section, 'Missing skip internal reviewer').toContain('跳过');
  });

  test('sdd-plan Override covers 5 elements', () => {
    const body = readSkillBody('sdd-plan');
    const section = extractOverrideSection(body);
    expect(section, 'Missing output redirect').toContain('openspec/changes');
    expect(section, 'Missing template format').toContain('templates');
    expect(section, 'Missing no auto-chain').toContain('不要自动');
    expect(section, 'Missing skip reviewer').toContain('跳过');
    expect(section, 'Missing TDD requirement').toContain('RED');
  });

  test('sdd-review-code Phase 2 Override covers 3 elements', () => {
    const body = readSkillBody('sdd-review-code');
    // 查找阶段 2 或 Phase 2 的 Override 部分
    const phase2Match = body.match(/阶段\s*2[\s\S]*?(?=\n##[^#]|\n---\n|$)/);
    const section = phase2Match ? phase2Match[0] : body;
    expect(section, 'Missing output location').toContain('openspec/changes');
    expect(section, 'Missing review focus').toContain('审查焦点');
    expect(section, 'Missing skip functionality check').toContain('不需要');
  });

  test('sdd-quick Override covers output redirect and no auto-chain', () => {
    const body = readSkillBody('sdd-quick');
    expect(body, 'Missing output redirect').toContain('openspec/changes');
    expect(body, 'Missing no auto-chain').toContain('不自动链式调用');
  });
});
