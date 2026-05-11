import { describe, test, expect } from 'vitest';
import { loadSchema } from '../setup.js';

describe('schema.yaml validity', () => {
  test('schema.yaml is valid YAML', () => {
    // loadSchema 成功返回即为合法 YAML
    const schema = loadSchema();
    expect(schema).toBeDefined();
  });

  test('schema.yaml contains artifacts key', () => {
    const schema = loadSchema();
    expect(schema.artifacts).toBeDefined();
    expect(typeof schema.artifacts).toBe('object');
  });

  test('schema.yaml contains dependency_chain with chain array', () => {
    const schema = loadSchema();
    expect(schema.dependency_chain).toBeDefined();
    expect(Array.isArray(schema.dependency_chain.chain)).toBe(true);
  });

  test('artifacts has 7 entries', () => {
    const schema = loadSchema();
    expect(Object.keys(schema.artifacts)).toHaveLength(7);
  });
});
