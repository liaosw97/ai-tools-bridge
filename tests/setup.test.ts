import { describe, test, expect } from 'vitest';
import {
  resolveRoot,
  parseSkillFrontmatter,
  loadSchema,
  getSkillDirs,
  getTemplateFiles,
} from './setup.js';
import path from 'node:path';
import fs from 'node:fs';

describe('resolveRoot', () => {
  test('returns path ending with ai-tools-bridge', () => {
    const root = resolveRoot();
    expect(path.basename(root)).toBe('ai-tools-bridge');
  });

  test('resolveRoot("skills") resolves to existing skills/ directory', () => {
    const skillsPath = resolveRoot('skills');
    expect(fs.existsSync(skillsPath)).toBe(true);
    expect(fs.statSync(skillsPath).isDirectory()).toBe(true);
  });
});

describe('parseSkillFrontmatter', () => {
  test('extracts name and description from sdd-doctor SKILL.md', () => {
    const skillPath = resolveRoot('skills', 'sdd-doctor', 'SKILL.md');
    const result = parseSkillFrontmatter(skillPath);
    expect(result.frontmatter.name).toBe('sdd-doctor');
    expect(result.frontmatter.description).toContain('环境诊断');
  });

  test('returns body after frontmatter', () => {
    const skillPath = resolveRoot('skills', 'sdd-doctor', 'SKILL.md');
    const result = parseSkillFrontmatter(skillPath);
    expect(result.body).toContain('# sdd-doctor');
    // body 不以 --- 开头（frontmatter 已被剥离）
    expect(result.body.startsWith('---')).toBe(false);
  });
});

describe('loadSchema', () => {
  test('returns artifacts with all 7 artifact types', () => {
    const schema = loadSchema();
    const artifactNames = Object.keys(schema.artifacts);
    expect(artifactNames).toContain('brainstorm');
    expect(artifactNames).toContain('proposal');
    expect(artifactNames).toContain('spec');
    expect(artifactNames).toContain('design');
    expect(artifactNames).toContain('tasks');
    expect(artifactNames).toContain('plan');
    expect(artifactNames).toContain('review');
  });

  test('returns dependency_chain with chain array', () => {
    const schema = loadSchema();
    expect(Array.isArray(schema.dependency_chain.chain)).toBe(true);
    expect(schema.dependency_chain.chain.length).toBeGreaterThan(0);
  });
});

describe('getSkillDirs', () => {
  test('returns 12 directories matching sdd-*', () => {
    const dirs = getSkillDirs();
    expect(dirs).toHaveLength(12);
    dirs.forEach((dir) => {
      expect(path.basename(dir)).toMatch(/^sdd-/);
    });
  });
});

describe('getTemplateFiles', () => {
  test('returns .md files in schemas/sdd/templates/', () => {
    const files = getTemplateFiles();
    expect(files.length).toBeGreaterThan(0);
    files.forEach((file) => {
      expect(file).toMatch(/\.md$/);
    });
  });
});
