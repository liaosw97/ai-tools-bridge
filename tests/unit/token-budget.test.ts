import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const projectRoot = join(import.meta.dirname, '../..');

interface TokenStats {
  files: number;
  lines: number;
  tokens: number;
}

function measureDir(dirPath: string, pattern: RegExp): TokenStats {
  if (!existsSync(dirPath)) {
    return { files: 0, lines: 0, tokens: 0 };
  }

  let files = 0;
  let lines = 0;

  const entries = readdirSync(dirPath, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile() && pattern.test(entry.name)) {
      const filePath = join(entry.parentPath || entry.path, entry.name);
      const content = readFileSync(filePath, 'utf-8');
      lines += content.split('\n').length;
      files++;
    }
  }

  return { files, lines, tokens: lines * 5 }; // 粗略估计: 1 行 ≈ 5 tokens
}

describe('token budget', () => {
  describe('definition layer', () => {
    it('should measure SDD skills', () => {
      const skillsDir = join(projectRoot, 'skills');
      const stats = measureDir(skillsDir, /SKILL\.md$/);

      console.log(`SDD Skills: ${stats.files} files, ${stats.lines} lines, ~${stats.tokens} tokens`);

      expect(stats.files).toBeGreaterThan(0);
      expect(stats.tokens).toBeLessThan(20000);
    });

    it('should measure guidelines', () => {
      const guidelinesDir = join(projectRoot, 'guidelines');
      const stats = measureDir(guidelinesDir, /\.md$/);

      console.log(`Guidelines: ${stats.files} files, ${stats.lines} lines, ~${stats.tokens} tokens`);

      expect(stats.tokens).toBeLessThan(5000);
    });

    it('should measure templates', () => {
      const templatesDir = join(projectRoot, 'schemas/sdd/templates');
      const stats = measureDir(templatesDir, /\.md$/);

      console.log(`Templates: ${stats.files} files, ${stats.lines} lines, ~${stats.tokens} tokens`);

      expect(stats.tokens).toBeLessThan(3000);
    });

    it('should measure reviewer prompts', () => {
      const skillsDir = join(projectRoot, 'skills');
      const stats = measureDir(skillsDir, /reviewer-prompt\.md$/);

      console.log(`Reviewer Prompts: ${stats.files} files, ${stats.lines} lines, ~${stats.tokens} tokens`);
    });

    it('should generate total definition layer report', () => {
      const skillsDir = join(projectRoot, 'skills');
      const guidelinesDir = join(projectRoot, 'guidelines');
      const templatesDir = join(projectRoot, 'schemas/sdd/templates');

      const skillsStats = measureDir(skillsDir, /SKILL\.md$/);
      const guidelinesStats = measureDir(guidelinesDir, /\.md$/);
      const templatesStats = measureDir(templatesDir, /\.md$/);

      const totalTokens = skillsStats.tokens + guidelinesStats.tokens + templatesStats.tokens;

      console.log('\n=== Definition Layer Token Budget ===');
      console.log(`SDD Skills: ${skillsStats.tokens} tokens`);
      console.log(`Guidelines: ${guidelinesStats.tokens} tokens`);
      console.log(`Templates: ${templatesStats.tokens} tokens`);
      console.log(`Total: ${totalTokens} tokens`);

      expect(totalTokens).toBeLessThan(30000);
    });
  });
});
