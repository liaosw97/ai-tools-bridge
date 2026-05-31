import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function createTempDir() {
  return mkdtempSync(join(tmpdir(), 'sdd-test-'));
}

export function writeTempFile(dir, name, content) {
  const path = join(dir, name);
  writeFileSync(path, content, 'utf-8');
  return path;
}

export function cleanupTempDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}
