import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot } from '../setup.js';

const reviewerPrompts = [
  { skill: 'sdd-brainstorm', file: 'brainstorm-reviewer-prompt.md' },
  { skill: 'sdd-plan', file: 'plan-reviewer-prompt.md' },
  { skill: 'sdd-review-spec', file: 'spec-reviewer-prompt.md' },
  { skill: 'sdd-review-spec', file: 'scan-reviewer-prompt.md' },
  { skill: 'sdd-review-code', file: 'spec-compliance-reviewer-prompt.md' },
  { skill: 'sdd-review-code', file: 'code-quality-reviewer-prompt.md' },
  { skill: 'sdd-review-code', file: 'scan-reviewer-prompt.md' },
];

describe('reviewer prompts', () => {
  test('all 7 reviewer prompt files exist and are non-empty', () => {
    for (const { skill, file } of reviewerPrompts) {
      const filePath = resolveRoot('skills', skill, file);
      expect(fs.existsSync(filePath), `Missing: ${skill}/${file}`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length, `Empty: ${skill}/${file}`).toBeGreaterThan(0);
    }
  });

  test('each reviewer prompt contains review dimensions section', () => {
    for (const { skill, file } of reviewerPrompts) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      expect(
        content.includes('审查维度'),
        `${skill}/${file} missing 审查维度`,
      ).toBe(true);
    }
  });

  test('each reviewer prompt contains severity levels or classification system', () => {
    for (const { skill, file } of reviewerPrompts) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      // 大部分 reviewer 使用 critical/major/minor
      const hasTraditional =
        content.includes('critical') && content.includes('major') && content.includes('minor');
      // spec-compliance-reviewer 使用 IMPLEMENTED/PARTIAL/MISSING 分类
      const hasCompliance =
        content.includes('IMPLEMENTED') && content.includes('MISSING');
      expect(
        hasTraditional || hasCompliance,
        `${skill}/${file} missing severity/classification system`,
      ).toBe(true);
    }
  });

  test('each reviewer prompt specifies output format with summary and conclusion', () => {
    for (const { skill, file } of reviewerPrompts) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      // 总结/summary: 大部分用"总结"，spec-compliance 可能用"场景覆盖统计"
      const hasSummary =
        content.includes('总结') || content.includes('场景覆盖') || content.includes('统计');
      expect(hasSummary, `${skill}/${file} missing summary section`).toBe(true);
      // Issues 或等价的逐项列表
      const hasIssues =
        content.includes('Issues') || content.includes('逐场景');
      expect(hasIssues, `${skill}/${file} missing issues/scenarios section`).toBe(true);
      // 结论节（可能是 "结论"、"统计" 等）
      const hasConclusion =
        content.includes('结论') || content.includes('统计');
      expect(hasConclusion, `${skill}/${file} missing conclusion section`).toBe(true);
    }
  });
});
