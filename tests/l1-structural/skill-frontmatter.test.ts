import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { getSkillDirs, parseSkillFrontmatter } from '../setup.js';

const skillDirs = getSkillDirs();

describe('skill frontmatter name and description', () => {
  test.each(skillDirs.map((d) => [path.basename(d), d]))(
    'SKILL.md in %s has name and description in frontmatter',
    (_name, dir) => {
      const result = parseSkillFrontmatter(path.join(dir, 'SKILL.md'));
      expect(typeof result.frontmatter.name).toBe('string');
      expect(result.frontmatter.name.length).toBeGreaterThan(0);
      expect(typeof result.frontmatter.description).toBe('string');
      expect(result.frontmatter.description.length).toBeGreaterThan(0);
    },
  );
});
