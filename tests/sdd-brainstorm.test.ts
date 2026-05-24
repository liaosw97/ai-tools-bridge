import { describe, it, expect } from 'vitest';

// 拆分模式检测函数（从 SKILL.md 提取的逻辑）
function detectBreakdownMode(input: string, config: { enabled: boolean } = { enabled: true }): boolean {
  if (!config.enabled) return false;

  // 参数触发
  if (input.includes('--breakdown') || input.includes('-b')) return true;

  // 自然语言触发
  const keywords = ['拆分', '分层', '逐步探索', '功能模块'];
  for (const keyword of keywords) {
    if (input.includes(keyword)) return true;
  }

  return false;
}

// L3 拆分判断函数
function shouldContinueSplitting(operations: string[]): boolean {
  return operations.length > 3;
}

// 相似目录判断函数
function calculateSimilarity(name1: string, name2: string): number {
  const keywords1 = name1.toLowerCase().split(/[-_/]/);
  const keywords2 = name2.toLowerCase().split(/[-_/]/);
  const intersection = keywords1.filter(k => keywords2.includes(k));
  const union = [...new Set([...keywords1, ...keywords2])];
  return intersection.length / union.length;
}

describe('sdd-brainstorm breakdown mode', () => {
  // Task 1.1-1.2: 拆分模式检测测试
  describe('detectBreakdownMode', () => {
    it('should detect breakdown mode from --breakdown parameter', () => {
      expect(detectBreakdownMode('/sdd-brainstorm --breakdown')).toBe(true);
    });

    it('should detect breakdown mode from -b parameter', () => {
      expect(detectBreakdownMode('/sdd-brainstorm -b')).toBe(true);
    });

    it('should detect breakdown mode from natural language keyword "拆分"', () => {
      expect(detectBreakdownMode('帮我拆分这个需求')).toBe(true);
    });

    it('should detect breakdown mode from natural language keyword "分层"', () => {
      expect(detectBreakdownMode('分层探索后台管理')).toBe(true);
    });

    it('should detect breakdown mode from natural language keyword "逐步探索"', () => {
      expect(detectBreakdownMode('逐步探索需求')).toBe(true);
    });

    it('should detect breakdown mode from natural language keyword "功能模块"', () => {
      expect(detectBreakdownMode('分析功能模块')).toBe(true);
    });

    it('should not trigger without keywords', () => {
      expect(detectBreakdownMode('探索需求')).toBe(false);
    });

    it('should not trigger when config.enabled is false', () => {
      expect(detectBreakdownMode('拆分需求', { enabled: false })).toBe(false);
    });
  });

  // Task 1.5: L3 拆分判断测试
  describe('shouldContinueSplitting', () => {
    it('should return true when operations > 3', () => {
      expect(shouldContinueSplitting(['op1', 'op2', 'op3', 'op4'])).toBe(true);
    });

    it('should return false when operations <= 3', () => {
      expect(shouldContinueSplitting(['op1', 'op2', 'op3'])).toBe(false);
    });

    it('should return false for empty operations', () => {
      expect(shouldContinueSplitting([])).toBe(false);
    });
  });

  // Task 1.9: 相似目录判断测试
  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical names', () => {
      expect(calculateSimilarity('user-management', 'user-management')).toBe(1.0);
    });

    it('should return high similarity for shared keywords', () => {
      // 'user-management' vs 'user-management-panel'：
      // 交集: ['user', 'management'] = 2
      // 并集: ['user', 'management', 'panel'] = 3
      // 相似度 = 2/3 ≈ 0.67 > 0.6
      const similarity = calculateSimilarity('user-management', 'user-management-panel');
      expect(similarity).toBeGreaterThan(0.6);
    });

    it('should return low similarity for different names', () => {
      const similarity = calculateSimilarity('user-management', 'product-catalog');
      expect(similarity).toBeLessThan(0.3);
    });
  });
});
