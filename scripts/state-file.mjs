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
import { stringify, parse } from 'yaml';

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
  return stringify(state);
}

function fromYaml(content) {
  const state = parse(content);
  if (!state || typeof state !== 'object') {
    return { change: '', phase: '', updated: '', decisions: [] };
  }
  return {
    change: state.change || '',
    phase: state.phase || '',
    updated: state.updated || '',
    decisions: Array.isArray(state.decisions) ? state.decisions : [],
  };
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
