import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { createTempDir, writeTempFile, cleanupTempDir } from './helpers.mjs';

const script = resolve('scripts/compress-review.mjs');

describe('compress-review.mjs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  it('压缩 review 上下文', () => {
    const diff = `diff --git a/src/auth.js b/src/auth.js
--- a/src/auth.js
+++ b/src/auth.js
@@ -1,3 +1,4 @@
+function login() {}
 function logout() {}
`;
    const spec = `### 场景: 用户登录 [ADDED]

GIVEN 用户已注册
WHEN 调用 login()
THEN 登录成功
`;
    const diffFile = writeTempFile(tmpDir, 'test.diff', diff);
    const specFile = writeTempFile(tmpDir, 'spec.md', spec);
    const stdout = execFileSync('node', [script, diffFile, specFile], { encoding: 'utf-8' });
    expect(stdout).toContain('变更文件:');
    expect(stdout).toContain('匹配场景:');
  });

  it('spec 文件不存在时输出错误', () => {
    const diff = `diff --git a/test.js b/test.js\n+var a = 1;\n`;
    const diffFile = writeTempFile(tmpDir, 'test.diff', diff);
    try {
      execFileSync('node', [script, diffFile, '/nonexistent/spec'], { encoding: 'utf-8' });
      expect.fail('应抛出异常');
    } catch (err) {
      expect(err.status).not.toBe(0);
      expect(err.stderr).toBeTruthy();
    }
  });

  it('diff 文件为空时输出无变更', () => {
    const spec = `### 场景: 测试 [ADDED]\nGIVEN x\nWHEN y\nTHEN z\n`;
    const diffFile = writeTempFile(tmpDir, 'empty.diff', '');
    const specFile = writeTempFile(tmpDir, 'spec.md', spec);
    const stdout = execFileSync('node', [script, diffFile, specFile], { encoding: 'utf-8' });
    expect(stdout).toContain('无变更');
  });

  it('spec 无场景时输出无匹配场景', () => {
    const diff = `diff --git a/test.js b/test.js\n+var a = 1;\n`;
    const spec = `# Spec: Empty\n无场景内容。\n`;
    const diffFile = writeTempFile(tmpDir, 'test.diff', diff);
    const specFile = writeTempFile(tmpDir, 'spec.md', spec);
    const stdout = execFileSync('node', [script, diffFile, specFile], { encoding: 'utf-8' });
    expect(stdout).toContain('无匹配场景');
  });

  it('相似场景名不会误匹配', () => {
    const diff = `diff --git a/src/verify.js b/src/verify.js
+function verify() {}
`;
    const spec = `### 场景: 验证用户邮箱 [ADDED]

GIVEN 用户已注册
WHEN 调用 verify()
THEN 验证成功

### 场景: 验证用户手机 [ADDED]

GIVEN 用户已注册
WHEN 调用 verifyPhone()
THEN 验证成功
`;
    const diffFile = writeTempFile(tmpDir, 'test.diff', diff);
    const specFile = writeTempFile(tmpDir, 'spec.md', spec);
    const stdout = execFileSync('node', [script, diffFile, specFile], { encoding: 'utf-8' });
    // verify.js 与"验证用户邮箱"相关（verify 文件名匹配）
    expect(stdout).toContain('验证用户邮箱');
    // "验证用户手机"不应匹配（verifyPhone 未在 diff 中出现）
    expect(stdout).not.toContain('验证用户手机');
  });
});
