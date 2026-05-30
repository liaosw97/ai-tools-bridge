import { describe, test, expect } from 'vitest';
import { getSkillDirs, parseSkillFrontmatter } from '../setup.js';
import path from 'node:path';
import fs from 'node:fs';

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

function getAllContent(dir: string): string {
  const skillPath = path.join(dir, 'SKILL.md');
  const result = parseSkillFrontmatter(skillPath);
  let content = result.body;

  // 检查 modules 目录
  const modulesDir = path.join(dir, 'modules');
  if (fs.existsSync(modulesDir)) {
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.md'));
    for (const file of moduleFiles) {
      content += '\n' + fs.readFileSync(path.join(modulesDir, file), 'utf-8');
    }
  }

  return content;
}

describe('skill delegation targets', () => {
  const skillDirs = getSkillDirs();

  test('all delegation targets in SKILL.md match CLAUDE.md table', () => {
    for (const dir of skillDirs) {
      const name = path.basename(dir);
      const expected = expectedDelegations[name];
      if (!expected || expected.length === 0) continue;

      const content = getAllContent(dir);

      for (const target of expected) {
        // 搜索委托目标名称（可能以 `skill-name` 或 `skill: name` 形式出现）
        expect(
          content.includes(target),
          `${name} should delegate to "${target}" but not found in SKILL.md or modules/`,
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
