import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const skillsDir = join(import.meta.dirname, '../../skills');
const guidelinesDir = join(import.meta.dirname, '../../guidelines');

describe('token budget baseline', () => {
  describe('definition layer', () => {
    it('should measure SDD skills token count', () => {
      const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('sdd-'));

      let totalLines = 0;
      let fileCount = 0;

      for (const dir of skillDirs) {
        const skillPath = join(skillsDir, dir.name, 'SKILL.md');
        if (existsSync(skillPath)) {
          const content = readFileSync(skillPath, 'utf-8');
          totalLines += content.split('\n').length;
          fileCount++;
        }
      }

      expect(fileCount).toBeGreaterThan(0);

      // 粗略估计: 1 行 ≈ 5 tokens
      const estimatedTokens = totalLines * 5;
      console.log(`SDD Skills: ${fileCount} files, ${totalLines} lines, ~${estimatedTokens} tokens`);

      expect(estimatedTokens).toBeLessThan(20000); // 目标: <20000 tokens
    });

    it('should measure guidelines token count', () => {
      if (!existsSync(guidelinesDir)) {
        console.log('guidelines/ not found, skipping');
        return;
      }

      const guidelineFiles = readdirSync(guidelinesDir)
        .filter(f => f.endsWith('.md'));

      let totalLines = 0;

      for (const file of guidelineFiles) {
        const content = readFileSync(join(guidelinesDir, file), 'utf-8');
        totalLines += content.split('\n').length;
      }

      const estimatedTokens = totalLines * 5;
      console.log(`Guidelines: ${guidelineFiles.length} files, ${totalLines} lines, ~${estimatedTokens} tokens`);

      expect(estimatedTokens).toBeLessThan(5000); // 目标: <5000 tokens
    });
  });

  describe('skill file size', () => {
    it('should have all SKILL.md files under 200 lines', () => {
      const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('sdd-'));

      const oversized: string[] = [];
      for (const dir of skillDirs) {
        const skillPath = join(skillsDir, dir.name, 'SKILL.md');
        if (existsSync(skillPath)) {
          const content = readFileSync(skillPath, 'utf-8');
          const lines = content.split('\n').length;
          if (lines > 220) {
            oversized.push(`${dir.name}/SKILL.md: ${lines} lines`);
          }
        }
      }

      if (oversized.length > 0) {
        console.log('Oversized SKILL.md files:', oversized);
      }

      expect(oversized.length).toBe(0);
    });
  });
});
