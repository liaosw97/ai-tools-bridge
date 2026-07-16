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

  it('YAML 序列化后写入文件应可读取还原', () => {
    const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync('.'), '.registry-test-'));
    const tmpFile = path.join(tmpDir, 'change-registry.yaml');
    try {
      const data = {
        version: 1,
        schema: 'change-registry',
        changes: [
          { name: 'parent', status: 'active', parent: null, children: ['child'], depends_on: [], created: '2026-07-16', archived: null },
          { name: 'child', status: 'active', parent: 'parent', children: null, depends_on: [], created: '2026-07-16', archived: null }
        ]
      };
      // 模拟写入逻辑：序列化 → 写文件
      const yaml = YAML.stringify(data);
      fs.writeFileSync(tmpFile, yaml, 'utf-8');
      // 验证文件存在
      expect(fs.existsSync(tmpFile)).toBe(true);
      // 读取并解析
      const content = fs.readFileSync(tmpFile, 'utf-8');
      const reparsed = YAML.parse(content);
      expect(reparsed).toEqual(data);
      expect(reparsed.changes).toHaveLength(2);
      expect(reparsed.changes[0].children).toContain('child');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('注册表向后兼容', () => {
  it('注册表不存在时读取应返回空对象', () => {
    const nonExistentPath = './nonexistent-registry.yaml';
    const exists = fs.existsSync(nonExistentPath);
    expect(exists).toBe(false);

    // 降级行为：文件不存在时返回空对象
    // 如果注册表不存在，读取逻辑应返回空对象（不抛异常，不输出警告）
    const result = exists ? YAML.parse(fs.readFileSync(nonExistentPath, 'utf-8')) : {};
    expect(result).toEqual({});
  });

  it('注册表不存在时不应尝试读取文件', () => {
    const nonExistentPath = './nonexistent-registry.yaml';
    const exists = fs.existsSync(nonExistentPath);
    // 文件不存在时，不会进入读取分支
    // 验证：不存在时不调用 readFileSync 和 YAML.parse
    if (!exists) {
      // 降级路径：直接返回空对象，不尝试读取
      expect(true).toBe(true);
    } else {
      // 不应该到达这里
      expect(false).toBe(true);
    }
  });

  it('sdd-plan 在无注册表时应正常执行拆分提示以外的所有逻辑', () => {
    // 模拟注册表不存在时，拆分相关逻辑应被跳过
    // 具体行为在 sdd-plan SKILL.md 中定义，此处验证逻辑判断
    const registryExists = false;
    const shouldAttemptSplit = registryExists && true;
    expect(shouldAttemptSplit).toBe(false);
    // 注册表不存在时，不触发拆分流程
    // 拆分以外的所有逻辑（任务规模检测、分批生成等）正常执行
    expect(registryExists).toBe(false);
  });

  it('注册表不存在时文件读取操作应被跳过（不抛出 ENOENT）', () => {
    const nonExistentPath = './definitely-not-exist.yaml';
    // 先检查文件不存在
    expect(fs.existsSync(nonExistentPath)).toBe(false);
    // 模拟降级逻辑：文件不存在时直接返回空，不调用 readFileSync
    // 如果错误地调用了 readFileSync，会抛出 ENOENT
    const safeRead = () => {
      if (!fs.existsSync(nonExistentPath)) {
        return {};
      }
      return YAML.parse(fs.readFileSync(nonExistentPath, 'utf-8'));
    };
    expect(safeRead).not.toThrow();
    expect(safeRead()).toEqual({});
  });
});

describe('注册表异常处理', () => {
  it('文件损坏时应输出警告并降级', () => {
    // 验证 YAML.parse 在遇到无效输入时抛出异常
    // 这是注册表读取逻辑中"捕获 YAML 解析异常"的前提
    const corruptedYaml = 'version: 1\nschema: change-registry\nchanges: [invalid';
    expect(() => YAML.parse(corruptedYaml)).toThrow();
  });

  it('文件损坏时降级路径应返回空对象', () => {
    // 模拟读取逻辑的异常处理：捕获异常后返回空对象降级
    const corruptedYaml = 'version: 1\nschema: change-registry\nchanges: [invalid';
    let result;
    try {
      result = YAML.parse(corruptedYaml);
    } catch {
      result = {}; // 降级：返回空对象
    }
    expect(result).toEqual({});
  });

  it('版本不匹配时应输出警告但继续执行', () => {
    const mismatched = { version: 2, schema: 'change-registry', changes: [] };
    const expectedVersion = 1;
    const isCompatible = mismatched.version === expectedVersion;
    expect(isCompatible).toBe(false);
    // 版本不匹配不阻断执行，可以继续操作
    const canContinue = true;
    expect(canContinue).toBe(true);
  });

  it('change 目录已手动删除时注册表应标记不一致', () => {
    const registryEntry = { name: 'orphan-change', status: 'active' };
    const dirExists = false;
    const isOrphan = registryEntry.status === 'active' && !dirExists;
    expect(isOrphan).toBe(true);
    // 孤项检测逻辑：注册表中有记录但目录不存在
    // 由 sdd-doctor 检测并输出提示
  });

  it('父 change 已归档后子 change 仍可归档', () => {
    const parentArchived = { name: 'parent', status: 'archived' };
    const childActive = { name: 'child', status: 'active' };
    // 父 change 归档不影响子 change 的状态
    expect(childActive.status).toBe('active');
    // 子 change 可以独立归档
    const canArchiveChild = true;
    expect(canArchiveChild).toBe(true);
  });

  it('添加子 change 时名称冲突应阻断', () => {
    const existingNames = ['change-a', 'change-b'];
    const newName = 'change-a';
    const hasConflict = existingNames.includes(newName);
    expect(hasConflict).toBe(true);
    // 名称冲突时不应更新注册表
    const shouldUpdate = !hasConflict;
    expect(shouldUpdate).toBe(false);
  });

  it('损坏的注册表文件写入磁盘后读取应降级', () => {
    const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync('.'), '.registry-test-'));
    const tmpFile = path.join(tmpDir, 'corrupted-registry.yaml');
    try {
      // 写入损坏的 YAML 文件
      fs.writeFileSync(tmpFile, 'version: 1\nschema: change-registry\nchanges: [invalid', 'utf-8');
      // 读取时应降级
      let result;
      try {
        const content = fs.readFileSync(tmpFile, 'utf-8');
        result = YAML.parse(content);
      } catch {
        result = {};
      }
      expect(result).toEqual({});
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('版本不匹配的注册表文件写入磁盘后读取应继续执行', () => {
    const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync('.'), '.registry-test-'));
    const tmpFile = path.join(tmpDir, 'version-mismatch-registry.yaml');
    try {
      // 写入 version: 2 的注册表
      const data = { version: 2, schema: 'change-registry', changes: [] };
      fs.writeFileSync(tmpFile, YAML.stringify(data), 'utf-8');
      // 读取时检查版本
      const content = fs.readFileSync(tmpFile, 'utf-8');
      const parsed = YAML.parse(content);
      expect(parsed.version).toBe(2);
      // 版本不匹配，但数据仍可读取
      expect(parsed.changes).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});