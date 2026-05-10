# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

> **语言规则**: 所有对话输入及输出始终使用中文（简体）。

## 项目概述

这是一个 **Claude Code 插件** (`ai-tools-bridge` v0.2.0)，实现了 **SDD（规格驱动开发）工作流编排器**。整个项目由纯 Markdown 组成——没有可执行代码、没有构建系统、没有测试。它定义了 Claude Code 作为斜杠命令加载的技能提示词。

该插件编排两个外部插件生态系统：
- **OpenSpec** — 规格/规范层（变更提案、规格、制品）
- **Superpowers** — 纪律层（头脑风暴、TDD、代码审查、调试等）

核心理念：**"行动而非阶段"** — 11 个行动各自独立。大型功能运行完整流程；小修复可跳过不必要的步骤。

## 架构

### 三层技能模式

每个 SKILL.md 遵循三个部分：

| 层次 | 所有者 | 职责 |
|------|--------|------|
| **前置逻辑** | SDD | 定位变更目录、读取制品、检查前置条件 |
| **核心执行** | 委托给 OpenSpec/Superpowers | 调用底层技能并附加覆盖指令 |
| **后置逻辑** | SDD | 审查循环、制品验证、下一步指引 |

### 覆盖机制

委托底层技能时，SDD 传递优先级更高的**覆盖指令**：
1. 输出到 `openspec/changes/<name>/`（非默认位置）
2. 使用 SDD 自有模板（`schemas/sdd/templates/`）
3. 完成后停止——不自动链式调用其他技能
4. SDD 自行处理审查（跳过内置审查器）

### 11 个行动及其委托

| 行动 | 委托给 |
|------|--------|
| `sdd-doctor` | 无（独立诊断） |
| `sdd-brainstorm` | `superpowers:brainstorming` |
| `sdd-propose` | `openspec-continue-change` / `openspec-propose` |
| `sdd-continue` | `openspec-continue-change` |
| `sdd-ff` | `openspec-ff-change` |
| `sdd-plan` | `superpowers:writing-plans` |
| `sdd-code` | `superpowers:test-driven-development`、`using-git-worktrees`、`systematic-debugging` |
| `sdd-review-spec` | SDD 自有子代理 |
| `sdd-review-code` | 阶段 1：SDD 子代理；阶段 2：`superpowers:requesting-code-review` |
| `sdd-verify` | `superpowers:verification-before-completion`、`openspec-verify-change` |
| `sdd-ship` | `openspec-sync-specs`、`openspec-archive-change`、`superpowers:finishing-a-development-branch` |

## 制品系统

### 依赖链

```
brainstorm.md（可选）→ proposal.md（必需）→ spec（必需，位于 specs/<domain>/）
                                              → design.md（可选）
                                                  → tasks.md（必需）→ plan.md（可选）
```

审查是独立制品，存储在 `reviews/` 中。

所有状态基于文件，存储在 `openspec/changes/<name>/` 下，使得在行动之间使用 `/clear` 是安全的。

### 关键约定

- **决策可追溯性**：`选择 [X] 而非 [Y]：[原因]（见 brainstorm.md §<决策标题>）`
- **规格链接**：任务通过 `[spec:domain#scenario]` 引用场景
- **审查循环**：最多 3 轮，按严重程度分级（critical/major/minor）
- **渐进采用**：从 5 个核心行动开始，逐步添加 review/brainstorm/verify 行动

## 文件映射

- `skills/sdd-*/SKILL.md` — 技能定义（YAML 前置元数据 + 提示词内容）
- `skills/sdd-*/*-reviewer-prompt.md` — 子代理审查提示词
- `schemas/sdd/schema.yaml` — 制品定义、依赖链、内容约束
- `schemas/sdd/templates/` — 7 个制品模板（brainstorm、proposal、spec、design、tasks、plan、review）
- `guidelines/` — 决策策略、质量检查点、团队标准、Token 优化
- `integrations/tool-template.md` — 将新 AI 工具集成到 SDD 的模板
- `.claude-plugin/plugin.json` — 插件元数据

## 会话记录导出

当用户要求导出或保存对话时，使用 `/export` 导出对话记录并保存到 `log/history/`。如果该目录不存在，则询问用户保存到哪个位置。

## 保存当前对话

当用户说「保存当前对话」时，将**完整的对话内容保存，不得遗漏**——包括每条用户消息、每条助手回复、每个工具调用及其结果——保存到 `log/plan/`。如果该目录不存在，则询问用户保存到哪个位置。

## 编辑约定

- 所有内容为 Markdown，技能注册使用 YAML 前置元数据
- 模板使用 HTML 注释占位符（`<!-- ... -->`）
- 规格场景使用 GIVEN/WHEN/THEN 格式，附带 ADDED/MODIFIED/REMOVED 增量标记
- Token 优化至关重要——指引规定每个行动后执行 `/clear` 并最小化上下文加载
