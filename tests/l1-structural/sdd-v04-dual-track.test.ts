// v0.4 双轨制升级 — 结构验证
// 覆盖: hotfix 生命周期接线、三图/契约化 SKILL 更新、轨道×产物矩阵、plugin 注册

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolveRoot, loadSchema } from '../setup.js';

const read = (p: string) => readFileSync(resolveRoot(...p.split('/')), 'utf-8');

describe('v0.4 dual-track: hotfix lifecycle wiring', () => {
  test('sdd-ship has hotfix exemption path', () => {
    const body = read('skills/sdd-ship/SKILL.md');
    expect(body).toContain('hotfix');
    expect(body).toContain('轻量归档豁免');
  });

  test('sdd-continue and sdd-ff guard hotfix changes (no forced artifacts)', () => {
    for (const f of ['skills/sdd-continue/SKILL.md', 'skills/sdd-ff/SKILL.md']) {
      const body = read(f);
      expect(body).toContain('hotfix change 检测');
      expect(body).toContain('不强行生成');
    }
  });

  test('sdd-verify downgrades hotfix changes instead of blocking', () => {
    const body = read('skills/sdd-verify/SKILL.md');
    expect(body).toContain('hotfix 降级检测');
    expect(body).toContain('不报错阻断');
  });

  test('sdd-doctor recommends dual-track routing with track markers', () => {
    const body = read('skills/sdd-doctor/SKILL.md');
    expect(body).toContain('/sdd-hotfix');
    expect(body).toContain('轨道标记');
    expect(body).toContain('[feature]');
    expect(body).toContain('analyze 必需');
  });
});

describe('v0.4 dual-track: blueprint (three diagrams) wiring', () => {
  test('functions.md template has five-section structure with mermaid + batch placeholder', () => {
    const tpl = read('schemas/sdd/templates/functions.md');
    expect(tpl).toContain('功能架构图');
    expect(tpl).toContain('函数声明图');
    expect(tpl).toContain('调用关系图');
    expect(tpl).toContain('classDef existing');
    expect(tpl).toContain('批次: <plan 阶段回填>');
  });

  test('sdd-analyze has three-diagram generation rules', () => {
    const body = read('skills/sdd-analyze/SKILL.md');
    expect(body).toContain('三图生成规范');
    expect(body).toContain('architecture-');
    expect(body).toContain('存量节点用 classDef existing');
  });

  test('sdd-plan generates test-cases.md and backfills functions.md batch ownership', () => {
    const body = read('skills/sdd-plan/SKILL.md');
    expect(body).toContain('生成 test-cases.md');
    expect(body).toContain('回写 functions.md');
    expect(body).toContain('禁止跨未完成批次');
  });
});

describe('v0.4 dual-track: test contract wiring', () => {
  test('test-cases.md template has identifier + description columns', () => {
    const tpl = read('schemas/sdd/templates/test-cases.md');
    expect(tpl).toContain('用例名');
    expect(tpl).toContain('描述');
    expect(tpl).toContain('代码标识符');
    expect(tpl).toContain('[spec:domain#scenario]');
  });

  test('sdd-code has contract slicing and batch self-check', () => {
    const body = read('skills/sdd-code/SKILL.md');
    expect(body).toContain('切片加载');
    expect(body).toContain('写契约');
    expect(body).toContain('只读依赖');
    expect(body).toContain('批次自检');
    expect(body).toContain('幻影测试');
    expect(body).toContain('批次级阻断');
  });

  test('sdd-verify has three-way alignment', () => {
    const body = read('skills/sdd-verify/SKILL.md');
    expect(body).toContain('三向对齐');
    expect(body).toContain('符号级 grep');
    expect(body).toContain('全量回归');
  });
});

describe('v0.4 dual-track: artifacts and plugin', () => {
  test('schema has hotfix and test-cases artifacts', () => {
    const schema = loadSchema();
    expect(schema.artifacts.hotfix).toBeTruthy();
    expect(schema.artifacts['test-cases']).toBeTruthy();
    expect(schema.actions['sdd-hotfix']).toBeTruthy();
  });

  test('schema notes hotfix outside dependency chain and test-cases lifecycle', () => {
    const schema = loadSchema();
    const notes = schema.dependency_chain.notes.join('\n');
    expect(notes).toContain('hotfix 不进依赖链');
    expect(notes).toContain('test-cases 由 sdd-plan 生成');
  });

  test('plugin.json registers sdd-hotfix with v0.4.0', () => {
    const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
    expect(plugin.version).toBe('0.4.0');
    expect(plugin.skills).toContain('./skills/sdd-hotfix');
    expect(plugin.skills).toHaveLength(16);
  });

  test('quality-checkpoints has hotfix gate and track x artifact matrix', () => {
    const body = read('guidelines/quality-checkpoints.md');
    expect(body).toContain('sdd-hotfix 质量门');
    expect(body).toContain('轨道×产物矩阵');
    expect(body).toContain('三向对齐');
  });

  test('scope-box defaults appear in doctor limits output', () => {
    const body = read('skills/sdd-doctor/SKILL.md');
    expect(body).toContain('hotfix-locate-rounds: 3');
    expect(body).toContain('quick-max-files: 3');
  });
});
