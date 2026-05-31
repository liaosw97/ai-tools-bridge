import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { createTempDir, writeTempFile, cleanupTempDir } from './helpers.mjs';

const script = resolve('scripts/summarize-spec.mjs');

describe('summarize-spec.mjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  it('提取 spec 场景列表', () => {
    const spec = `# Spec: Test

### 场景: 正常登录 [ADDED]

\`\`\`
GIVEN 用户已注册
WHEN 输入正确密码
THEN 登录成功
\`\`\`

### 场景: 密码错误 [ADDED]

\`\`\`
GIVEN 用户已注册
WHEN 输入错误密码
THEN 登录失败
\`\`\`
`;
    const file = writeTempFile(tmpDir, 'spec.md', spec);
    const stdout = execFileSync('node', [script, file], { encoding: 'utf-8' });
    expect(stdout).toContain('场景: 正常登录');
    expect(stdout).toContain('场景: 密码错误');
    expect(stdout).toContain('GIVEN');
    expect(stdout).toContain('WHEN');
    expect(stdout).toContain('THEN');
  });

  it('spec 文件不存在时输出错误', () => {
    try {
      execFileSync('node', [script, '/nonexistent/path'], { encoding: 'utf-8' });
      expect.fail('应抛出异常');
    } catch (err) {
      expect(err.status).not.toBe(0);
      expect(err.stderr).toBeTruthy();
    }
  });

  it('spec 无场景时输出提示', () => {
    const spec = `# Spec: Empty

无场景内容。
`;
    const file = writeTempFile(tmpDir, 'empty.md', spec);
    const stdout = execFileSync('node', [script, file], { encoding: 'utf-8' });
    expect(stdout).toContain('无场景');
  });
});
