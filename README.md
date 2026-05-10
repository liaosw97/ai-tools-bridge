# AI Tools Bridge — SDD 工作流编排器

基于 Action-based 架构，串联 OpenSpec（规格层）与 Superpowers（纪律层），实现 Spec-Driven Development。

## 核心理念

**Action Not Phases** — 每个操作是独立能力，不是必须按顺序完成的阶段。大特性走完整流程，小修复跳过不必要的步骤。

**薄编排** — SDD skill 只做编排，核心工作委托给底层 skill。不修改 OpenSpec 或 Superpowers 的任何文件。

**产物接力** — 每个 action 的输出是下一个 action 的输入，所有状态持久化为文件。任意步骤之间可以安全 `/clear`。

## 11 个 Action

```
sdd-doctor       — 环境诊断
sdd-brainstorm   — 深度探索设计
sdd-propose      — 固化提案
sdd-continue     — 逐步补充 artifact
sdd-ff           — 快进生成所有文档
sdd-plan         — 细化实施计划
sdd-code         — TDD 实施
sdd-review-spec  — Spec 审查
sdd-review-code  — 代码审查（双阶段）
sdd-verify       — 全面验证
sdd-ship         — 归档合并
```

### 依赖关系

依赖是 enabler（前置 artifact 应存在），不是 gate（缺失则阻断）。

```
brainstorm.md → proposal.md → specs/ → tasks.md → plan.md
  (可选)          (必需)    ↗  (必需)     (必需)
                           proposal.md
                              ↓
                          design.md
                           (可选)
```

### Next Action 引导

| 完成后 | 推荐下一步 |
|-------|-----------|
| sdd-brainstorm | sdd-propose 或 sdd-ff |
| sdd-propose | sdd-continue 或 sdd-ff |
| sdd-ff | sdd-review-spec 或 sdd-plan |
| sdd-plan | sdd-code |
| sdd-code | sdd-review-code |
| sdd-review-code | sdd-code 或 sdd-verify |
| sdd-verify | sdd-ship 或 sdd-code |
| sdd-ship | 完成 |

## 典型流程

### 大特性（完整流程）

```
/sdd-brainstorm     → /clear
/sdd-ff             → /clear
/sdd-review-spec    → /clear
/sdd-plan           → /clear
/sdd-code           → /clear
/sdd-review-code    → /clear
/sdd-verify         → /clear
/sdd-ship
```

### 小修复（最短路径）

```
/sdd-propose → /clear → /sdd-ff → /clear → /sdd-plan → /clear → /sdd-code → /clear → /sdd-ship
```

## 三段式架构

每个 action skill 遵循统一结构：

| 阶段 | 执行方 | 职责 |
|------|--------|------|
| 前置逻辑 | SDD 自有 | 定位 change 目录、读取 artifact、检查前置条件 |
| 核心执行 | invoke 底层 skill | 委托给 OpenSpec 或 Superpowers |
| 后置逻辑 | SDD 自有 | Review 循环、产物校验、下一步引导 |

### 委托关系

| SDD Action | 委托给 |
|------------|--------|
| sdd-brainstorm | superpowers:brainstorming |
| sdd-propose | openspec-continue-change |
| sdd-continue | openspec-continue-change |
| sdd-ff | openspec-ff-change |
| sdd-plan | superpowers:writing-plans |
| sdd-code | superpowers:TDD + worktrees + debugging |
| sdd-review-code (Phase 2) | superpowers:requesting-code-review |
| sdd-verify | superpowers:verification + openspec-verify |
| sdd-ship | openspec-sync-specs + archive + superpowers:finishing-branch |

## Review 机制

**内嵌 Review**（action 内部）：
- sdd-brainstorm → brainstorm-reviewer（方案完整性、YAGNI）
- sdd-plan → plan-reviewer（任务粒度、TDD 完整性）

**独立 Review**（可选 action）：
- sdd-review-spec → spec-reviewer
- sdd-review-code → 双阶段：spec 合规 → 代码质量

## 信息防丢

- 模板的"决策追溯"必填节 — proposal/design 必须引用 brainstorm 的关键决策
- 后置逻辑自动检查 — 确保没有遗漏的决策引用

## 渐进采用

不需要一次性使用全部 11 个 action：

| 阶段 | Action | 建立的习惯 |
|------|--------|-----------|
| 第一阶段 | sdd-propose → sdd-ff → sdd-plan → sdd-code → sdd-ship | spec 驱动 + TDD |
| 第二阶段 | + sdd-review-spec + sdd-review-code | 审查纪律 |
| 第三阶段 | + sdd-brainstorm + sdd-verify | 完整工程纪律 |

## 前置依赖

| 工具 | 必需 | 作用 |
|------|------|------|
| [OpenSpec](https://github.com/nickmilo/OpenSpec) | 推荐 | 规格管理 |
| [Superpowers](https://github.com/obra/superpowers) | 推荐 | 执行纪律 |

两者都未安装时，sdd-doctor 会报告，部分 action 会降级。

## 安装

### 从 GitHub 安装

```bash
claude plugin add https://github.com/<your-username>/ai-tools-bridge
```

### 从本地安装

```bash
git clone https://github.com/<your-username>/ai-tools-bridge.git
claude plugin add /path/to/ai-tools-bridge
```

## 目录结构

```
ai-tools-bridge/
├── skills/
│   ├── sdd-doctor/            SKILL.md
│   ├── sdd-brainstorm/        SKILL.md + brainstorm-reviewer-prompt.md
│   ├── sdd-propose/           SKILL.md
│   ├── sdd-continue/          SKILL.md
│   ├── sdd-ff/                SKILL.md
│   ├── sdd-plan/              SKILL.md + plan-reviewer-prompt.md
│   ├── sdd-code/              SKILL.md
│   ├── sdd-review-spec/       SKILL.md + spec-reviewer-prompt.md
│   ├── sdd-review-code/       SKILL.md + spec-compliance-reviewer-prompt.md
│   │                                  + code-quality-reviewer-prompt.md
│   ├── sdd-verify/            SKILL.md
│   └── sdd-ship/              SKILL.md
├── schemas/
│   └── sdd/
│       ├── schema.yaml        # artifact 定义、依赖链
│       └── templates/         # 7 个 artifact 模板
├── guidelines/
│   ├── quality-checkpoints.md
│   ├── decision-strategy.md
│   ├── token-optimization.md
│   └── team-standards.md
├── integrations/
│   └── tool-template.md
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
└── README.md
```

## 接入新工具

1. 复制 `integrations/tool-template.md` 作为模板
2. 定义 action 映射、输入输出、Override 需求
3. 更新对应 action 的 SKILL.md
4. 更新 sdd-doctor 的检测逻辑

## 核心哲学

> 用结构消除歧义，用纪律保证质量，用归档积累智慧。
