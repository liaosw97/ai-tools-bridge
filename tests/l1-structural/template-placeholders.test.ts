import { describe, test, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { loadSchema, getTemplateFiles } from '../setup.js';

describe('template placeholders cover content constraints', () => {
  const schema = loadSchema();

  test('each required content_constraint field appears in corresponding template', () => {
    const templateFiles = getTemplateFiles();
    const templateMap = new Map<string, string>();
    for (const f of templateFiles) {
      // 文件名去掉 .md 后缀作为 key
      const key = path.basename(f, '.md');
      templateMap.set(key, fs.readFileSync(f, 'utf-8'));
    }

    for (const [artifactKey, artifact] of Object.entries(schema.artifacts)) {
      const template = templateMap.get(artifactKey);
      if (!template) continue; // 缺少模板的情况已在 template-files.test.ts 中覆盖

      const requiredConstraints = artifact.content_constraints.filter(
        (c) => c.required === true,
      );

      for (const constraint of requiredConstraints) {
        const field = constraint.field;
        // 提取基础名称（field 可能含括号说明如 "场景 (GIVEN/WHEN/THEN)"）
        const baseName = field.replace(/\s*\(.*?\)\s*/, '').trim();
        // 提取模板中所有 ## 级别标题
        const headings = [...template.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
        // 匹配策略：
        // 1. 精确标题匹配（完整 field 或基础名称）
        const exactHeading = headings.some(h => h === field || h === baseName);
        // 2. 标题与 field 有部分重叠（"任务列表" 包含 "任务"，或 "批次" 包含在 "批次一/二" 中）
        const partialHeading = headings.some(h => {
          // 取标题和 field 的公共前缀（中文按字符比较）
          for (let i = Math.min(h.length, baseName.length); i >= 1; i--) {
            if (h.slice(0, i) === baseName.slice(0, i) && i >= 2) return true;
          }
          return false;
        });
        // 3. 描述中的关键 token 出现在模板中（覆盖 "Delta 标记" → ADDED/MODIFIED/REMOVED）
        const descTokens = (constraint.description || '')
          .split(/[\/,、:\[\]#\(\)\s→]/)
          .map(t => t.trim())
          .filter(t => t.length >= 2);
        // 4. baseName 拆分为 token 后出现在模板正文中（覆盖 "TDD 步骤" → TDD + 步骤）
        const baseTokens = baseName.split(/\s+/).filter(t => t.length >= 2);
        // 5. 描述中的子串拆分（按常见中文分隔符）
        const descParts = (constraint.description || '')
          .split(/的|每个|具体|格式|为|：|:|\/,、→/)
          .map(t => t.trim())
          .filter(t => t.length >= 2);
        const hasTokens = [...descTokens, ...baseTokens, ...descParts].some(t => template.includes(t));
        expect(
          exactHeading || partialHeading || hasTokens,
          `Artifact "${artifactKey}" missing required field "${field}" in template (headings: ${headings.join(', ')})`,
        ).toBe(true);
      }
    }
  });
});
