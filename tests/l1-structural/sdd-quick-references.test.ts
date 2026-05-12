import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot } from '../setup.js';

// ── Task 1.7: reference-grill.md ──

describe('sdd-quick reference-grill.md', () => {
  const refPath = resolveRoot('skills', 'sdd-quick', 'reference-grill.md');

  test('file exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  test('contains source attribution (skills/productivity/grill-me)', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('skills/productivity/grill-me');
  });

  test('contains non-empty core content', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    // 排除来源标注行后仍有实质内容
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(3);
  });
});

// ── Task 1.8: reference-tdd-compact.md ──

describe('sdd-quick reference-tdd-compact.md', () => {
  const refPath = resolveRoot('skills', 'sdd-quick', 'reference-tdd-compact.md');

  test('file exists', () => {
    expect(fs.existsSync(refPath)).toBe(true);
  });

  test('contains source attribution (skills/engineering/tdd)', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('skills/engineering/tdd');
  });

  test('contains TDD core workflow content (RED/GREEN)', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('RED');
    expect(content).toContain('GREEN');
  });

  test('contains vertical slice pattern', () => {
    const content = fs.readFileSync(refPath, 'utf-8');
    expect(content).toContain('垂直切片');
  });
});
