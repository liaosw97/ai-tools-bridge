import { describe, test, expect, beforeAll } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';
import fs from 'node:fs';

function getBody(skillDir: string): string {
  const skillPath = resolveRoot('skills', skillDir, 'SKILL.md');
  return parseSkillFrontmatter(skillPath).body;
}

// ── Task 6.1: sdd-brainstorm 后置推荐（★/sdd-propose, ○/sdd-ff, △/sdd-quick） ──

describe('sdd-brainstorm: post-recommendation', () => {
  test('contains ★ /sdd-propose recommendation', () => {
    const body = getBody('sdd-brainstorm');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-propose');
  });

  test('contains ○ /sdd-ff recommendation', () => {
    const body = getBody('sdd-brainstorm');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-ff');
  });

  test('contains △ /sdd-quick recommendation', () => {
    const body = getBody('sdd-brainstorm');
    expect(body).toContain('△');
    expect(body).toContain('/sdd-quick');
  });
});

// ── Task 6.2: sdd-propose 后置推荐（★/sdd-ff, ○/sdd-plan, △/sdd-brainstorm） ──

describe('sdd-propose: post-recommendation', () => {
  test('contains ★ /sdd-ff recommendation', () => {
    const body = getBody('sdd-propose');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-ff');
  });

  test('contains ○ /sdd-plan recommendation', () => {
    const body = getBody('sdd-propose');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-plan');
  });

  test('contains △ /sdd-brainstorm recommendation', () => {
    const body = getBody('sdd-propose');
    expect(body).toContain('△');
    expect(body).toContain('/sdd-brainstorm');
  });
});

// ── Task 6.3: sdd-ff 后置推荐（★按复杂度, ○/sdd-review-spec, △/sdd-quick） ──

describe('sdd-ff: post-recommendation', () => {
  test('contains complexity-based dynamic recommendation', () => {
    const body = getBody('sdd-ff');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-code');
    expect(body).toContain('/sdd-plan');
  });

  test('contains ○ /sdd-review-spec recommendation', () => {
    const body = getBody('sdd-ff');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-review-spec');
  });

  test('contains △ /sdd-quick recommendation', () => {
    const body = getBody('sdd-ff');
    expect(body).toContain('△');
    expect(body).toContain('/sdd-quick');
  });
});

// ── Task 6.4: sdd-code 后置推荐（★按复杂度, ○/sdd-verify） ──

describe('sdd-code: post-recommendation', () => {
  test('contains complexity-based dynamic recommendation', () => {
    const body = getBody('sdd-code');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-review-code');
    expect(body).toContain('/sdd-ship');
  });

  test('contains ○ /sdd-verify recommendation', () => {
    const body = getBody('sdd-code');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-verify');
  });
});

// ── Task 6.5: sdd-review-code 后置推荐（★/sdd-test-code, ○/sdd-code, △/sdd-ship） ──

describe('sdd-review-code: post-recommendation', () => {
  test('contains ★ /sdd-test-code recommendation', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-test-code');
  });

  test('contains ○ /sdd-code recommendation', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-code');
  });

  test('contains △ /sdd-ship recommendation', () => {
    const body = getBody('sdd-review-code');
    expect(body).toContain('△');
    expect(body).toContain('/sdd-ship');
  });
});

// ── Task 6.6: sdd-review-spec 后置推荐（★/sdd-propose, ○/sdd-ff） ──

describe('sdd-review-spec: post-recommendation', () => {
  test('contains ★ /sdd-propose recommendation', () => {
    const body = getBody('sdd-review-spec');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-propose');
  });

  test('contains ○ /sdd-ff recommendation', () => {
    const body = getBody('sdd-review-spec');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-ff');
  });
});

// ── Task 6.7: sdd-verify 后置推荐（★/sdd-ship, ○/sdd-code） ──

describe('sdd-verify: post-recommendation', () => {
  test('contains ★ /sdd-ship recommendation', () => {
    const body = getBody('sdd-verify');
    expect(body).toContain('★');
    expect(body).toContain('/sdd-ship');
  });

  test('contains ○ /sdd-code recommendation', () => {
    const body = getBody('sdd-verify');
    expect(body).toContain('○');
    expect(body).toContain('/sdd-code');
  });
});

// ── Task 6.8: sdd-ship 后置（变更已完成，无后续操作） ──

describe('sdd-ship: post-recommendation', () => {
  test('contains completion message with no follow-up actions', () => {
    const body = getBody('sdd-ship');
    expect(body).toContain('变更已完成');
    expect(body).toContain('无后续操作');
  });
});

// ── Task 6.9: sdd-continue 后置推荐（按进度动态推荐） ──

describe('sdd-continue: post-recommendation', () => {
  test('contains dynamic recommendation based on progress', () => {
    const body = getBody('sdd-continue');
    expect(body).toContain('★');
    expect(body).toContain('当前进度');
  });
});

// ── Task 7.3: README 增加内联引用标注表 ──

describe('README: inline reference table', () => {
  const readmePath = resolveRoot('README.md');
  let readme: string;
  beforeAll(() => {
    readme = fs.readFileSync(readmePath, 'utf-8');
  });

  test('contains inline reference section', () => {
    expect(readme).toContain('内联引用');
  });

  test('contains 4 reference file sources', () => {
    expect(readme).toContain('reference-grill');
    expect(readme).toContain('reference-tdd-compact');
    expect(readme).toContain('reference-tdd-tests');
    expect(readme).toContain('reference-tdd-mocking');
  });
});

// ── Task 7.4: README 增加路径推荐说明 ──

describe('README: path recommendation table', () => {
  const readmePath = resolveRoot('README.md');
  let readme: string;
  beforeAll(() => {
    readme = fs.readFileSync(readmePath, 'utf-8');
  });

  test('contains S/M/L path recommendation table', () => {
    expect(readme).toContain('简单');
    expect(readme).toContain('中等');
    expect(readme).toContain('复杂');
    expect(readme).toContain('/sdd-quick');
  });
});

// ── Task 7.5: README 更新 action 列表和版本号 ──

describe('README: action list and version', () => {
  const readmePath = resolveRoot('README.md');
  let readme: string;
  beforeAll(() => {
    readme = fs.readFileSync(readmePath, 'utf-8');
  });

  test('action list contains sdd-quick and sdd-test-code', () => {
    expect(readme).toContain('sdd-quick');
    expect(readme).toContain('sdd-test-code');
  });

  test('contains 13 actions count', () => {
    expect(readme).toContain('13');
  });

  test('contains version v0.3.0', () => {
    expect(readme).toContain('v0.3.0');
  });
});
