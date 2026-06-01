import { describe, it, expect } from 'vitest';
import { summarizeSpec, summarizeTasks, calculateCoverage, generateChangeList } from '../../lib/summarizer.js';

describe('summarizeSpec', () => {
  it('should extract scenario names from spec content', () => {
    const specContent = `
## ADDED Requirements

### Requirement: Artifact 摘要传递

系统 SHALL 使用摘要代替完整 artifact 内容传递给 subagent。

#### Scenario: spec 场景列表传递
- **GIVEN** spec 文件包含多个 GIVEN/WHEN/THEN 场景
- **WHEN** 传递 spec 给 subagent
- **THEN** 系统传递 spec 场景列表（场景名称 + 关键字段），而非完整 spec 文件

#### Scenario: task 摘要传递
- **GIVEN** tasks.md 包含多个任务项
- **WHEN** 传递 tasks 给 subagent
- **THEN** 系统传递 task 摘要（任务编号 + 描述 + spec 链接），而非完整 tasks.md

#### Scenario: 关键字段保留
- **GIVEN** artifact 包含关键字段
- **WHEN** 生成 artifact 摘要
- **THEN** 系统强制保留以下关键字段，关键信息覆盖率 ≥95%
`;

    const result = summarizeSpec(specContent);

    expect(result.scenarios).toContain('spec 场景列表传递');
    expect(result.scenarios).toContain('task 摘要传递');
    expect(result.scenarios).toContain('关键字段保留');
    expect(result.scenarios.length).toBe(3);
  });

  it('should extract GIVEN/WHEN/THEN triples', () => {
    const specContent = `
#### Scenario: spec 场景列表传递
- **GIVEN** spec 文件包含多个 GIVEN/WHEN/THEN 场景
- **WHEN** 传递 spec 给 subagent
- **THEN** 系统传递 spec 场景列表（场景名称 + 关键字段），而非完整 spec 文件
`;

    const result = summarizeSpec(specContent);

    expect(result.triples.length).toBe(1);
    expect(result.triples[0].given).toContain('spec 文件包含多个 GIVEN/WHEN/THEN 场景');
    expect(result.triples[0].when).toContain('传递 spec 给 subagent');
    expect(result.triples[0].then).toContain('系统传递 spec 场景列表');
  });
});

describe('summarizeTasks', () => {
  it('should extract task numbers and spec links', () => {
    const tasksContent = `
## 1. 懒加载实现

- [ ] 1.1 拆分 sdd-brainstorm（472行 → 3个模块：核心流程、角色系统、拆分模式）[spec:lazy-loading#skill-文件模块化拆分]
- [ ] 1.2 拆分 sdd-plan（285行 → 核心流程 + 分批模式）[spec:lazy-loading#skill-文件模块化拆分]
`;

    const result = summarizeTasks(tasksContent);

    expect(result.tasks.length).toBe(2);
    expect(result.tasks[0].number).toBe('1.1');
    expect(result.tasks[0].specLink).toContain('spec:lazy-loading#skill-文件模块化拆分');
    expect(result.tasks[1].number).toBe('1.2');
  });
});

describe('calculateCoverage', () => {
  it('should calculate coverage percentage', () => {
    const original = 'field1 field2 field3 field4 field5';
    const summary = 'field1 field2 field3';

    const coverage = calculateCoverage(original, summary);

    expect(coverage).toBe(60);
  });

  it('should return 100% for complete coverage', () => {
    const original = 'field1 field2 field3';
    const summary = 'field1 field2 field3';

    const coverage = calculateCoverage(original, summary);

    expect(coverage).toBe(100);
  });

  it('should filter stop words and short tokens', () => {
    const original = 'the login function is a core module';
    const summary = 'login function core module';

    const coverage = calculateCoverage(original, summary);

    // 'the', 'is', 'a' are stop words, remaining: login, function, core, module = 4 words, all covered
    expect(coverage).toBe(100);
  });

  it('should not produce false positives from single-char substring matching', () => {
    const original = 'authentication authorization';
    const summary = 'a';

    const coverage = calculateCoverage(original, summary);

    // 'a' is a stop word and too short, so summary has 0 keywords
    // original has 2 keywords, 0 covered = 0%
    expect(coverage).toBe(0);
  });

  it('should handle empty input', () => {
    expect(calculateCoverage('', '')).toBe(100);
    // 'a' and 'b' are stop words (< 2 chars), so originalFields is empty → 100%
    expect(calculateCoverage('a b', '')).toBe(100);
    // meaningful words with empty summary → 0%
    expect(calculateCoverage('authentication module', '')).toBe(0);
  });
});

describe('generateChangeList', () => {
  it('should extract ADDED files from diff', () => {
    const diff = `diff --git a/lib/new-module.ts b/lib/new-module.ts
new file mode 100644
--- /dev/null
+++ b/lib/new-module.ts
@@ -0,0 +1,5 @@
+export function hello() {}`;

    const result = generateChangeList(diff);

    expect(result.summary.added).toBe(1);
    expect(result.entries[0].type).toBe('ADDED');
    expect(result.entries[0].file).toBe('lib/new-module.ts');
    expect(result.entries[0].module).toBe('lib');
  });

  it('should extract MODIFIED files from diff', () => {
    const diff = `diff --git a/skills/sdd-brainstorm/SKILL.md b/skills/sdd-brainstorm/SKILL.md
--- a/skills/sdd-brainstorm/SKILL.md
+++ b/skills/sdd-brainstorm/SKILL.md
@@ -10,3 +10,3 @@
-old line
+new line`;

    const result = generateChangeList(diff);

    expect(result.summary.modified).toBe(1);
    expect(result.entries[0].type).toBe('MODIFIED');
    expect(result.entries[0].module).toBe('skills');
  });

  it('should extract REMOVED files with reason', () => {
    const diff = `diff --git a/old-file.ts b/old-file.ts
deleted file mode 100644
--- a/old-file.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function removed() {}`;

    const result = generateChangeList(diff);

    expect(result.summary.removed).toBe(1);
    expect(result.entries[0].type).toBe('REMOVED');
    expect(result.entries[0].reason).toBe('文件删除');
  });

  it('should group changes by module', () => {
    const diff = `diff --git a/lib/summarizer.ts b/lib/summarizer.ts
--- a/lib/summarizer.ts
+++ b/lib/summarizer.ts
@@ -1,1 +1,2 @@
+// new
diff --git a/tests/unit/summarizer.test.ts b/tests/unit/summarizer.test.ts
--- a/tests/unit/summarizer.test.ts
+++ b/tests/unit/summarizer.test.ts
@@ -1,1 +1,2 @@
+// new test
diff --git a/scripts/compress.mjs b/scripts/compress.mjs
new file mode 100644
--- /dev/null
+++ b/scripts/compress.mjs
@@ -0,0 +1,1 @@
+// new script`;

    const result = generateChangeList(diff);

    expect(result.byModule).toHaveProperty('lib');
    expect(result.byModule).toHaveProperty('tests');
    expect(result.byModule).toHaveProperty('scripts');
    expect(result.byModule['lib'].length).toBe(1);
    expect(result.byModule['tests'].length).toBe(1);
    expect(result.byModule['scripts'].length).toBe(1);
  });

  it('should detect renames', () => {
    const diff = `diff --git a/old-name.ts b/new-name.ts
similarity index 100%
rename from old-name.ts
rename to new-name.ts`;

    const result = generateChangeList(diff);

    expect(result.entries[0].type).toBe('MODIFIED');
    expect(result.entries[0].reason).toContain('重命名');
  });

  it('should handle empty diff', () => {
    const result = generateChangeList('');

    expect(result.summary.total).toBe(0);
    expect(result.entries).toHaveLength(0);
  });
});
