import { describe, test, expect } from 'vitest';
import { loadSchema } from '../setup.js';

describe('dependency chain', () => {
  const schema = loadSchema();

  test('every item in dependency_chain.chain exists in artifacts', () => {
    const artifactKeys = new Set(Object.keys(schema.artifacts));
    for (const item of schema.dependency_chain.chain) {
      // chain 中可能有注释如 "(可选)"，提取纯名称
      const name = item.replace(/\s*\(.*?\)\s*/, '').trim();
      expect(
        artifactKeys.has(name),
        `Chain item "${name}" not found in artifacts`,
      ).toBe(true);
    }
  });

  test('every required artifact appears in chain', () => {
    const chainText = schema.dependency_chain.chain.join(' ');
    for (const [key, artifact] of Object.entries(schema.artifacts)) {
      if (artifact.required) {
        expect(
          chainText.includes(key),
          `Required artifact "${key}" not in dependency chain`,
        ).toBe(true);
      }
    }
  });

  test('every artifact dependency references a defined artifact', () => {
    const artifactKeys = new Set(Object.keys(schema.artifacts));
    for (const [key, artifact] of Object.entries(schema.artifacts)) {
      for (const dep of artifact.dependencies) {
        expect(
          artifactKeys.has(dep),
          `Artifact "${key}" depends on "${dep}" which is not defined`,
        ).toBe(true);
      }
    }
  });

  test('dependency graph has no cycles', () => {
    const artifacts = schema.artifacts;
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color: Record<string, number> = {};
    for (const key of Object.keys(artifacts)) {
      color[key] = WHITE;
    }

    function dfs(node: string): boolean {
      color[node] = GRAY;
      for (const dep of artifacts[node].dependencies) {
        if (color[dep] === GRAY) return true; // 发现环
        if (color[dep] === WHITE && dfs(dep)) return true;
      }
      color[node] = BLACK;
      return false;
    }

    for (const key of Object.keys(artifacts)) {
      if (color[key] === WHITE) {
        expect(dfs(key), `Cycle detected involving "${key}"`).toBe(false);
      }
    }
  });
});
