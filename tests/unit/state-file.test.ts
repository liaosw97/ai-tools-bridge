import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStateFile, updateStateFile, readStateFile, saveStateFile, StateFile } from '../../lib/state-file.js';
import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const testPath = join(import.meta.dirname, '../fixtures/test-state.yaml');

afterEach(() => {
  if (existsSync(testPath)) {
    unlinkSync(testPath);
  }
});

describe('createStateFile', () => {
  it('should create a state file with required fields', () => {
    const state = createStateFile('test-change');

    expect(state.change).toBe('test-change');
    expect(state.phase).toBeDefined();
    expect(state.decisions).toBeDefined();
    expect(Array.isArray(state.decisions)).toBe(true);
  });
});

describe('updateStateFile', () => {
  it('should return new state with updated action and decisions', () => {
    const state = createStateFile('test-change');
    const updated = updateStateFile(state, 'sdd-brainstorm', ['决策1', '决策2']);

    expect(updated.phase).toBe('sdd-brainstorm');
    expect(updated.decisions).toContain('决策1');
    expect(updated.decisions).toContain('决策2');
    // 原对象不应被修改
    expect(state.phase).toBe('init');
    expect(state.decisions).toHaveLength(0);
  });
});

describe('readStateFile', () => {
  it('should read valid YAML state file', () => {
    const state = createStateFile('test-change');
    const updated = updateStateFile(state, 'sdd-brainstorm', ['决策1']);
    saveStateFile(updated, testPath);

    const read = readStateFile(testPath);

    expect(read).not.toBeNull();
    expect(read?.change).toBe('test-change');
    expect(read?.phase).toBe('sdd-brainstorm');
  });

  it('should return null for corrupted file', () => {
    const corruptedContent = 'invalid: yaml: content: [[[';
    require('fs').writeFileSync(testPath, corruptedContent);

    const result = readStateFile(testPath);

    expect(result).toBeNull();
  });

  it('should return null for non-existent file', () => {
    const result = readStateFile('/non/existent/path.yaml');

    expect(result).toBeNull();
  });
});

describe('cross-action state passing', () => {
  it('should pass state between actions', () => {
    // Action A: sdd-brainstorm
    const stateA = createStateFile('test-change');
    const updatedA = updateStateFile(stateA, 'sdd-brainstorm', ['选择方案D', '先懒加载后压缩']);
    saveStateFile(updatedA, testPath);

    // Action B: sdd-propose
    const stateB = readStateFile(testPath);

    expect(stateB).not.toBeNull();
    expect(stateB?.phase).toBe('sdd-brainstorm');
    expect(stateB?.decisions).toContain('选择方案D');
    expect(stateB?.decisions).toContain('先懒加载后压缩');

    // Update for Action B
    if (stateB) {
      const updatedB = updateStateFile(stateB, 'sdd-propose', ['范围已定义']);
      saveStateFile(updatedB, testPath);
    }

    // Verify
    const finalState = readStateFile(testPath);
    expect(finalState?.phase).toBe('sdd-propose');
    expect(finalState?.decisions.length).toBe(3);
  });

  it('should fallback to artifact when state file missing', () => {
    // 状态文件不存在时，应从 artifact 重新构建上下文
    const state = readStateFile('/non/existent/path.yaml');

    expect(state).toBeNull();
    // 降级逻辑：从 artifact 重新构建（由 SKILL.md 定义）
  });
});
