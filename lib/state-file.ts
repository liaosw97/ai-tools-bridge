import { writeFileSync, readFileSync, existsSync } from 'fs';
import { stringify, parse } from 'yaml';

export interface StateFile {
  change: string;
  phase: string;
  decisions: string[];
}

const MAX_SIZE = 500; // 字符

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
 * 更新状态文件
 */
export function updateStateFile(state: StateFile, action: string, decisions: string[]): void {
  state.phase = action;
  state.decisions = [...state.decisions, ...decisions];

  // 保持大小限制
  trimState(state);
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
  const content = stringify(state);

  // 验证大小
  if (content.length > MAX_SIZE) {
    trimState(state);
  }

  writeFileSync(path, stringify(state), 'utf-8');
}

/**
 * 裁剪状态以保持大小限制
 */
function trimState(state: StateFile): void {
  while (true) {
    const content = stringify(state);
    if (content.length <= MAX_SIZE) {
      break;
    }

    // 移除最早的决策
    if (state.decisions.length > 0) {
      state.decisions.shift();
    } else {
      break;
    }
  }
}
