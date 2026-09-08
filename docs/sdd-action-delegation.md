# SDD Action 委托映射表

> 来源：[Claude Code SDD 工作流实践](https://juejin.cn/post/7619871928371183666)
> 作者：光辉GuangHui

## 委托关系总览

| SDD Action | 委托给 | 核心执行 | 产物 |
|------------|--------|----------|------|
| `sdd-doctor` | 无（SDD 自有逻辑） | 检查环境、skill 完整性、change 状态；双轨路由推荐 | 诊断报告 |
| `sdd-hotfix` | 无（SDD 自有逻辑 + systematic-debugging 精简版） | 入口判定/预估/定位(N轮升轨)/修复确认/最小修复+测试/提交 | `hotfix.md` 卡片 |
| `sdd-brainstorm` | `superpowers:brainstorming` | 前置：定位 change dir / 后置：brainstorm-reviewer 循环 | `brainstorm.md` + review |
| `sdd-propose` | `openspec-continue-change` | 前置：读 brainstorm / 后置：决策追溯检查 | `proposal.md` |
| `sdd-continue` | `openspec-continue-change` | 识别下一个缺失 artifact、格式校验；hotfix change 自动豁免 | 依赖链中下一个 artifact |
| `sdd-ff` | `openspec-ff-change` | 识别所有缺失 artifact、批量校验；hotfix change 自动豁免 | 所有缺失 artifact（至 `tasks.md`）|
| `sdd-plan` | `superpowers:writing-plans` | 前置：读 tasks+specs+design / 后置：plan-reviewer 循环；生成 test-cases.md、回写 functions.md 批次 | `plan.md` + `test-cases.md` + review |
| `sdd-code` | `superpowers:test-driven-development` + `superpowers:using-git-worktrees` + `superpowers:systematic-debugging` | 前置：读 plan 定位批次（三件套切片契约） / 后置：更新 tasks.md + 契约自检回填 | 代码 + 测试 + commits |
| `sdd-review-spec` | 无（派遣 subagent） | spec-reviewer 审查 | `reviews/spec-r<N>.md` |
| `sdd-review-code` | Phase 2: `superpowers:requesting-code-review` | Phase 1: spec-compliance 审查 | `reviews/code-*.md` |
| `sdd-verify` | `superpowers:verification-before-completion` + `openspec-verify-change` | 三向对齐（声明=实现=test-cases）+ 全量回归；hotfix 降级卡片摘要 | 验证报告 |
| `sdd-ship` | `openspec-sync-specs` + `openspec-archive-change` + `superpowers:finishing-a-development-branch` | 前置：最终验证 / 编排：三步顺序执行；hotfix 轻量归档豁免 | 归档 + specs 同步 |

## 三层技能模式

每个 SDD Action 遵循三层结构：

| 层次 | 所有者 | 职责 |
|------|--------|------|
| **前置逻辑** | SDD | 定位变更目录、读取制品、检查前置条件 |
| **核心执行** | 委托给 OpenSpec/Superpowers | 调用底层技能并附加覆盖指令 |
| **后置逻辑** | SDD | 审查循环、产物验证、下一步指引 |

## 制品依赖链

```
brainstorm.md（可选）→ proposal.md（必需）→ specs/（必需）
                                                → design.md（可选）
                                                    → tasks.md（必需）→ plan.md（可选）
```

## 技能来源分类

### Superpowers 技能

| 技能 | 用于 |
|------|------|
| `superpowers:brainstorming` | sdd-brainstorm |
| `superpowers:writing-plans` | sdd-plan |
| `superpowers:test-driven-development` | sdd-code, sdd-quick |
| `superpowers:using-git-worktrees` | sdd-code |
| `superpowers:systematic-debugging` | sdd-code |
| `superpowers:requesting-code-review` | sdd-review-code (Phase 2) |
| `superpowers:verification-before-completion` | sdd-verify |
| `superpowers:finishing-a-development-branch` | sdd-ship |

### OpenSpec 技能

| 技能 | 用于 |
|------|------|
| `openspec-continue-change` | sdd-propose, sdd-continue, sdd-quick |

> **双轨说明**（v0.4）：轻轨 = sdd-hotfix + sdd-quick（≤15 min 闭环，产物收敛）；重轨 = analyze（M/L 必需，产 functions.md 三图）→ plan（test-cases.md）→ code（契约切片编码）→ verify（三向对齐）→ ship。hotfix 卡片即终态，不进依赖链；sdd-quick 为轻量收敛版（精简 spec，track: quick）。
| `openspec-ff-change` | sdd-ff |
| `openspec-verify-change` | sdd-verify |
| `openspec-sync-specs` | sdd-ship |
| `openspec-archive-change` | sdd-ship |

### SDD 自有

| Action | 说明 |
|--------|------|
| `sdd-doctor` | 独立诊断，无底层委托 |
| `sdd-review-spec` | 派遣 subagent 审查 |
| `sdd-review-code` Phase 1 | SDD 自有 spec-compliance 审查 |
