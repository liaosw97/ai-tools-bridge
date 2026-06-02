import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('shared-modules', () => {
  it('base-triggers.md should contain trigger template', () => {
    const content = readFileSync(resolve(__dirname, '../skills/_shared/base-triggers.md'), 'utf-8');
    // 验证触发条件格式模板
    expect(content).toContain('**触发**');
    expect(content).toContain('**不触发**');
    expect(content).toContain('**歧义处理**');
    // 验证至少 3 个示例触发词
    expect(content).toMatch(/`\/[a-z-]+`/);
    // 验证不触发条件的箭头指向格式
    expect(content).toContain('→');
  });

  it('output-constraints.md should contain constraints', () => {
    const content = readFileSync(resolve(__dirname, '../skills/_shared/output-constraints.md'), 'utf-8');
    // 验证禁止输出列表
    expect(content).toContain('禁止输出');
    expect(content).toContain('开场白');
    expect(content).toContain('工具调用');
    expect(content).toContain('未验证');
    // 验证零结果防护规则
    expect(content).toContain('零结果');
    expect(content).toContain('引用来源');
    expect(content).toContain('关键决策');
  });

  it('role-loading.md should contain role loading logic', () => {
    const content = readFileSync(resolve(__dirname, '../skills/_shared/role-loading.md'), 'utf-8');
    // 验证参数解析流程
    expect(content).toContain('--role');
    expect(content).toContain('提取');
    expect(content).toContain('验证');
    // 验证角色优先级规则
    expect(content).toContain('优先级');
    expect(content).toContain('会话级');
    expect(content).toContain('默认');
    // 验证角色查找流程
    expect(content).toContain('用户级');
    expect(content).toContain('项目级');
    expect(content).toContain('内置');
    // 验证降级策略
    expect(content).toContain('降级');
    expect(content).toContain('警告');
    // 验证格式错误处理
    expect(content).toContain('YAML');
    expect(content).toContain('解析失败');
    expect(content).toContain('缺少字段');
    // 验证内容长度（约 120 行）
    expect(content.split('\n').length).toBeGreaterThan(100);
  });

  it('breakdown-mode.md should contain breakdown logic', () => {
    const content = readFileSync(resolve(__dirname, '../skills/_shared/breakdown-mode.md'), 'utf-8');
    // 验证触发条件
    expect(content).toContain('--breakdown');
    expect(content).toContain('拆分');
    expect(content).toContain('分层');
    expect(content).toContain('功能模块');
    // 验证 L1 功能模块拆分流程
    expect(content).toContain('L1');
    expect(content).toContain('AI 提议');
    expect(content).toContain('用户确认');
    // 验证 L2 功能单元拆分流程
    expect(content).toContain('L2');
    expect(content).toContain('细化');
    expect(content).toContain('即时追问');
    // 验证 L3 功能点拆分流程
    expect(content).toContain('L3');
    expect(content).toContain('独立操作');
    // 验证目录冲突检测
    expect(content).toContain('冲突');
    expect(content).toContain('相似度');
    expect(content).toContain('60%');
  });

  it('review-loop.md should contain review loop logic', () => {
    const content = readFileSync(resolve(__dirname, '../skills/_shared/review-loop.md'), 'utf-8');
    // 验证 Review 流程
    expect(content).toContain('Review');
    expect(content).toContain('dispatch');
    expect(content).toContain('reviewer');
    expect(content).toContain('issues');
    expect(content).toContain('修复');
    // 验证轮次限制
    expect(content).toContain('轮次');
    expect(content).toContain('限制');
    expect(content).toContain('config.yaml');
    expect(content).toContain('review-rounds');
    // 验证达限处理
    expect(content).toContain('达限');
    expect(content).toContain('未解决');
    expect(content).toContain('继续修复');
    expect(content).toContain('接受');
    // 验证取消轮次限制
    expect(content).toContain('取消');
  });
});
