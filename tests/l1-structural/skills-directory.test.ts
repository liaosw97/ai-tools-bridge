import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot } from '../setup.js';

describe('skills directory structure', () => {
  test('skills/ has exactly 11 sdd-* subdirectories', () => {
    const skillsDir = resolveRoot('skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const sddDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith('sdd-'));
    expect(sddDirs).toHaveLength(12);
  });

  test('no non-sdd-* directories exist under skills/', () => {
    const skillsDir = resolveRoot('skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const nonSddDirs = entries.filter(
      (e) => e.isDirectory() && !e.name.startsWith('sdd-'),
    );
    expect(nonSddDirs).toHaveLength(0);
  });
});
