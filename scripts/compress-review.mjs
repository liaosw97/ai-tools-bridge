#!/usr/bin/env node
/**
 * compress-review.mjs — 压缩 review 上下文
 *
 * 用法: node scripts/compress-review.mjs <diff-file> <spec-file>
 * 输出: "变更文件: [...]" 后跟 "匹配场景: [...]"
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (args.length < 2 || args.includes('--help')) {
  console.error('用法: node scripts/compress-review.mjs <diff-file> <spec-file>');
  process.exit(1);
}

const diffPath = resolve(args[0]);
const specPath = resolve(args[1]);

let diffContent;
try {
  diffContent = readFileSync(diffPath, 'utf-8');
} catch {
  console.error(`错误: 无法读取 diff 文件 ${diffPath}`);
  process.exit(1);
}

if (!existsSync(specPath)) {
  console.error(`错误: spec 文件不存在 ${specPath}`);
  process.exit(1);
}

const specContent = readFileSync(specPath, 'utf-8');

// 解析 diff 中的变更文件
const changedFiles = [];
const fileRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
let match;
while ((match = fileRegex.exec(diffContent)) !== null) {
  changedFiles.push(match[2]);
}

// 检查 diff 是否为空
if (changedFiles.length === 0 && !diffContent.includes('+') && !diffContent.includes('-')) {
  console.log('变更文件: 无变更');
  console.log('匹配场景: 无');
  process.exit(0);
}

// 提取 spec 场景
const scenarios = [];
const scenarioRegex = /###\s*(?:场景|Scenario):\s*(.+?)(?:\s*\[.*?\])?\s*\n([\s\S]*?)(?=###|$)/g;
while ((match = scenarioRegex.exec(specContent)) !== null) {
  scenarios.push({ name: match[1].trim(), block: match[2] });
}

if (scenarios.length === 0) {
  console.log('变更文件:');
  for (const f of changedFiles) console.log(`  - ${f}`);
  console.log('匹配场景: 无匹配场景');
  process.exit(0);
}

// 匹配变更文件与场景
const diffLower = diffContent.toLowerCase();
const matched = scenarios.filter(s => {
  const nameLower = s.name.toLowerCase();
  const blockLower = (s.block || '').toLowerCase();
  // 场景名或场景块包含变更文件名（完整标识符匹配）
  const nameMatchesFile = changedFiles.some(f => {
    const stem = f.split('/').pop().replace(/\.\w+$/, '').toLowerCase();
    // 英文标识符用单词边界匹配，中文用直接包含
    if (/^[a-z]/.test(stem)) {
      const re = new RegExp(`(?<![a-z0-9_])${stem}(?![a-z0-9_])`);
      return re.test(nameLower) || re.test(blockLower);
    }
    return nameLower.includes(stem) || blockLower.includes(stem);
  });
  // diff 内容包含场景名中文关键词（至少 2 个字符）
  const nameKeywords = nameLower.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const diffMatchesName = nameKeywords.some(kw => diffLower.includes(kw));
  return nameMatchesFile || diffMatchesName;
});

// 输出
console.log('变更文件:');
if (changedFiles.length === 0) {
  console.log('  (diff 中未识别到文件变更)');
} else {
  for (const f of changedFiles) console.log(`  - ${f}`);
}

console.log('匹配场景:');
if (matched.length === 0) {
  console.log('  无匹配场景');
} else {
  for (const s of matched) console.log(`  - 场景: ${s.name}`);
}
