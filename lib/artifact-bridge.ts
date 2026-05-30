import { readFileSync } from 'fs';
import { summarizeSpec, summarizeTasks } from './summarizer.js';

/**
 * 读取 spec 文件并返回摘要（而非完整内容）
 */
export function passSpecToSubagent(specPath: string): string {
  const content = readFileSync(specPath, 'utf-8');
  const result = summarizeSpec(content);

  const lines: string[] = [];
  lines.push('## Spec 场景摘要');
  lines.push('');
  lines.push(`场景数量: ${result.scenarios.length}`);
  lines.push('');
  lines.push('### 场景列表');
  result.scenarios.forEach((s, i) => {
    lines.push(`${i + 1}. ${s}`);
  });

  if (result.triples.length > 0) {
    lines.push('');
    lines.push('### GIVEN/WHEN/THEN 三元组');
    result.triples.forEach((t, i) => {
      lines.push(`${i + 1}. GIVEN: ${t.given}`);
      lines.push(`   WHEN: ${t.when}`);
      lines.push(`   THEN: ${t.then}`);
    });
  }

  return lines.join('\n');
}

/**
 * 读取 tasks.md 文件并返回摘要（而非完整内容）
 */
export function passTasksToSubagent(tasksPath: string): string {
  const content = readFileSync(tasksPath, 'utf-8');
  const result = summarizeTasks(content);

  const lines: string[] = [];
  lines.push('## Tasks 摘要');
  lines.push('');
  lines.push(`任务数量: ${result.tasks.length}`);
  lines.push('');
  lines.push('### 任务列表');
  result.tasks.forEach(t => {
    lines.push(`- [ ] ${t.number} ${t.description} [${t.specLink}]`);
  });

  return lines.join('\n');
}
