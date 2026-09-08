# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

> **语言规则**: 所有对话输入及输出始终使用中文（简体）。

## 项目概述

这是一个 **Claude Code 插件** (`ai-tools-bridge` v0.4.0)，实现了 **SDD（规格驱动开发）工作流编排器**。项目由 Markdown 技能定义和 Vitest 结构验证测试组成。它定义了 Claude Code 作为斜杠命令加载的技能提示词。

该插件编排两个外部插件生态系统：
- **OpenSpec** — 规格/规范层（变更提案、规格、制品）
- **Superpowers** — 纪律层（头脑风暴、TDD、代码审查、调试等）

核心理念：**"行动而非阶段"** — 15 个行动各自独立。大型功能运行完整流程；小修复走轻轨（/sdd-hotfix）快速闭环，可跳过不必要的步骤。

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

### 共享模块机制

为减少 token 消耗和提高可维护性，SKILL.md 使用共享模块引用机制：

- **共享模块位置**：`skills/_shared/` 目录
- **引用语法**：`<!-- include: ../_shared/<module>.md -->`
- **包含的模块**：
  - `base-triggers.md` — 通用触发条件模板
  - `output-constraints.md` — 输出约束和零结果防护
  - `role-loading.md` — 角色加载逻辑
  - `breakdown-mode.md` — 拆分模式检测
  - `review-loop.md` — Review 循环模式

每个 SKILL.md 通过 include 引用共享模块，只保留差异内容，实现"公共逻辑改一处即可"的维护优势。

### 15 个行动及其委托

> 双轨制（v0.4）：轻轨 = sdd-hotfix（bug/小改调试轨，≤15 min，产物 hotfix.md 卡片）+ sdd-quick（小新功能轻量版）；重轨 = analyze（M/L 必需，functions.md 三图）→ plan（test-cases.md + 批次回写）→ code（契约切片编码）→ verify（三向对齐）→ ship（含 hotfix 轻量归档豁免）。hotfix 不进依赖链。

| 行动 | 委托给 |
|------|--------|
| `sdd-doctor` | 无（独立诊断 + 双轨路由） |
| `sdd-hotfix` | SDD 自有（调试定位精简版） |
| `sdd-brainstorm` | `superpowers:brainstorming` |
| `sdd-analyze` | SDD 自有（独立分析） |
| `sdd-propose` | `openspec-continue-change` |
| `sdd-continue` | `openspec-continue-change` |
| `sdd-ff` | `openspec-ff-change` |
| `sdd-plan` | `superpowers:writing-plans` |
| `sdd-code` | `superpowers:test-driven-development`、`superpowers:using-git-worktrees`、`superpowers:systematic-debugging` |
| `sdd-quick` | `openspec-continue-change`、`superpowers:test-driven-development`（轻量收敛版） |
| `sdd-review-spec` | SDD 自有子代理 |
| `sdd-review-code` | 阶段 1：SDD 子代理；阶段 2：`superpowers:requesting-code-review` |
| `sdd-test-code` | `superpowers:test-driven-development` |
| `sdd-verify` | `superpowers:verification-before-completion`、`openspec-verify-change` |
| `sdd-ship` | `openspec-sync-specs`、`openspec-archive-change`、`superpowers:finishing-a-development-branch` |

### OPSX 命令体系

ai-tools-bridge 的 OpenSpec 委托通过 OPSX 命令实现。OPSX 是 OpenSpec 的斜杠命令接口。

**核心命令**（默认可用）：`/opsx:propose`、`/opsx:explore`、`/opsx:apply`、`/opsx:archive`

**扩展命令**（需 `openspec config profile` 启用 workflows profile）：`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:sync`、`/opsx:bulk-archive`、`/opsx:onboard`

**启用方式**：
```bash
openspec config profile    # 选择 workflows
openspec update            # 生成命令文件 + skill 定义
```

执行后 `.claude/commands/opsx/` 下生成 11 个命令文件，`.claude/skills/` 下生成 OpenSpec skill 定义。

## 制品系统

### 依赖链

```
brainstorm.md（可选）→ proposal.md（必需）→ spec（必需，位于 specs/<domain>/）
                                              → design.md（可选）
                                              → functions.md（可选，sdd-analyze 产出）
                                                  → tasks.md（必需）→ plan.md（可选）
```

审查是独立制品，存储在 `reviews/` 中。

所有状态基于文件，存储在 `openspec/changes/<name>/` 下，使得在行动之间使用 `/clear` 是安全的。

### 关键约定

- **决策可追溯性**：`选择 [X] 而非 [Y]：[原因]（见 brainstorm.md §<决策标题>）`
- **规格链接**：任务通过 `[spec:domain#scenario]` 引用场景
- **审查循环**：最多 3 轮，按严重程度分级（critical/major/minor）
- **渐进采用**：从 5 个核心行动开始，逐步添加 review/brainstorm/verify 行动

### SDD 流程独立性

SDD 流程是独立的编排层，使用 SDD 时应忽略 OPSX 的建议。OPSX 命令是独立的工具，其"下一步建议"仅在直接使用 OPSX 时有效。

当使用 SDD 流程时，每个调用 OPSX 的 action（sdd-propose、sdd-continue、sdd-ff、sdd-verify、sdd-ship、sdd-quick）会在输出末尾显示 SDD 流程指引，请遵循该指引而非 OPSX 的建议。

### 误操作恢复

如果用户误执行了 OPSX 命令（如 `/opsx:apply`），可以通过以下方式回到 SDD 流程：
1. 执行 `/sdd-doctor` 检查当前状态
2. 执行 `/sdd-continue` 或 `/sdd-ff` 继续 SDD 流程
3. OPSX 生成的 artifact 与 SDD 兼容（都使用 `openspec/changes/<name>/` 目录）

## 文件映射

- `skills/sdd-*/SKILL.md` — 技能定义（YAML 前置元数据 + 提示词内容）
- `skills/sdd-*/*-reviewer-prompt.md` — 子代理审查提示词
- `schemas/sdd/schema.yaml` — 制品定义、行动定义、依赖链、内容约束
- `schemas/sdd/templates/` — 8 个制品模板（brainstorm、proposal、spec、design、tasks、plan、review、backlog）
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

## 拆分模式

SDD 支持可选的**分层拆分模式**，用于处理复杂需求时将功能逐层细化。

### 触发方式

1. **参数触发**：在命令中添加 `--breakdown` 或 `-b` 参数
   ```
   /sdd-brainstorm --breakdown
   ```

2. **自然语言触发**：需求描述包含以下关键词
   - "拆分"、"分层"、"逐步探索"、"功能模块"

3. **配置覆盖**：在 `openspec/config.yaml` 中配置
   ```yaml
   breakdown:
     enabled: true          # 全局开关（默认 true）
     default-depth: 3       # 默认拆分深度（1-3）
     keywords:              # 自定义触发关键词
       - 拆分
       - 分层
   ```

### 拆分层级

| 层级 | 名称 | 说明 |
|------|------|------|
| L1 | 功能模块 | 顶层功能划分（如：用户管理、订单管理） |
| L2 | 功能单元 | 模块下的功能分组（如：用户列表、用户创建） |
| L3 | 功能点 | 最小功能粒度（如：分页、筛选、导出） |

### 交互流程

1. **L1 模块拆分**：AI 提议功能模块列表，用户确认
2. **L2 单元拆分**：对每个模块进行细化，**即时追问**细节
3. **L3 功能点拆分**：仅当功能单元包含 >3 个独立操作时继续拆分

### 功能树产出

拆分完成后，brainstorm.md 中会包含结构化的功能树：

```markdown
## 功能拆分

- 用户管理模块
  - 用户列表
    - 分页功能
    - 筛选功能
  - 用户创建
    - 基本信息录入
    - 头像上传
```

plan.md 任务会带有 `[unit:模块/单元/功能点]` 标注。

### 目录冲突检测

在 sdd-code 阶段创建文件前，会扫描项目中已存在的目录：

- 相似度阈值：>60%（名称关键词 Jaccard 相似度）
- 发现冲突时暂停，询问用户是扩展还是新建

## 角色系统

SDD action 支持角色视角切换，为不同阶段提供专业视角。

### 目录结构

```
ai-tools-bridge/roles/
  planning/
    yc-office-hours.md
    ceo.md
    eng-manager.md
    designer.md
  execution/
    developer.md
  review/
    staff-engineer.md
    qa-lead.md
    cso.md
  release/
    release-engineer.md
    sre.md
```

### 角色定义格式

每个 role 文件包含 5 要素：
- 身份（Who）
- 专业视角（Perspective）
- 强制问题（Forcing Questions）
- 输出格式（Output Format）
- 触发条件（Trigger）— YAML frontmatter

### 加载流程

1. 检查 `--role` 参数
2. 检查会话级角色 (`/sdd-role` 设置)
3. 使用 action 默认角色
4. 按优先级合并：用户级 > 项目级 > 内置
