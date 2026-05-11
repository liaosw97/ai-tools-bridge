import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function readSkillBody(skillName: string): string {
  const filePath = resolveRoot('skills', skillName, 'SKILL.md');
  return parseSkillFrontmatter(filePath).body;
}

describe('review loop configuration', () => {
  test('sdd-brainstorm post-logic mentions max 3 review rounds', () => {
    const body = readSkillBody('sdd-brainstorm');
    // 搜索"最多 3 轮"或等价表述
    const hasMax3 =
      body.includes('最多 3 轮') ||
      body.includes('最多3轮') ||
      body.includes('最多 3');
    expect(hasMax3, 'sdd-brainstorm missing "最多 3 轮" constraint').toBe(true);
  });

  test('sdd-plan post-logic mentions max 3 review rounds', () => {
    const body = readSkillBody('sdd-plan');
    const hasMax3 =
      body.includes('最多 3 轮') ||
      body.includes('最多3轮') ||
      body.includes('最多 3');
    expect(hasMax3, 'sdd-plan missing "最多 3 轮" constraint').toBe(true);
  });

  test('review artifacts follow reviews/<artifact>-r<N>.md naming', () => {
    const brainstormBody = readSkillBody('sdd-brainstorm');
    const planBody = readSkillBody('sdd-plan');
    // brainstorm 应引用 reviews/brainstorm-r<N>.md
    expect(brainstormBody).toContain('brainstorm-r');
    // plan 应引用 reviews/plan-r<N>.md
    expect(planBody).toContain('plan-r');
  });
});
