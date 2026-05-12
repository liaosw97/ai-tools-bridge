import { describe, test, expect } from 'vitest';
import { getSkillDirs, parseSkillFrontmatter } from '../setup.js';
import path from 'node:path';

// CLAUDE.md 中记录的委托表
const expectedDelegations: Record<string, string[]> = {
  'sdd-doctor': [],
  'sdd-brainstorm': ['superpowers:brainstorming'],
  'sdd-propose': ['openspec-continue-change', 'openspec-propose'],
  'sdd-continue': ['openspec-continue-change'],
  'sdd-ff': ['openspec-ff-change'],
  'sdd-plan': ['superpowers:writing-plans'],
  'sdd-code': [
    'superpowers:using-git-worktrees',
    'superpowers:test-driven-development',
    'superpowers:systematic-debugging',
  ],
  'sdd-quick': [
    'openspec-continue-change',
    'superpowers:test-driven-development',
  ],
  'sdd-review-spec': [],
  'sdd-review-code': ['superpowers:requesting-code-review'],
  'sdd-test-code': ['superpowers:test-driven-development'],
  'sdd-verify': [
    'superpowers:verification-before-completion',
    'openspec-verify-change',
  ],
  'sdd-ship': [
    'openspec-sync-specs',
    'openspec-archive-change',
    'superpowers:finishing-a-development-branch',
  ],
};

describe('skill delegation targets', () => {
  const skillDirs = getSkillDirs();

  test('all delegation targets in SKILL.md match CLAUDE.md table', () => {
    for (const dir of skillDirs) {
      const name = path.basename(dir);
      const expected = expectedDelegations[name];
      if (!expected || expected.length === 0) continue;

      const result = parseSkillFrontmatter(path.join(dir, 'SKILL.md'));
      const body = result.body;

      for (const target of expected) {
        // 搜索委托目标名称（可能以 `skill-name` 或 `skill: name` 形式出现）
        expect(
          body.includes(target),
          `${name} should delegate to "${target}" but not found in SKILL.md`,
        ).toBe(true);
      }
    }
  });

  test('sdd-doctor has no delegation', () => {
    const dir = skillDirs.find((d) => path.basename(d) === 'sdd-doctor')!;
    const result = parseSkillFrontmatter(path.join(dir, 'SKILL.md'));
    expect(result.body).not.toContain('invoke `superpowers:');
    expect(result.body).not.toContain('invoke `openspec-');
  });
});
