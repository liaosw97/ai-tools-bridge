import { describe, test, expect } from 'vitest';
import { resolveRoot, parseSkillFrontmatter } from '../setup.js';

function readSkillBody(skillName: string): string {
  const filePath = resolveRoot('skills', skillName, 'SKILL.md');
  return parseSkillFrontmatter(filePath).body;
}

describe('review loop configuration', () => {
  test('sdd-brainstorm post-logic mentions max 3 review rounds', () => {
    const body = readSkillBody('sdd-brainstorm');
    // 搜索"最多 3 轮"或等价表述
    const hasMax3 =
      body.includes('最多 3 轮') ||
      body.includes('最多3轮') ||
      body.includes('最多 3');
    expect(hasMax3, 'sdd-brainstorm missing "最多 3 轮" constraint').toBe(true);
  });

  test('sdd-plan post-logic mentions max 3 review rounds', () => {
    const body = readSkillBody('sdd-plan');
    const hasMax3 =
      body.includes('最多 3 轮') ||
      body.includes('最多3轮') ||
      body.includes('最多 3');
    expect(hasMax3, 'sdd-plan missing "最多 3 轮" constraint').toBe(true);
  });

  test('review artifacts follow reviews/<artifact>-r<N>.md naming', () => {
    const brainstormBody = readSkillBody('sdd-brainstorm');
    const planBody = readSkillBody('sdd-plan');
    // brainstorm 应引用 reviews/brainstorm-r<N>.md
    expect(brainstormBody).toContain('brainstorm-r');
    // plan 应引用 reviews/plan-r<N>.md
    expect(planBody).toContain('plan-r');
  });
});

describe('limits configuration', () => {
  test('sdd-quick mentions reading limits config from config.yaml', () => {
    const body = readSkillBody('sdd-quick');
    const hasLimitsConfig = body.includes('config.yaml') && body.includes('limits');
    expect(hasLimitsConfig, 'sdd-quick missing limits config reading instruction').toBe(true);
  });

  test('sdd-brainstorm mentions reading limits.review-rounds from config', () => {
    const body = readSkillBody('sdd-brainstorm');
    const hasReviewRounds = body.includes('limits') && body.includes('review-rounds');
    expect(hasReviewRounds, 'sdd-brainstorm missing review-rounds config reading').toBe(true);
  });

  test('sdd-plan mentions reading limits.review-rounds from config', () => {
    const body = readSkillBody('sdd-plan');
    const hasReviewRounds = body.includes('limits') && body.includes('review-rounds');
    expect(hasReviewRounds, 'sdd-plan missing review-rounds config reading').toBe(true);
  });

  test('sdd-doctor mentions limits configuration in diagnostic output', () => {
    const body = readSkillBody('sdd-doctor');
    const hasLimits = body.includes('limits') && body.includes('默认值');
    expect(hasLimits, 'sdd-doctor missing limits diagnostic section').toBe(true);
  });
});

describe('sdd-quick limit fallback', () => {
  test('sdd-quick has question limit fallback with user options', () => {
    const body = readSkillBody('sdd-quick');
    const hasFallback = body.includes('继续追问') && body.includes('标准路径');
    expect(hasFallback, 'sdd-quick missing question limit fallback options').toBe(true);
  });

  test('sdd-quick handles switch to standard path on limit', () => {
    const body = readSkillBody('sdd-quick');
    const hasSwitch = body.includes('sdd-propose') && body.includes('保留');
    expect(hasSwitch, 'sdd-quick missing standard path switch handling').toBe(true);
  });

  test('sdd-quick has scenario limit handling', () => {
    const body = readSkillBody('sdd-quick');
    const hasScenarioLimit = body.includes('quick-scenarios') && body.includes('停止');
    expect(hasScenarioLimit, 'sdd-quick missing scenario limit handling').toBe(true);
  });

  test('sdd-quick has task limit handling', () => {
    const body = readSkillBody('sdd-quick');
    const hasTaskLimit = body.includes('quick-tasks') && body.includes('停止');
    expect(hasTaskLimit, 'sdd-quick missing task limit handling').toBe(true);
  });
});

describe('discoverability hints', () => {
  const discoverabilityText = '可在 openspec/config.yaml 的 limits 节中调整上限';

  test('sdd-quick limit messages include discoverability hint', () => {
    const body = readSkillBody('sdd-quick');
    expect(body, 'sdd-quick missing discoverability hint').toContain(discoverabilityText);
  });

  test('sdd-brainstorm limit messages include discoverability hint', () => {
    const body = readSkillBody('sdd-brainstorm');
    expect(body, 'sdd-brainstorm missing discoverability hint').toContain(discoverabilityText);
  });

  test('sdd-plan limit messages include discoverability hint', () => {
    const body = readSkillBody('sdd-plan');
    expect(body, 'sdd-plan missing discoverability hint').toContain(discoverabilityText);
  });
});

describe('review limit fallback', () => {
  test('sdd-brainstorm has review limit fallback with user options', () => {
    const body = readSkillBody('sdd-brainstorm');
    const hasFallback = body.includes('继续修复') && body.includes('接受当前状态');
    expect(hasFallback, 'sdd-brainstorm missing review limit fallback').toBe(true);
  });

  test('sdd-plan has review limit fallback with user options', () => {
    const body = readSkillBody('sdd-plan');
    const hasFallback = body.includes('继续修复') && body.includes('接受当前状态');
    expect(hasFallback, 'sdd-plan missing review limit fallback').toBe(true);
  });
});
