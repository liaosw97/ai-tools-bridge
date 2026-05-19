import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function getBody(skillDir: string): string {
  const skillPath = resolveRoot('skills', skillDir, 'SKILL.md');
  return parseSkillFrontmatter(skillPath).body;
}

const scanPromptFiles = [
  { skill: 'sdd-review-code', file: 'scan-reviewer-prompt.md' },
  { skill: 'sdd-review-spec', file: 'scan-reviewer-prompt.md' },
];

describe('scan-review phase: prompt files', () => {
  test('scan-reviewer-prompt.md files exist and are non-empty', () => {
    for (const { skill, file } of scanPromptFiles) {
      const filePath = resolveRoot('skills', skill, file);
      expect(fs.existsSync(filePath), `Missing: ${skill}/${file}`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length, `Empty: ${skill}/${file}`).toBeGreaterThan(0);
    }
  });

  test('scan reviewer prompts contain review dimensions section', () => {
    for (const { skill, file } of scanPromptFiles) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      expect(
        content.includes('审查维度'),
        `${skill}/${file} missing 审查维度`,
      ).toBe(true);
    }
  });

  test('scan reviewer prompts contain severity classification', () => {
    for (const { skill, file } of scanPromptFiles) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      const hasSeverity =
        (content.includes('critical') && content.includes('major') && content.includes('minor')) ||
        (content.includes('SCANNED') && content.includes('SKIPPED'));
      expect(
        hasSeverity,
        `${skill}/${file} missing severity/classification system`,
      ).toBe(true);
    }
  });

  test('scan reviewer prompts specify output format', () => {
    for (const { skill, file } of scanPromptFiles) {
      const content = fs.readFileSync(resolveRoot('skills', skill, file), 'utf-8');
      expect(content.includes('总结') || content.includes('扫描结果'),
        `${skill}/${file} missing summary section`).toBe(true);
      expect(content.includes('结论'),
        `${skill}/${file} missing conclusion section`).toBe(true);
    }
  });
});

describe('scan-review phase: SKILL.md integration', () => {
  test('sdd-review-code references scan-reviewer-prompt.md', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('scan-reviewer-prompt.md');
  });

  test('sdd-review-code has scanning phase between Phase 1 and Phase 2', () => {
    const body = getBody('sdd-review-code');
    // Phase 1.5 或扫描阶段
    const hasScanPhase =
      body.includes('Phase 1.5') || body.includes('规范扫描');
    expect(hasScanPhase, 'sdd-review-code missing scan phase').toBe(true);
  });

  test('sdd-review-code mentions work type detection', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('skill 开发');
    expect(body).toContain('代码开发');
  });

  test('sdd-review-code mentions skill-craft for skill scanning', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('skill-craft-adapter');
  });

  test('sdd-review-code mentions scan report output', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('scan-r');
  });

  test('sdd-review-code mentions skip behavior when no skill found', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('SKIPPED');
  });

  test('sdd-review-spec mentions skill-craft for spec scanning', () => {
    const body = getBody('sdd-review-spec');
    expect(body).toContain('skill-craft-adapter');
  });

  test('sdd-review-spec references scan-reviewer-prompt.md', () => {
    const body = getBody('sdd-review-spec');
    expect(body).toContain('scan-reviewer-prompt.md');
  });

  test('sdd-review-spec has scanning phase', () => {
    const body = getBody('sdd-review-spec');
    const hasScanPhase =
      body.includes('规范扫描') || body.includes('扫描阶段');
    expect(hasScanPhase, 'sdd-review-spec missing scan phase').toBe(true);
  });

  test('sdd-review-spec mentions scan report output', () => {
    const body = getBody('sdd-review-spec');
    expect(body).toContain('scan-r');
  });
});
