import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

// skill → 期望在 SKILL.md 正文中引用的 reviewer prompt 文件名
const expectedPromptRefs: Record<string, string[]> = {
  'sdd-brainstorm': ['brainstorm-reviewer-prompt.md'],
  'sdd-plan': ['plan-reviewer-prompt.md'],
  'sdd-review-spec': ['spec-reviewer-prompt.md', 'scan-reviewer-prompt.md'],
  'sdd-review-code': ['spec-compliance-reviewer-prompt.md', 'scan-reviewer-prompt.md'],
  // code-quality-reviewer-prompt.md 由 Phase 2 委托隐式使用，未在正文中直接引用
};

describe('reviewer prompt alignment', () => {
  test('each skill with review references correct reviewer prompts', () => {
    for (const [skill, prompts] of Object.entries(expectedPromptRefs)) {
      const body = parseSkillFrontmatter(
        resolveRoot('skills', skill, 'SKILL.md'),
      ).body;
      for (const prompt of prompts) {
        expect(
          body.includes(prompt),
          `${skill} SKILL.md should reference "${prompt}"`,
        ).toBe(true);
      }
    }
  });

  test('all referenced reviewer prompt files exist on disk', () => {
    for (const [skill, prompts] of Object.entries(expectedPromptRefs)) {
      for (const prompt of prompts) {
        const filePath = resolveRoot('skills', skill, prompt);
        expect(
          fs.existsSync(filePath),
          `Missing file: ${skill}/${prompt}`,
        ).toBe(true);
      }
    }
  });
});
