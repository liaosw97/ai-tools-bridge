import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot } from '../setup.js';

const guidelineFiles = [
  'decision-strategy.md',
  'quality-checkpoints.md',
  'token-optimization.md',
  'team-standards.md',
];

describe('guidelines files', () => {
  test('all 4 guideline files exist', () => {
    for (const file of guidelineFiles) {
      const filePath = resolveRoot('guidelines', file);
      expect(fs.existsSync(filePath), `Missing guideline: ${file}`).toBe(true);
    }
  });

  test.each(guidelineFiles)('%s exists', (file) => {
    expect(fs.existsSync(resolveRoot('guidelines', file))).toBe(true);
  });
});
