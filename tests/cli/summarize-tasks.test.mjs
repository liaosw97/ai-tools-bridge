import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { createTempDir, writeTempFile, cleanupTempDir } from './helpers.mjs';

const script = resolve('scripts/summarize-tasks.mjs');

describe('summarize-tasks.mjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  it('提取任务摘要', () => {
    const tasks = `# Tasks

- [x] 1.1 任务A [spec:cli-scripts#场景1]
- [x] 1.2 任务B [spec:cli-scripts#场景2]
- [x] 1.3 任务C
- [ ] 1.4 任务D [spec:cli-scripts#场景3]
- [ ] 1.5 任务E
`;
    const file = writeTempFile(tmpDir, 'tasks.md', tasks);
    const stdout = execFileSync('node', [script, file], { encoding: 'utf-8' });
    expect(stdout).toContain('总数: 5');
    expect(stdout).toContain('已完成: 3');
    expect(stdout).toContain('待完成: 2');
  });

  it('tasks 文件不存在时输出错误', () => {
    try {
      execFileSync('node', [script, '/nonexistent/path'], { encoding: 'utf-8' });
      expect.fail('应抛出异常');
    } catch (err) {
      expect(err.status).not.toBe(0);
      expect(err.stderr).toBeTruthy();
    }
  });

  it('tasks 文件无 checkbox 时输出总数 0', () => {
    const tasks = `# Tasks

无任务内容。
`;
    const file = writeTempFile(tmpDir, 'empty.md', tasks);
    const stdout = execFileSync('node', [script, file], { encoding: 'utf-8' });
    expect(stdout).toContain('总数: 0');
  });

  it('tasks 文件为空时输出总数 0', () => {
    const file = writeTempFile(tmpDir, 'empty.md', '');
    const stdout = execFileSync('node', [script, file], { encoding: 'utf-8' });
    expect(stdout).toContain('总数: 0');
  });
});
