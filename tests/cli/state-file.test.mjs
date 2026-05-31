import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createTempDir, cleanupTempDir } from './helpers.mjs';

const script = resolve('scripts/state-file.mjs');

describe('state-file.mjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  it('创建状态文件', () => {
    execFileSync('node', [script, 'create', tmpDir, '--phase', 'brainstorm'], { encoding: 'utf-8' });
    const stateFile = resolve(tmpDir, 'state.yaml');
    expect(existsSync(stateFile)).toBe(true);
    const content = readFileSync(stateFile, 'utf-8');
    expect(content).toContain('phase: brainstorm');
  });

  it('读取状态文件', () => {
    execFileSync('node', [script, 'create', tmpDir, '--phase', 'brainstorm'], { encoding: 'utf-8' });
    const stdout = execFileSync('node', [script, 'read', tmpDir], { encoding: 'utf-8' });
    expect(stdout).toContain('phase: brainstorm');
  });

  it('更新状态文件', () => {
    execFileSync('node', [script, 'create', tmpDir, '--phase', 'brainstorm'], { encoding: 'utf-8' });
    execFileSync('node', [script, 'update', tmpDir, '--phase', 'propose'], { encoding: 'utf-8' });
    const stdout = execFileSync('node', [script, 'read', tmpDir], { encoding: 'utf-8' });
    expect(stdout).toContain('phase: propose');
  });

  it('状态文件不存在时读取输出错误', () => {
    try {
      execFileSync('node', [script, 'read', tmpDir], { encoding: 'utf-8' });
      expect.fail('应抛出异常');
    } catch (err) {
      expect(err.status).not.toBe(0);
      expect(err.stderr).toBeTruthy();
    }
  });
});
