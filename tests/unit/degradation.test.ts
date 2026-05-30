import { describe, it, expect } from 'vitest';
import { summarizeSpec, calculateCoverage } from '../../lib/summarizer.js';
import { readStateFile } from '../../lib/state-file.js';

describe('module loading degradation', () => {
  it('should handle empty spec content gracefully', () => {
    const result = summarizeSpec('');

    expect(result.scenarios).toEqual([]);
    expect(result.triples).toEqual([]);
    expect(result.tasks).toEqual([]);
  });

  it('should handle malformed spec content', () => {
    const malformedContent = `
## Some Section
No scenarios here
Just random text
`;

    const result = summarizeSpec(malformedContent);

    expect(result.scenarios).toEqual([]);
    expect(result.triples).toEqual([]);
  });

  it('should handle state file read failure gracefully', () => {
    const result = readStateFile('/non/existent/path.yaml');

    expect(result).toBeNull();
  });
});

describe('summary information loss degradation', () => {
  it('should detect low coverage and indicate degradation needed', () => {
    const original = 'field1 field2 field3 field4 field5 field6 field7 field8 field9 field10';
    const summary = 'field1 field2';

    const coverage = calculateCoverage(original, summary);

    // 覆盖率 < 95%，应触发降级
    expect(coverage).toBeLessThan(95);
  });

  it('should detect high coverage and indicate no degradation needed', () => {
    const original = 'field1 field2 field3 field4 field5';
    const summary = 'field1 field2 field3 field4 field5';

    const coverage = calculateCoverage(original, summary);

    // 覆盖率 >= 95%，无需降级
    expect(coverage).toBeGreaterThanOrEqual(95);
  });

  it('should handle empty original in coverage calculation', () => {
    const coverage = calculateCoverage('', 'summary');

    expect(coverage).toBe(100);
  });

  it('should handle empty summary in coverage calculation', () => {
    const original = 'field1 field2 field3';
    const coverage = calculateCoverage(original, '');

    expect(coverage).toBe(0);
  });
});
