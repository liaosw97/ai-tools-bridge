import { describe, it, expect } from 'vitest';

// 功能单元状态
interface FeatureUnitStatus {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  path?: string;
}

// 功能单元选择函数
function selectFeatureUnit(units: FeatureUnitStatus[]): FeatureUnitStatus | null {
  // 优先选择第一个 pending 单元
  const pendingUnit = units.find(u => u.status === 'pending');
  if (pendingUnit) return pendingUnit;

  // 其次选择 in_progress 单元
  const inProgressUnit = units.find(u => u.status === 'in_progress');
  return inProgressUnit || null;
}

// 相似目录判断函数
function calculateDirectorySimilarity(name1: string, name2: string): number {
  const keywords1 = name1.toLowerCase().split(/[-_/]/);
  const keywords2 = name2.toLowerCase().split(/[-_/]/);
  const intersection = keywords1.filter(k => keywords2.includes(k));
  const union = [...new Set([...keywords1, ...keywords2])];
  return union.length > 0 ? intersection.length / union.length : 0;
}

// 目录冲突检测
interface DirectoryConflict {
  existingPath: string;
  newName: string;
  similarity: number;
}

function detectDirectoryConflicts(
  targetName: string,
  existingPaths: string[],
  threshold: number = 0.6
): DirectoryConflict[] {
  const conflicts: DirectoryConflict[] = [];

  for (const path of existingPaths) {
    const pathName = path.split('/').pop() || '';
    const similarity = calculateDirectorySimilarity(targetName, pathName);

    if (similarity >= threshold) {
      conflicts.push({
        existingPath: path,
        newName: targetName,
        similarity
      });
    }
  }

  return conflicts;
}

// 功能单元验证范围
interface TestScope {
  featureUnit: string;
  testFiles: string[];
}

function determineTestScope(featureUnit: string, allTestFiles: string[]): TestScope {
  // 根据功能单元名称筛选相关测试文件
  const relatedTests = allTestFiles.filter(file => {
    const fileName = file.toLowerCase();
    const unitParts = featureUnit.toLowerCase().split('/');
    return unitParts.some(part => fileName.includes(part.replace(/[-_\s]/g, '')));
  });

  return {
    featureUnit,
    testFiles: relatedTests.length > 0 ? relatedTests : allTestFiles
  };
}

// 下一功能单元推荐
function recommendNextUnit(units: FeatureUnitStatus[]): FeatureUnitStatus | null {
  return selectFeatureUnit(units);
}

describe('sdd-code feature unit selection', () => {
  // Task 0.3 骨架已存在
  describe('selectFeatureUnit', () => {
    it('should select first pending unit', () => {
      const units: FeatureUnitStatus[] = [
        { name: '用户创建', status: 'completed' },
        { name: '用户列表', status: 'pending' },
        { name: '用户修改', status: 'pending' }
      ];
      const selected = selectFeatureUnit(units);
      expect(selected?.name).toBe('用户列表');
    });

    it('should select in_progress unit when no pending', () => {
      const units: FeatureUnitStatus[] = [
        { name: '用户创建', status: 'completed' },
        { name: '用户列表', status: 'in_progress' }
      ];
      const selected = selectFeatureUnit(units);
      expect(selected?.name).toBe('用户列表');
    });

    it('should return null when all completed', () => {
      const units: FeatureUnitStatus[] = [
        { name: '用户创建', status: 'completed' },
        { name: '用户列表', status: 'completed' }
      ];
      const selected = selectFeatureUnit(units);
      expect(selected).toBeNull();
    });
  });

  describe('calculateDirectorySimilarity', () => {
    it('should return 1.0 for identical names', () => {
      expect(calculateDirectorySimilarity('user-management', 'user-management')).toBe(1.0);
    });

    it('should return high similarity for shared keywords', () => {
      // 'user-management' vs 'user-management-panel'：
      // 交集: ['user', 'management'] = 2
      // 并集: ['user', 'management', 'panel'] = 3
      // 相似度 = 2/3 ≈ 0.67
      const similarity = calculateDirectorySimilarity('user-management', 'user-management-panel');
      expect(similarity).toBeGreaterThan(0.6);
    });

    it('should return low similarity for different names', () => {
      const similarity = calculateDirectorySimilarity('user-management', 'product-catalog');
      expect(similarity).toBeLessThan(0.3);
    });
  });

  describe('detectDirectoryConflicts', () => {
    it('should detect conflicts above threshold', () => {
      const conflicts = detectDirectoryConflicts('user-management', [
        'src/user-management',
        'src/product-catalog'
      ], 0.6);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].existingPath).toBe('src/user-management');
    });

    it('should return empty when no conflicts', () => {
      const conflicts = detectDirectoryConflicts('user-management', [
        'src/product-catalog',
        'src/order-system'
      ], 0.6);
      expect(conflicts.length).toBe(0);
    });

    it('should respect custom threshold', () => {
      // 相似度 0.67，阈值设为 0.8 时不应检测到
      const conflicts = detectDirectoryConflicts('user-management', [
        'src/user-management-panel'
      ], 0.8);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('determineTestScope', () => {
    it('should filter related test files', () => {
      const scope = determineTestScope('用户管理/用户列表', [
        'tests/user-list.test.ts',
        'tests/product.test.ts',
        'tests/user-create.test.ts'
      ]);
      expect(scope.testFiles).toContain('tests/user-list.test.ts');
    });

    it('should return all tests when no related found', () => {
      const scope = determineTestScope('订单管理/订单列表', [
        'tests/user.test.ts',
        'tests/product.test.ts'
      ]);
      expect(scope.testFiles.length).toBe(2);
    });
  });

  describe('recommendNextUnit', () => {
    it('should recommend next pending unit', () => {
      const units: FeatureUnitStatus[] = [
        { name: '用户创建', status: 'completed' },
        { name: '用户列表', status: 'pending' },
        { name: '用户修改', status: 'pending' }
      ];
      const next = recommendNextUnit(units);
      expect(next?.name).toBe('用户列表');
    });
  });
});