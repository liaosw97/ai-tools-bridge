import { describe, it, expect } from 'vitest';
import { compressReviewContext, ReviewContext } from '../../lib/review-context.js';

describe('compressReviewContext', () => {
  it('should return JSON with required fields', () => {
    const diff = `
diff --git a/src/auth.ts b/src/auth.ts
+function login(user: string, pass: string) {
+  return authenticate(user, pass);
+}
`;
    const specScenarios = [
      'spec:auth#login: GIVEN user exists WHEN login THEN return token',
      'spec:auth#logout: GIVEN user logged in WHEN logout THEN clear session',
    ];

    const result = compressReviewContext(diff, specScenarios);

    expect(result).toHaveProperty('code-changes');
    expect(result).toHaveProperty('spec-context');
    expect(result).toHaveProperty('quality-metrics');
  });

  it('should include diff in code-changes', () => {
    const diff = 'diff --git a/src/auth.ts b/src/auth.ts\n+function login() {}';
    const specScenarios: string[] = [];

    const result = compressReviewContext(diff, specScenarios);

    expect(result['code-changes']).toContain('login');
  });

  it('should include relevant spec scenarios', () => {
    const diff = 'diff --git a/src/auth.ts b/src/auth.ts\n+function login() {}';
    const specScenarios = [
      'spec:auth#login: GIVEN user exists WHEN login THEN return token',
      'spec:auth#logout: GIVEN user logged in WHEN logout THEN clear session',
      'spec:user#list: GIVEN admin WHEN list users THEN return all',
    ];

    const result = compressReviewContext(diff, specScenarios);

    expect(result['spec-context']).toContain('login');
  });

  it('should have quality-metrics object', () => {
    const diff = 'diff --git a/src/auth.ts b/src/auth.ts\n+function login() {}';
    const specScenarios = ['spec:auth#login: GIVEN user exists WHEN login THEN return token'];

    const result = compressReviewContext(diff, specScenarios);

    expect(result['quality-metrics']).toHaveProperty('testCoverage');
    expect(result['quality-metrics']).toHaveProperty('scenarioPassRate');
    expect(result['quality-metrics']).toHaveProperty('totalScenarios');
  });

  it('should extract keywords from multi-file diff', () => {
    const diff = `diff --git a/src/auth.ts b/src/auth.ts
+function login() {}
diff --git a/src/user.ts b/src/user.ts
+function getUser() {}
diff --git a/src/admin.ts b/src/admin.ts
+class AdminPanel {}`;
    const specScenarios = [
      'spec:auth#login: GIVEN user WHEN login THEN token',
      'spec:user#list: GIVEN admin WHEN list THEN users',
      'spec:admin#panel: GIVEN admin WHEN open THEN panel',
    ];

    const result = compressReviewContext(diff, specScenarios);

    // 文件名 keywords (src/auth.ts 等) 不直接匹配 spec 文本
    // 但函数名/类名 keywords (login, getUser, AdminPanel) 应匹配
    expect(result['spec-context']).toContain('login');
  });

  it('should have null scenarioPassRate by default', () => {
    const diff = 'diff --git a/src/auth.ts b/src/auth.ts\n+function login() {}';
    const specScenarios: string[] = [];

    const result = compressReviewContext(diff, specScenarios);

    expect(result['quality-metrics'].scenarioPassRate).toBeNull();
  });
});
