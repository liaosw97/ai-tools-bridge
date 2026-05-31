#!/usr/bin/env node
/**
 * state-file.mjs — 管理 SDD 跨 action 状态文件
 *
 * 用法:
 *   node scripts/state-file.mjs create <change-dir> --phase <phase>
 *   node scripts/state-file.mjs read <change-dir>
 *   node scripts/state-file.mjs update <change-dir> --phase <phase>
 *
 * 输出: YAML 格式状态文件内容（read）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

const args = process.argv.slice(2);

function parseArgs(args) {
  const result = { command: null, changeDir: null, phase: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      result.phase = args[++i];
    } else if (args[i] === '--help') {
      result.help = true;
    } else if (!result.command) {
      result.command = args[i];
    } else if (!result.changeDir) {
      result.changeDir = args[i];
    }
  }
  return result;
}

function toYaml(state) {
  const lines = [];
  lines.push(`change: ${state.change}`);
  lines.push(`phase: ${state.phase}`);
  lines.push(`updated: ${state.updated}`);
  lines.push('decisions:');
  if (!state.decisions || state.decisions.length === 0) {
    lines.push('  []');
  } else {
    for (const d of state.decisions) {
      lines.push(`  - ${d}`);
    }
  }
  return lines.join('\n') + '\n';
}

function fromYaml(content) {
  const lines = content.split('\n');
  const state = { change: '', phase: '', updated: '', decisions: [] };
  let inDecisions = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('change:')) {
      state.change = trimmed.slice(7).trim();
    } else if (trimmed.startsWith('phase:')) {
      state.phase = trimmed.slice(6).trim();
    } else if (trimmed.startsWith('updated:')) {
      state.updated = trimmed.slice(8).trim();
    } else if (trimmed === 'decisions:') {
      inDecisions = true;
    } else if (inDecisions && trimmed.startsWith('- ')) {
      state.decisions.push(trimmed.slice(2).trim());
    } else if (inDecisions && trimmed === '[]') {
      // empty
    } else if (!trimmed.startsWith('-') && trimmed.includes(':')) {
      inDecisions = false;
    }
  }
  return state;
}

const parsed = parseArgs(args);

if (parsed.help || !parsed.command) {
  console.error('用法:');
  console.error('  state-file.mjs create <change-dir> --phase <phase>');
  console.error('  state-file.mjs read <change-dir>');
  console.error('  state-file.mjs update <change-dir> --phase <phase>');
  process.exit(parsed.help ? 0 : 1);
}

const stateFile = parsed.changeDir ? join(resolve(parsed.changeDir), 'state.yaml') : null;

switch (parsed.command) {
  case 'create': {
    if (!parsed.changeDir) {
      console.error('错误: 需要 change 目录路径');
      process.exit(1);
    }
    const changeName = parsed.changeDir.split(/[/\\]/).pop();
    const state = {
      change: changeName,
      phase: parsed.phase || 'init',
      updated: new Date().toISOString(),
      decisions: [],
    };
    mkdirSync(resolve(parsed.changeDir), { recursive: true });
    writeFileSync(stateFile, toYaml(state), 'utf-8');
    console.log(`状态文件已创建: ${stateFile}`);
    break;
  }

  case 'read': {
    if (!parsed.changeDir) {
      console.error('错误: 需要 change 目录路径');
      process.exit(1);
    }
    if (!existsSync(stateFile)) {
      console.error(`错误: 状态文件不存在 ${stateFile}`);
      process.exit(1);
    }
    const content = readFileSync(stateFile, 'utf-8');
    console.log(content);
    break;
  }

  case 'update': {
    if (!parsed.changeDir) {
      console.error('错误: 需要 change 目录路径');
      process.exit(1);
    }
    if (!existsSync(stateFile)) {
      console.error(`错误: 状态文件不存在 ${stateFile}`);
      process.exit(1);
    }
    const content = readFileSync(stateFile, 'utf-8');
    const state = fromYaml(content);
    if (parsed.phase) state.phase = parsed.phase;
    state.updated = new Date().toISOString();
    writeFileSync(stateFile, toYaml(state), 'utf-8');
    console.log(`状态已更新: phase=${state.phase}`);
    break;
  }

  default:
    console.error(`错误: 未知命令 '${parsed.command}'`);
    process.exit(1);
}
