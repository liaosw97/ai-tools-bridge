import { describe, test, expect } from 'vitest';
import { getSkillDirs, parseSkillFrontmatter } from '../setup.js';
import path from 'node:path';

// 委托类 skill（有外部 skill 委托）
const delegatingSkills = [
  'sdd-brainstorm',
  'sdd-propose',
  'sdd-continue',
  'sdd-ff',
  'sdd-plan',
  'sdd-code',
  'sdd-quick',
  'sdd-review-code',
  'sdd-verify',
  'sdd-ship',
];

describe('three-layer skill structure', () => {
  const skillDirs = getSkillDirs();
  const skillMap = new Map(
    skillDirs.map((d) => [path.basename(d), d]),
  );

  test('9 delegating skills have 前置逻辑 section', () => {
    for (const name of delegatingSkills) {
      const body = parseSkillFrontmatter(
        path.join(skillMap.get(name)!, 'SKILL.md'),
      ).body;
      expect(body, `${name} missing 前置逻辑`).toContain('前置逻辑');
    }
  });

  test('9 delegating skills have core execution section', () => {
    for (const name of delegatingSkills) {
      const body = parseSkillFrontmatter(
        path.join(skillMap.get(name)!, 'SKILL.md'),
      ).body;
      // 大部分 skill 使用"核心执行"，sdd-review-code 使用"Phase 1"/"Phase 2"
      const hasCoreExec =
        body.includes('核心执行') ||
        body.includes('Phase 1') ||
        body.includes('阶段');
      expect(hasCoreExec, `${name} missing core execution section`).toBe(true);
    }
  });

  test('9 delegating skills have 后置逻辑 section', () => {
    for (const name of delegatingSkills) {
      const body = parseSkillFrontmatter(
        path.join(skillMap.get(name)!, 'SKILL.md'),
      ).body;
      expect(body, `${name} missing 后置逻辑`).toContain('后置逻辑');
    }
  });

  test('sdd-doctor has no delegation or Override', () => {
    const body = parseSkillFrontmatter(
      path.join(skillMap.get('sdd-doctor')!, 'SKILL.md'),
    ).body;
    expect(body).not.toContain('invoke `superpowers:');
    expect(body).not.toContain('Override 指令');
  });

  test('sdd-review-spec uses SDD自有 subagent not external skill', () => {
    const body = parseSkillFrontmatter(
      path.join(skillMap.get('sdd-review-spec')!, 'SKILL.md'),
    ).body;
    expect(body).toContain('SDD 自有');
  });
});
