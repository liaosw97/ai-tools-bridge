import { describe, test, expect } from 'vitest';
import path from 'node:path';
import { loadSchema, getTemplateFiles } from '../setup.js';

describe('template files match schema artifacts', () => {
  const schema = loadSchema();
  const templateFiles = getTemplateFiles();
  const templateNames = new Set(templateFiles.map((f) => path.basename(f, '.md')));

  test('each schema artifact has a corresponding template file', () => {
    for (const [key, _artifact] of Object.entries(schema.artifacts)) {
      // 模板文件名 = artifact key + .md（如 brainstorm.md 对应 brainstorm artifact）
      expect(templateNames.has(key), `Missing template for artifact "${key}"`).toBe(true);
    }
  });

  test('no extra template files beyond schema artifacts', () => {
    const artifactKeys = new Set(Object.keys(schema.artifacts));
    for (const tplFile of templateFiles) {
      const key = path.basename(tplFile, '.md');
      expect(
        artifactKeys.has(key),
        `Extra template file not in schema: ${key}.md`,
      ).toBe(true);
    }
  });
});
