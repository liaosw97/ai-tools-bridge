#!/usr/bin/env node
/**
 * summarize-tasks.mjs — 从 tasks.md 中提取任务摘要
 *
 * 用法: node scripts/summarize-tasks.mjs <tasks-file>
 * 输出: "总数: N, 已完成: M, 待完成: K"
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.error('用法: node scripts/summarize-tasks.mjs <tasks-file>');
  process.exit(1);
}

const tasksPath = resolve(args[0]);
let content;
try {
  content = readFileSync(tasksPath, 'utf-8');
} catch {
  console.error(`错误: 无法读取文件 ${tasksPath}`);
  process.exit(1);
}

const lines = content.split('\n');
let total = 0;
let completed = 0;

for (const line of lines) {
  if (/^\s*-\s*\[x\]/i.test(line)) {
    total++;
    completed++;
  } else if (/^\s*-\s*\[\s*\]/.test(line)) {
    total++;
  }
}

const pending = total - completed;
console.log(`总数: ${total}, 已完成: ${completed}, 待完成: ${pending}`);
