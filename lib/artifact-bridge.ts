import { readFileSync } from 'fs';
import { summarizeSpec, summarizeTasks } from './summarizer.js';

/**
 * 读取 spec 文件并返回摘要（而非完整内容）
 * 文件不存在或读取失败时返回错误信息
 */
export function passSpecToSubagent(specPath: string): string {
  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `## 错误: 无法读取 spec 文件\n\n路径: ${specPath}\n原因: ${message}`;
  }
}

/**
 * 读取 tasks.md 文件并返回摘要（而非完整内容）
 * 文件不存在或读取失败时返回错误信息
 */
export function passTasksToSubagent(tasksPath: string): string {
  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `## 错误: 无法读取 tasks 文件\n\n路径: ${tasksPath}\n原因: ${message}`;
  }
}
