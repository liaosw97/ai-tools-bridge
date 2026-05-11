import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

// —— 类型定义 ——

export interface ParsedSkill {
  dirName: string;
  frontmatter: {
    name: string;
    description: string;
  };
  body: string;
}

export interface SchemaArtifact {
  description: string;
  required: boolean;
  dependencies: string[];
  file: string;
  content_constraints: {
    field: string;
    required: boolean;
    description: string;
    condition?: string;
  }[];
}

export interface SchemaDef {
  artifacts: Record<string, SchemaArtifact>;
  dependency_chain: {
    description: string;
    chain: string[];
    notes: string[];
  };
}

// —— resolveRoot ——

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _cachedRoot: string | null = null;

/**
 * 定位 ai-tools-bridge 项目根目录。
 * 向上查找直到找到同时含 skills/ 和 schemas/ 子目录的目录。
 */
export function resolveRoot(...segments: string[]): string {
  if (!_cachedRoot) {
    let dir = __dirname;
    for (let i = 0; i < 10; i++) {
      const hasSkills = fs.existsSync(path.join(dir, 'skills'));
      const hasSchemas = fs.existsSync(path.join(dir, 'schemas'));
      if (hasSkills && hasSchemas) {
        _cachedRoot = dir;
        break;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (!_cachedRoot) {
      throw new Error('Could not find ai-tools-bridge project root');
    }
  }
  return path.resolve(_cachedRoot, ...segments);
}

// —— parseSkillFrontmatter ——

/**
 * 解析 SKILL.md 的 YAML frontmatter。
 * 提取 `---` 分隔的头部并用 yaml 库解析。
 */
export function parseSkillFrontmatter(filePath: string): ParsedSkill {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`No YAML frontmatter found in ${filePath}`);
  }
  const frontmatter = YAML.parse(match[1]) as { name: string; description: string };
  const body = content.slice(match[0].length).trimStart();
  const dirName = path.basename(path.dirname(filePath));
  return { dirName, frontmatter, body };
}

// —— loadSchema ——

let _cachedSchema: SchemaDef | null = null;

/**
 * 加载并缓存 schemas/sdd/schema.yaml。
 */
export function loadSchema(): SchemaDef {
  if (!_cachedSchema) {
    const schemaPath = resolveRoot('schemas', 'sdd', 'schema.yaml');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    _cachedSchema = YAML.parse(content) as SchemaDef;
  }
  return _cachedSchema;
}

// —— getSkillDirs ——

/**
 * 返回 skills/ 下所有 sdd-* 子目录的完整路径。
 */
export function getSkillDirs(): string[] {
  const skillsDir = resolveRoot('skills');
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith('sdd-'))
    .map((e) => path.join(skillsDir, e.name))
    .sort();
}

// —— getTemplateFiles ——

/**
 * 返回 schemas/sdd/templates/ 下所有 .md 文件的完整路径。
 */
export function getTemplateFiles(): string[] {
  const templatesDir = resolveRoot('schemas', 'sdd', 'templates');
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(templatesDir, e.name))
    .sort();
}
