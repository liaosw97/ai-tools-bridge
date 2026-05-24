import { describe, it, expect } from 'vitest';

// Schema 验证函数
interface SchemaConfig {
  enabled: boolean;
  defaultDepth?: number;
  keywords?: string[];
}

function validateSchema(yamlContent: string): { valid: boolean; config?: SchemaConfig; errors: string[] } {
  const errors: string[] = [];

  // 简化的 YAML 解析（仅用于测试）
  const lines = yamlContent.split('\n');
  const config: SchemaConfig = { enabled: true };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('enabled:')) {
      const value = trimmed.split(':')[1].trim();
      config.enabled = value === 'true';
    }

    if (trimmed.startsWith('default-depth:')) {
      const value = parseInt(trimmed.split(':')[1].trim());
      if (isNaN(value) || value < 1 || value > 3) {
        errors.push('default-depth must be 1, 2, or 3');
      } else {
        config.defaultDepth = value;
      }
    }

    if (trimmed.startsWith('keywords:')) {
      // 简化处理，实际需要更复杂的 YAML 解析
      config.keywords = ['拆分', '分层', '逐步探索', '功能模块'];
    }
  }

  return { valid: errors.length === 0, config, errors };
}

describe('schema validation', () => {
  it('should validate breakdown config schema', () => {
    const yaml = `
breakdown:
  enabled: true
  default-depth: 3
  keywords:
    - 拆分
    - 分层
    - 逐步探索
    - 功能模块
`;
    const result = validateSchema(yaml);
    expect(result.valid).toBe(true);
    expect(result.config?.enabled).toBe(true);
    expect(result.config?.defaultDepth).toBe(3);
  });

  it('should reject invalid default-depth', () => {
    const yaml = `
breakdown:
  enabled: true
  default-depth: 5
`;
    const result = validateSchema(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('default-depth must be 1, 2, or 3');
  });

  it('should accept disabled config', () => {
    const yaml = `
breakdown:
  enabled: false
`;
    const result = validateSchema(yaml);
    expect(result.valid).toBe(true);
    expect(result.config?.enabled).toBe(false);
  });
});
