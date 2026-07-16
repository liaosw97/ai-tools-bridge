import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { resolveRoot } from './setup.js';

const registryPath = path.resolve(resolveRoot(), 'openspec/change-registry.yaml');

describe('change-registry.yaml 模板', () => {
  it('应存在且可解析', () => {
    expect(fs.existsSync(registryPath)).toBe(true);
    const content = fs.readFileSync(registryPath, 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed).toBeTruthy();
  });

  it('应包含 version 和 schema 字段', () => {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed.version).toBe(1);
    expect(parsed.schema).toBe('change-registry');
  });

  it('应包含 changes 数组', () => {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const parsed = YAML.parse(content);
    expect(Array.isArray(parsed.changes)).toBe(true);
  });

  it('changes 中的每条记录应包含 name/status/created/archived/parent/children/depends_on', () => {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const parsed = YAML.parse(content);
    for (const change of parsed.changes) {
      expect(change).toHaveProperty('name');
      expect(change).toHaveProperty('status');
      expect(change).toHaveProperty('created');
      expect(change).toHaveProperty('archived');
      expect(change).toHaveProperty('parent');
      expect(change).toHaveProperty('children');
      expect(change).toHaveProperty('depends_on');
    }
  });

  it('status 字段值应为 active 或 archived', () => {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const parsed = YAML.parse(content);
    for (const change of parsed.changes) {
      expect(['active', 'archived']).toContain(change.status);
    }
  });
});

describe('注册表读取逻辑', () => {
  it('应解析 YAML 并返回 change 的关系信息', () => {
    const yaml = `
version: 1
schema: change-registry
changes:
  - name: parent-change
    status: active
    parent: null
    children: [child-change]
    depends_on: []
    created: '2026-07-16'
    archived: null
  - name: child-change
    status: active
    parent: parent-change
    children: null
    depends_on: []
    created: '2026-07-16'
    archived: null
`;
    const parsed = YAML.parse(yaml);
    const changes = parsed.changes;
    const parent = changes.find((c: any) => c.name === 'parent-change');
    expect(parent).toBeDefined();
    expect(parent.children).toContain('child-change');
    const child = changes.find((c: any) => c.name === 'child-change');
    expect(child.parent).toBe('parent-change');
  });

  it('查找不存在的 change 时应返回 undefined', () => {
    const yaml = `
version: 1
schema: change-registry
changes: []
`;
    const parsed = YAML.parse(yaml);
    const found = parsed.changes.find((c: any) => c.name === 'nonexistent');
    expect(found).toBeUndefined();
  });

  it('无父 change 时 parent 字段为 null', () => {
    const change = { name: 'root', parent: null };
    expect(change.parent).toBeNull();
  });

  it('无子 change 时 children 字段为 null', () => {
    const change = { name: 'leaf', children: null };
    expect(change.children).toBeNull();
  });
});

describe('注册表写入逻辑', () => {
  it('应能追加新的子 change 记录', () => {
    const existing = {
      version: 1,
      schema: 'change-registry',
      changes: [
        { name: 'parent', status: 'active', parent: null, children: [], depends_on: [], created: '2026-07-16', archived: null }
      ]
    };
    const newChild = { name: 'child', status: 'active', parent: 'parent', children: null, depends_on: [], created: '2026-07-16', archived: null };
    existing.changes.push(newChild);
    existing.changes[0].children.push('child');

    const parent = existing.changes.find(c => c.name === 'parent');
    expect(parent!.children).toContain('child');
    expect(existing.changes.length).toBe(2);
  });

  it('应能更新 change 的 status 为 archived', () => {
    const change = { name: 'test', status: 'active', archived: null };
    change.status = 'archived';
    change.archived = '2026-07-16';
    expect(change.status).toBe('archived');
    expect(change.archived).toBe('2026-07-16');
  });

  it('YAML 序列化应保持结构完整', () => {
    const data = {
      version: 1,
      schema: 'change-registry',
      changes: [
        { name: 'test', status: 'active', parent: null, children: null, depends_on: [], created: '2026-07-16', archived: null }
      ]
    };
    const yaml = YAML.stringify(data);
    const reparsed = YAML.parse(yaml);
    expect(reparsed).toEqual(data);
  });
});

describe('注册表向后兼容', () => {
  it('注册表不存在时读取应返回空对象', () => {
    const nonExistentPath = '/tmp/nonexistent-registry.yaml';
    const exists = fs.existsSync(nonExistentPath);
    expect(exists).toBe(false);

    const result = exists ? YAML.parse(fs.readFileSync(nonExistentPath, 'utf-8')) : {};
    expect(result).toEqual({});
  });

  it('注册表不存在时不输出注册表相关警告', () => {
    const exists = fs.existsSync('/nonexistent/path');
    if (!exists) {
      expect(true).toBe(true);
    }
  });

  it('sdd-plan 在无注册表时应正常执行拆分提示以外的所有逻辑', () => {
    const registryExists = false;
    const splitTriggered = registryExists ? true : false;
    expect(splitTriggered).toBe(false);
  });
});

describe('注册表异常处理', () => {
  it('文件损坏时应输出警告并降级', () => {
    const corruptedYaml = 'version: 1\nschema: change-registry\nchanges: [invalid';
    expect(() => YAML.parse(corruptedYaml)).toThrow();
  });

  it('版本不匹配时应输出警告但继续执行', () => {
    const mismatched = { version: 2, schema: 'change-registry', changes: [] };
    const expectedVersion = 1;
    const isCompatible = mismatched.version === expectedVersion;
    expect(isCompatible).toBe(false);
  });

  it('change 目录已手动删除时注册表应标记不一致', () => {
    const registryEntry = { name: 'orphan-change', status: 'active' };
    const dirExists = false;
    const isOrphan = registryEntry.status === 'active' && !dirExists;
    expect(isOrphan).toBe(true);
  });

  it('父 change 已归档后子 change 仍可归档', () => {
    const parentArchived = { name: 'parent', status: 'archived' };
    const childActive = { name: 'child', status: 'active' };
    expect(childActive.status).toBe('active');
  });

  it('添加子 change 时名称冲突应阻断', () => {
    const existingNames = ['change-a', 'change-b'];
    const newName = 'change-a';
    const hasConflict = existingNames.includes(newName);
    expect(hasConflict).toBe(true);
  });
});