import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import { resolveRoot } from '../setup.js';

describe('plugin.json validity', () => {
  const pluginPath = resolveRoot('.claude-plugin', 'plugin.json');
  let plugin: Record<string, unknown>;

  test('plugin.json is valid JSON with required fields', () => {
    const content = fs.readFileSync(pluginPath, 'utf-8');
    plugin = JSON.parse(content);
    expect(plugin.name).toBe('ai-tools-bridge');
    expect(plugin).toHaveProperty('version');
    expect(plugin).toHaveProperty('author');
    expect((plugin.author as Record<string, unknown>).name).toBeDefined();
    expect(plugin).toHaveProperty('license');
  });

  test('version matches semver format', () => {
    const version = plugin!.version as string;
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('name is ai-tools-bridge', () => {
    expect(plugin!.name).toBe('ai-tools-bridge');
  });
});
