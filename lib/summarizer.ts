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

export interface ChangeEntry {
  file: string;
  type: 'ADDED' | 'MODIFIED' | 'REMOVED';
  module: string;
  reason?: string;
}

export interface ChangeList {
  entries: ChangeEntry[];
  byModule: Record<string, ChangeEntry[]>;
  summary: {
    total: number;
    added: number;
    modified: number;
    removed: number;
  };
}

/**
 * 从 spec 内容中提取场景名称和 GIVEN/WHEN/THEN 三元组
 */
export function summarizeSpec(content: string): SummaryResult {
  const scenarios: string[] = [];
  const triples: ScenarioTriple[] = [];

  // 提取场景名称（支持 h3 和 h4 级别，中英文）
  const scenarioRegex = /#{3,4}\s*(?:场景|Scenario)[:\s]+(.+)/g;
  let match;
  while ((match = scenarioRegex.exec(content)) !== null) {
    scenarios.push(match[1].trim());
  }

  // 提取 GIVEN/WHEN/THEN 三元组
  const tripleRegex = /#{3,4}\s*(?:场景|Scenario)[:\s]+.+\n([\s\S]*?)(?=#{3,4}\s|$)/g;
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
 * 停用词列表 — 这些词不计入覆盖率计算
 */
const STOP_WORDS = new Set([
  // 英文停用词
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
  'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their',
  // 中文停用词（单字虚词）
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都',
  '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这',
]);

/**
 * 提取关键词（过滤停用词，最小长度 2）
 */
function extractWords(text: string): string[] {
  // 中文按字符拆分，英文按空白拆分，统一过滤
  const tokens = text.split(/\s+/).filter(f => f.length >= 2 && !STOP_WORDS.has(f.toLowerCase()));
  return tokens;
}

/**
 * 计算关键信息覆盖率
 * 覆盖率 = 保留的关键字段数 / 原文关键字段总数 × 100%
 * 使用精确匹配，过滤停用词
 */
export function calculateCoverage(original: string, summary: string): number {
  const originalFields = extractWords(original);
  const summaryFields = extractWords(summary);

  if (originalFields.length === 0) return 100;

  const summarySet = new Set(summaryFields.map(f => f.toLowerCase()));

  // 精确匹配（大小写不敏感）
  const coveredFields = originalFields.filter(field =>
    summarySet.has(field.toLowerCase())
  );

  return Math.round((coveredFields.length / originalFields.length) * 100);
}

/**
 * 从模块路径推断模块分类
 */
function classifyModule(filePath: string): string {
  if (filePath.startsWith('skills/')) return 'skills';
  if (filePath.startsWith('lib/')) return 'lib';
  if (filePath.startsWith('scripts/')) return 'scripts';
  if (filePath.startsWith('tests/')) return 'tests';
  if (filePath.startsWith('guidelines/')) return 'guidelines';
  if (filePath.startsWith('roles/')) return 'roles';
  if (filePath.startsWith('schemas/')) return 'schemas';
  if (filePath.startsWith('integrations/')) return 'integrations';
  return 'other';
}

/**
 * 从 git diff 中提取变更清单
 * 解析 diff --git 行和 new/deleted file 模式，生成结构化变更列表
 */
export function generateChangeList(diff: string): ChangeList {
  const entries: ChangeEntry[] = [];
  const fileBlocks = diff.split(/^diff --git /m).filter(block => block.trim());

  for (const block of fileBlocks) {
    const headerMatch = block.match(/^a\/(.+?) b\/(.+)$/m);
    if (!headerMatch) continue;

    const oldPath = headerMatch[1];
    const newPath = headerMatch[2];

    let type: ChangeEntry['type'];
    let reason: string | undefined;

    if (block.includes('new file mode')) {
      type = 'ADDED';
    } else if (block.includes('deleted file mode')) {
      type = 'REMOVED';
      reason = '文件删除';
    } else if (oldPath !== newPath) {
      type = 'MODIFIED';
      reason = `重命名: ${oldPath} → ${newPath}`;
    } else {
      type = 'MODIFIED';
    }

    const file = newPath;
    const module = classifyModule(file);

    entries.push({ file, type, module, reason });
  }

  // 按模块分组
  const byModule: Record<string, ChangeEntry[]> = {};
  for (const entry of entries) {
    if (!byModule[entry.module]) {
      byModule[entry.module] = [];
    }
    byModule[entry.module].push(entry);
  }

  // 统计
  const summary = {
    total: entries.length,
    added: entries.filter(e => e.type === 'ADDED').length,
    modified: entries.filter(e => e.type === 'MODIFIED').length,
    removed: entries.filter(e => e.type === 'REMOVED').length,
  };

  return { entries, byModule, summary };
}
