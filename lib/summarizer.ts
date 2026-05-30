export interface ScenarioTriple {
  given: string;
  when: string;
  then: string;
}

export interface SummaryResult {
  scenarios: string[];
  triples: ScenarioTriple[];
  tasks: TaskSummary[];
  rawSummary: string;
}

export interface TaskSummary {
  number: string;
  description: string;
  specLink: string;
}

/**
 * 从 spec 内容中提取场景名称和 GIVEN/WHEN/THEN 三元组
 */
export function summarizeSpec(content: string): SummaryResult {
  const scenarios: string[] = [];
  const triples: ScenarioTriple[] = [];

  // 提取场景名称
  const scenarioRegex = /####\s*Scenario:\s*(.+)/g;
  let match;
  while ((match = scenarioRegex.exec(content)) !== null) {
    scenarios.push(match[1].trim());
  }

  // 提取 GIVEN/WHEN/THEN 三元组
  const tripleRegex = /####\s*Scenario:\s*.+\n([\s\S]*?)(?=####|$)/g;
  while ((match = tripleRegex.exec(content)) !== null) {
    const section = match[1];
    const givenMatch = section.match(/\*\*GIVEN\*\*\s*(.+)/);
    const whenMatch = section.match(/\*\*WHEN\*\*\s*(.+)/);
    const thenMatch = section.match(/\*\*THEN\*\*\s*(.+)/);

    if (givenMatch && whenMatch && thenMatch) {
      triples.push({
        given: givenMatch[1].trim(),
        when: whenMatch[1].trim(),
        then: thenMatch[1].trim(),
      });
    }
  }

  return {
    scenarios,
    triples,
    tasks: [],
    rawSummary: scenarios.join('\n'),
  };
}

/**
 * 从 tasks.md 内容中提取任务编号、描述和 spec 链接
 */
export function summarizeTasks(content: string): SummaryResult {
  const tasks: TaskSummary[] = [];

  // 提取任务项
  const taskRegex = /-\s*\[[ x]\]\s*(\d+\.\d+)\s+(.+?)\s*\[spec:(.+?)\]/g;
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push({
      number: match[1],
      description: match[2].trim(),
      specLink: `spec:${match[3]}`,
    });
  }

  return {
    scenarios: [],
    triples: [],
    tasks,
    rawSummary: tasks.map(t => `${t.number} ${t.description}`).join('\n'),
  };
}

/**
 * 计算关键信息覆盖率
 * 覆盖率 = 保留的关键字段数 / 原文关键字段总数 × 100%
 * 支持精确匹配和子串匹配
 */
export function calculateCoverage(original: string, summary: string): number {
  const originalFields = original.split(/\s+/).filter(f => f.length > 0);
  const summaryFields = summary.split(/\s+/).filter(f => f.length > 0);

  if (originalFields.length === 0) return 100;

  // 精确匹配 + 子串匹配
  const coveredFields = originalFields.filter(originalField =>
    summaryFields.some(summaryField =>
      summaryField === originalField ||
      summaryField.includes(originalField) ||
      originalField.includes(summaryField)
    )
  );

  return Math.round((coveredFields.length / originalFields.length) * 100);
}
