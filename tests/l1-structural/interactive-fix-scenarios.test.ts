import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function readSkillBody(skillName: string): string {
  const filePath = resolveRoot('skills', skillName, 'SKILL.md');
  return parseSkillFrontmatter(filePath).body;
}

describe('interactive-fix scenarios coverage', () => {
  describe('sdd-review-code', () => {
    const body = readSkillBody('sdd-review-code');

    test('Phase 3 交互式修复章节存在', () => {
      expect(body).toContain('交互式修复');
      expect(body).toContain('Phase 2 发现 major 或 minor issues');
    });

    test('提供 4 个处理选项', () => {
      expect(body).toContain('自动修复');
      expect(body).toContain('手动修复');
      expect(body).toContain('跳过');
      expect(body).toContain('标记为已修复');
    });

    test('自动修复逻辑描述完整', () => {
      // 验证自动修复成功路径
      expect(body).toContain('按建议使用 Edit 工具修改文件');
      expect(body).toContain('标记已处理');
      // 验证自动修复失败降级路径
      expect(body).toContain('降级为手动修复');
    });

    test('手动修复逻辑描述完整', () => {
      // 验证修复指引输出
      expect(body).toContain('修复指引');
      expect(body).toContain('文件路径');
      expect(body).toContain('修改位置');
      expect(body).toContain('预期内容');
      // 验证等待用户确认
      expect(body).toContain('等待用户确认');
    });

    test('修复完成汇总格式完整', () => {
      expect(body).toContain('总问题数');
      expect(body).toContain('已修复');
      expect(body).toContain('已跳过');
      expect(body).toContain('已标记');
    });

    test('已标记问题列出详情', () => {
      expect(body).toContain('已标记问题');
      expect(body).toContain('问题标题');
      expect(body).toContain('文件路径');
      expect(body).toContain('请稍后处理已标记的问题');
    });
  });

  describe('sdd-review-spec', () => {
    const body = readSkillBody('sdd-review-spec');

    test('交互式修复章节存在', () => {
      expect(body).toContain('交互式修复');
      expect(body).toContain('spec 审查发现 major 或 minor issues');
    });

    test('复用 sdd-review-code 的交互逻辑', () => {
      expect(body).toContain('复用 sdd-review-code 的交互循环和修复执行逻辑');
      expect(body).toContain('相同的 4 个选项');
    });

    test('提供完整的 4 个选项', () => {
      expect(body).toContain('自动修复');
      expect(body).toContain('手动修复');
      expect(body).toContain('跳过');
      expect(body).toContain('标记为已修复');
    });

    test('跳过条件完整', () => {
      expect(body).toContain('spec 审查未发现问题');
      expect(body).toContain('用户选择跳过修复');
    });
  });
});

describe('interactive-fix spec scenarios', () => {
  describe('流程指引格式不一致场景', () => {
    test('sdd-review-code 包含自动修复逻辑', () => {
      const body = readSkillBody('sdd-review-code');
      // 自动修复应描述按建议修改文件的逻辑
      expect(body).toContain('按建议使用 Edit 工具修改文件');
    });
  });

  describe('缺少选项场景', () => {
    test('sdd-review-code 包含自动修复逻辑', () => {
      const body = readSkillBody('sdd-review-code');
      // 自动修复应描述添加缺失选项的逻辑
      expect(body).toContain('自动修复');
      expect(body).toContain('按建议');
    });
  });

  describe('用户修改不完整场景', () => {
    test('sdd-review-code 包含手动修复验证逻辑', () => {
      const body = readSkillBody('sdd-review-code');
      // 手动修复应包含验证逻辑
      expect(body).toContain('手动修复');
      expect(body).toContain('等待用户确认');
    });

    test('sdd-review-code 手动修复部分包含修改不完整处理', () => {
      const body = readSkillBody('sdd-review-code');
      // 提取手动修复部分的内容
      const manualFixMatch = body.match(/手动修复[\s\S]*?(?=\| 跳过|$)/);
      expect(manualFixMatch, '未找到手动修复部分').not.toBeNull();

      if (manualFixMatch) {
        const manualFixSection = manualFixMatch[0];
        // 手动修复部分应该包含修改不完整的处理逻辑
        const hasIncompleteHandling =
          manualFixSection.includes('修改不完整') ||
          manualFixSection.includes('缺失项') ||
          manualFixSection.includes('验证修改') ||
          manualFixSection.includes('忽略') ||
          manualFixSection.includes('重新修改');
        expect(hasIncompleteHandling, 'sdd-review-code 手动修复部分缺少"修改不完整"场景的处理逻辑').toBe(true);
      }
    });
  });
});
