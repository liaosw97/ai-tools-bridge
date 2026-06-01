export interface ReviewContext {
  'code-changes': string;
  'spec-context': string;
  'quality-metrics': {
    testCoverage: number;
    scenarioPassRate: number | null;
    totalScenarios: number;
  };
}

/**
 * 压缩 review 上下文，返回结构化 JSON
 */
export function compressReviewContext(diff: string, specScenarios: string[]): ReviewContext {
  // 提取 diff 中的关键变更
  const codeChanges = extractCodeChanges(diff);

  // 筛选相关的 spec 场景
  const relevantScenarios = filterRelevantScenarios(diff, specScenarios);

  // 计算质量指标
  const totalScenarios = specScenarios.length;
  const relevantCount = relevantScenarios.length;
  const qualityMetrics = {
    testCoverage: totalScenarios > 0 ? Math.round((relevantCount / totalScenarios) * 100) : 0,
    scenarioPassRate: null, // 需要在实际测试运行后填充
    totalScenarios,
  };

  return {
    'code-changes': codeChanges,
    'spec-context': relevantScenarios.join('\n'),
    'quality-metrics': qualityMetrics,
  };
}

/**
 * 从 diff 中提取关键变更
 */
function extractCodeChanges(diff: string): string {
  // 提取新增和修改的行
  const lines = diff.split('\n');
  const changes = lines
    .filter(line => line.startsWith('+') || line.startsWith('-'))
    .filter(line => !line.startsWith('+++') && !line.startsWith('---'))
    .join('\n');

  return changes;
}

/**
 * 筛选与 diff 相关的 spec 场景
 */
function filterRelevantScenarios(diff: string, specScenarios: string[]): string[] {
  // 从 diff 中提取关键词
  const keywords = extractKeywords(diff);

  // 筛选包含关键词的场景
  return specScenarios.filter(scenario => {
    const scenarioLower = scenario.toLowerCase();
    return keywords.some(keyword => scenarioLower.includes(keyword.toLowerCase()));
  });
}

/**
 * 从 diff 中提取关键词
 */
function extractKeywords(diff: string): string[] {
  const keywords: string[] = [];

  // 提取所有文件名（支持多文件 diff）
  const fileNameMatches = [...diff.matchAll(/diff --git a\/(.+?) b\//g)];
  fileNameMatches.forEach(m => keywords.push(m[1]));

  // 提取函数名
  const funcMatches = [...diff.matchAll(/\+function\s+(\w+)/g)];
  funcMatches.forEach(m => keywords.push(m[1]));

  // 提取类名
  const classMatches = [...diff.matchAll(/\+class\s+(\w+)/g)];
  classMatches.forEach(m => keywords.push(m[1]));

  return keywords;
}
