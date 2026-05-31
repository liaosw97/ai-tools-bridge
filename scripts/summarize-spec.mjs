#!/usr/bin/env node
/**
 * summarize-spec.mjs — 从 spec 文件中提取场景摘要
 *
 * 用法: node scripts/summarize-spec.mjs <spec-file>
 * 输出: 每行 "场景: <name>" 后跟 GIVEN/WHEN/THEN 缩进行
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.error('用法: node scripts/summarize-spec.mjs <spec-file>');
  process.exit(1);
}

const specPath = resolve(args[0]);
let content;
try {
  content = readFileSync(specPath, 'utf-8');
} catch {
  console.error(`错误: 无法读取文件 ${specPath}`);
  process.exit(1);
}

// 提取场景: 匹配 ### 场景: 或 ### Scenario:
const scenarioBlocks = [];
const blockRegex = /###\s*(?:场景|Scenario):\s*(.+?)(?:\s*\[.*?\])?\s*\n([\s\S]*?)(?=###|$)/g;
let match;
while ((match = blockRegex.exec(content)) !== null) {
  const name = match[1].trim();
  const block = match[2];

  const givenMatch = block.match(/(?:GIVEN)\s+(.+)/i);
  const whenMatch = block.match(/(?:WHEN)\s+(.+)/i);
  const thenMatch = block.match(/(?:THEN)\s+(.+)/i);

  scenarioBlocks.push({
    name,
    given: givenMatch ? givenMatch[1].trim() : null,
    when: whenMatch ? whenMatch[1].trim() : null,
    then: thenMatch ? thenMatch[1].trim() : null,
  });
}

if (scenarioBlocks.length === 0) {
  console.log('无场景');
  process.exit(0);
}

const lines = [];
for (const s of scenarioBlocks) {
  lines.push(`场景: ${s.name}`);
  if (s.given) lines.push(`  GIVEN: ${s.given}`);
  if (s.when) lines.push(`  WHEN: ${s.when}`);
  if (s.then) lines.push(`  THEN: ${s.then}`);
}

console.log(lines.join('\n'));
