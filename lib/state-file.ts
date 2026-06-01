import { writeFileSync, readFileSync, existsSync } from 'fs';
import { stringify, parse } from 'yaml';

export interface StateFile {
  change: string;
  phase: string;
  decisions: string[];
}

const MAX_SIZE = 2048; // 字符（Token 优化：确保状态文件在 AI 上下文中占用最小空间）

/**
 * 创建初始状态文件
 */
export function createStateFile(changeName: string): StateFile {
  const state: StateFile = {
    change: changeName,
    phase: 'init',
    decisions: [],
  };

  return state;
}

/**
 * 更新状态文件（返回新对象，不修改原对象）
 */
export function updateStateFile(state: StateFile, action: string, decisions: string[]): StateFile {
  const newState: StateFile = {
    ...state,
    phase: action,
    decisions: [...state.decisions, ...decisions],
  };

  // 保持大小限制
  trimState(newState);
  return newState;
}

/**
 * 读取状态文件
 * 如果文件不存在或格式错误，返回 null
 */
export function readStateFile(path: string): StateFile | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const state = parse(content) as StateFile;

    // 验证必需字段
    if (!state.change || !state.phase || !Array.isArray(state.decisions)) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * 保存状态文件到磁盘
 */
export function saveStateFile(state: StateFile, path: string): void {
  trimState(state);
  writeFileSync(path, stringify(state), 'utf-8');
}

/**
 * 裁剪状态以保持大小限制（就地修改）
 */
function trimState(state: StateFile): void {
  let content = stringify(state);
  while (content.length > MAX_SIZE && state.decisions.length > 0) {
    state.decisions.shift();
    content = stringify(state);
  }
  if (content.length > MAX_SIZE) {
    console.warn(`警告: 状态文件超过 ${MAX_SIZE} 字符限制，已裁剪所有 decisions`);
  }
}
