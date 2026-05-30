import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const fixturesDir = join(import.meta.dirname, '../fixtures/precision');

describe('precision test fixtures', () => {
  describe('simple-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'simple-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have specs with 2 scenarios', () => {
      const specPath = join(fixturesDir, 'simple-change/specs/config-validation/spec.md');
      expect(existsSync(specPath)).toBe(true);

      const content = readFileSync(specPath, 'utf-8');
      const scenarioCount = (content.match(/####\s*Scenario:/g) || []).length;
      expect(scenarioCount).toBe(2);
    });

    it('should have tasks.md with 3 tasks', () => {
      const tasksPath = join(fixturesDir, 'simple-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBe(3);
    });
  });

  describe('medium-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'medium-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have specs with 4-6 scenarios', () => {
      const specDir = join(fixturesDir, 'medium-change/specs');
      expect(existsSync(specDir)).toBe(true);

      let totalScenarios = 0;
      const specFiles = ['user-auth/spec.md', 'session-mgmt/spec.md'];
      for (const specFile of specFiles) {
        const content = readFileSync(join(specDir, specFile), 'utf-8');
        totalScenarios += (content.match(/####\s*Scenario:/g) || []).length;
      }

      expect(totalScenarios).toBeGreaterThanOrEqual(4);
      expect(totalScenarios).toBeLessThanOrEqual(6);
    });

    it('should have tasks.md with 6-15 tasks', () => {
      const tasksPath = join(fixturesDir, 'medium-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBeGreaterThanOrEqual(6);
      expect(taskCount).toBeLessThanOrEqual(15);
    });
  });

  describe('complex-change', () => {
    it('should have proposal.md', () => {
      const path = join(fixturesDir, 'complex-change/proposal.md');
      expect(existsSync(path)).toBe(true);
    });

    it('should have specs with >8 scenarios', () => {
      const specDir = join(fixturesDir, 'complex-change/specs');
      expect(existsSync(specDir)).toBe(true);

      let totalScenarios = 0;
      const specFiles = ['order-processing/spec.md', 'payment/spec.md', 'inventory/spec.md', 'notification/spec.md'];
      for (const specFile of specFiles) {
        const content = readFileSync(join(specDir, specFile), 'utf-8');
        totalScenarios += (content.match(/####\s*Scenario:/g) || []).length;
      }

      expect(totalScenarios).toBeGreaterThan(8);
    });

    it('should have tasks.md with >15 tasks', () => {
      const tasksPath = join(fixturesDir, 'complex-change/tasks.md');
      expect(existsSync(tasksPath)).toBe(true);

      const content = readFileSync(tasksPath, 'utf-8');
      const taskCount = (content.match(/-\s*\[[ x]\]/g) || []).length;
      expect(taskCount).toBeGreaterThan(15);
    });
  });
});
