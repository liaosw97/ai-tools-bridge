import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { getSkillDirs, parseSkillFrontmatter } from '../setup.js';

const skillDirs = getSkillDirs();

describe('skill name matches directory', () => {
  test.each(skillDirs.map((d) => [path.basename(d), d]))(
    'frontmatter name in %s matches directory name',
    (dirName, dir) => {
      const result = parseSkillFrontmatter(path.join(dir, 'SKILL.md'));
      expect(result.frontmatter.name).toBe(dirName);
    },
  );
});
