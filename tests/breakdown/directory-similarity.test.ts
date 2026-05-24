import { describe, it, expect } from 'vitest';

// 相似度计算
function calculateSimilarity(name1: string, name2: string): number {
  const keywords1 = name1.toLowerCase().split(/[-_/]/);
  const keywords2 = name2.toLowerCase().split(/[-_/]/);
  const intersection = keywords1.filter(k => keywords2.includes(k));
  const union = [...new Set([...keywords1, ...keywords2])];
  return union.length > 0 ? intersection.length / union.length : 0;
}

// 判断是否相似目录
function isSimilarDirectory(name1: string, name2: string, threshold: number = 0.6): boolean {
  return calculateSimilarity(name1, name2) >= threshold;
}

// 批量检测相似目录
function findSimilarDirectories(
  targetName: string,
  existingNames: string[],
  threshold: number = 0.6
): Array<{ name: string; similarity: number }> {
  const results: Array<{ name: string; similarity: number }> = [];

  for (const name of existingNames) {
    const similarity = calculateSimilarity(targetName, name);
    if (similarity >= threshold) {
      results.push({ name, similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

// 功能语义相似性判断（简化版）
function isFunctionallySimilar(desc1: string, desc2: string): boolean {
  // 简化检测：查找相同功能关键词
  const functionalKeywords = ['管理', '列表', '创建', '编辑', '删除', '查询', '统计'];

  const keywords1 = functionalKeywords.filter(k => desc1.includes(k));
  const keywords2 = functionalKeywords.filter(k => desc2.includes(k));

  // 至少有一个共同功能关键词
  return keywords1.some(k => keywords2.includes(k));
}

describe('directory similarity', () => {
  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical names', () => {
      expect(calculateSimilarity('user-management', 'user-management')).toBe(1.0);
    });

    it('should return 0 for completely different names', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
    });

    it('should calculate partial similarity correctly', () => {
      // 'user-management' vs 'user-control':
      // 交集: ['user'] = 1
      // 并集: ['user', 'management', 'control'] = 3
      // 相似度 = 1/3 ≈ 0.333
      const similarity = calculateSimilarity('user-management', 'user-control');
      expect(similarity).toBeCloseTo(0.333, 2);
    });
  });

  describe('isSimilarDirectory', () => {
    it('should return true for high similarity', () => {
      // 'user-management' vs 'user-management-panel':
      // 交集: ['user', 'management'] = 2
      // 并集: ['user', 'management', 'panel'] = 3
      // 相似度 = 2/3 ≈ 0.67 > 0.6
      expect(isSimilarDirectory('user-management', 'user-management-panel')).toBe(true);
    });

    it('should return false for low similarity', () => {
      expect(isSimilarDirectory('user-management', 'product-catalog')).toBe(false);
    });

    it('should respect custom threshold', () => {
      const similarity = calculateSimilarity('user-mgmt', 'user-management');
      // 交集: ['user'] = 1
      // 并集: ['user', 'mgmt', 'management'] = 3
      // 相似度 = 1/3 ≈ 0.33
      expect(isSimilarDirectory('user-mgmt', 'user-management', 0.8)).toBe(false);
    });
  });

  describe('findSimilarDirectories', () => {
    it('should find and sort similar directories', () => {
      const existing = [
        'user-management',
        'user-management-panel',
        'product-catalog',
        'user-control'
      ];

      const similar = findSimilarDirectories('user-management-new', existing, 0.3);

      // 应该找到包含 'user' 的目录
      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].similarity).toBeGreaterThanOrEqual(similar[similar.length - 1].similarity);
    });

    it('should return empty when no similar directories', () => {
      const existing = ['product-catalog', 'order-system', 'inventory-management'];
      const similar = findSimilarDirectories('user-management', existing, 0.6);
      expect(similar.length).toBe(0);
    });
  });

  describe('isFunctionallySimilar', () => {
    it('should detect similar functionality', () => {
      expect(isFunctionallySimilar('用户管理模块', '人员管理功能')).toBe(true);
    });

    it('should return false for different functionality', () => {
      expect(isFunctionallySimilar('用户管理', '数据统计')).toBe(false);
    });

    it('should handle empty descriptions', () => {
      expect(isFunctionallySimilar('', '用户管理')).toBe(false);
    });
  });
});