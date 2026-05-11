import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function readSkillBody(skillName: string): string {
  const filePath = resolveRoot('skills', skillName, 'SKILL.md');
  return parseSkillFrontmatter(filePath).body;
}

function extractPreLogic(body: string): string {
  const match = body.match(/前置逻辑[\s\S]*?(?=\n##[^#]|\n---\n|$)/);
  return match ? match[0] : body;
}

describe('skill preconditions match schema dependencies', () => {
  test('sdd-plan pre-logic checks for tasks.md', () => {
    const pre = extractPreLogic(readSkillBody('sdd-plan'));
    expect(pre, 'sdd-plan pre-logic missing tasks.md check').toContain('tasks');
  });

  test('sdd-code pre-logic checks for tasks.md', () => {
    const pre = extractPreLogic(readSkillBody('sdd-code'));
    expect(pre, 'sdd-code pre-logic missing tasks.md check').toContain('tasks');
  });

  test('sdd-verify pre-logic checks for specs/', () => {
    const pre = extractPreLogic(readSkillBody('sdd-verify'));
    expect(pre, 'sdd-verify pre-logic missing specs/ check').toContain('specs');
  });

  test('sdd-ship pre-logic checks for tasks.md completion', () => {
    const pre = extractPreLogic(readSkillBody('sdd-ship'));
    expect(pre, 'sdd-ship pre-logic missing tasks completion check').toContain('tasks');
  });
});
