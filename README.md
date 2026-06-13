# AI Tools Bridge — SDD 工作流编排器

**v0.3.1** — 通过 skill-audit 系统审计，无阻断问题。

基于 Action-based 架构，串联 OpenSpec（规格层）与 Superpowers（纪律层），实现 Spec-Driven Development。

## 核心理念

**Action Not Phases** — 每个操作是独立能力，不是必须按顺序完成的阶段。大特性走完整流程，小修复跳过不必要的步骤。

**薄编排** — SDD skill 只做编排，核心工作委托给底层 skill。不修改 OpenSpec 或 Superpowers 的任何文件。

**产物接力** — 每个 action 的输出是下一个 action 的输入，所有状态持久化为文件。任意步骤之间可以安全 `/clear`。

## 13 个 Action

**v0.3.1** — 通过 skill-audit 系统审计（50/50），新增角色系统、拆分模式、达限处理机制。

```
sdd-doctor       — 环境诊断 + 复杂度评估
sdd-brainstorm   — 深度探索设计
sdd-propose      — 固化提案
sdd-continue     — 逐步补充 artifact
sdd-ff           — 快进生成所有文档
sdd-plan         — 细化实施计划（支持分批生成）
sdd-code         — TDD 实施
sdd-quick        — 快速模式（简单需求一站式）
sdd-review-spec  — Spec 审查
sdd-review-code  — 代码审查（双阶段）
sdd-test-code    — 测试补全（基于审查报告）
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

每个 action 完成后自动输出 ★○△ 推荐操作列表。

| 完成后 | ★ 推荐 | ○ 可选 | △ 跳跃 |
|-------|--------|--------|--------|
| sdd-brainstorm | /sdd-propose | /sdd-continue, /sdd-ff | — |
| sdd-propose | /sdd-ff | /sdd-continue, /sdd-plan | /sdd-brainstorm |
| sdd-continue | /sdd-continue（下一个 artifact）或 /sdd-plan（已到 tasks） | /sdd-ff | — |
| sdd-ff | /sdd-plan 或 /sdd-code（按复杂度） | /sdd-review-spec | — |
| sdd-plan | /sdd-code | /sdd-review-spec | — |
| sdd-code | /sdd-review-code 或 /sdd-ship（按复杂度） | /sdd-verify | — |
| sdd-review-code | /sdd-test-code | /sdd-code | /sdd-ship |
| sdd-verify | /sdd-ship | /sdd-code | — |
| sdd-ship | 完成（无后续操作） | — | — |

## 典型流程

### 路径推荐（sdd-doctor 自动推荐）

运行 `/sdd-doctor` 自动评估变更复杂度并推荐路径：

| 复杂度 | 推荐路径 | 说明 |
|--------|---------|------|
| 简单(S) | `/sdd-quick` | 一站式：propose → spec → tasks → code |
| 中等(M) | `/sdd-propose` → `/sdd-ff` → `/sdd-plan` → `/sdd-code` | 可跳过 brainstorm |
| 复杂(L) | brainstorm → propose → ff → plan → code → review → verify → ship | 完整流程，建议分批 plan |

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

### SDD 流程 vs OPSX 命令

- **SDD 流程**：适合完整的开发周期，提供端到端的编排和质量保障
- **OPSX 命令**：适合独立使用 OpenSpec，不依赖 SDD 编排

使用 SDD 流程时，请忽略 OPSX 命令输出的"下一步建议"，遵循 SDD 的流程指引。每个调用 OPSX 的 SDD action 会在输出末尾显示 SDD 流程指引，请遵循该指引继续。

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
| sdd-brainstorm | `superpowers:brainstorming` |
| sdd-propose | `/opsx:propose` / `/opsx:continue` |
| sdd-continue | `/opsx:continue` |
| sdd-ff | `/opsx:ff` |
| sdd-plan | `superpowers:writing-plans` |
| sdd-code | `superpowers:test-driven-development` + `using-git-worktrees` + `systematic-debugging` |
| sdd-quick | `/opsx:continue` + `superpowers:test-driven-development` |
| sdd-review-spec | SDD 自有 subagent |
| sdd-review-code (Phase 1) | SDD 自有 subagent |
| sdd-review-code (Phase 2) | `superpowers:requesting-code-review` |
| sdd-test-code | `superpowers:test-driven-development` |
| sdd-verify | `superpowers:verification-before-completion` + `/opsx:verify` |
| sdd-ship | `/opsx:sync` + `/opsx:archive` + `superpowers:finishing-a-development-branch` |

## OPSX 命令体系

ai-tools-bridge 的 OpenSpec 委托通过 OPSX 命令实现。OPSX 是 OpenSpec 的斜杠命令接口，共 11 个命令。

### 核心命令（默认可用）

| 命令 | 功能 |
|------|------|
| `/opsx:propose` | 创建变更 + 一步生成所有规划 artifact |
| `/opsx:explore` | 苏格拉底式探索，不创建 artifact |
| `/opsx:apply` | 按 tasks.md 实施代码 |
| `/opsx:archive` | 归档完成的变更 |

### 扩展命令（需 `openspec config profile` 启用）

| 命令 | 功能 |
|------|------|
| `/opsx:new` | 仅创建变更骨架 |
| `/opsx:continue` | 按依赖链逐个生成 artifact |
| `/opsx:ff` | 快进生成所有规划 artifact |
| `/opsx:verify` | 验证实现与 artifact 一致性 |
| `/opsx:sync` | 合并 delta specs 到主 specs |
| `/opsx:bulk-archive` | 批量归档多个变更 |
| `/opsx:onboard` | 引导式教程 |

### 启用方式

```bash
openspec config profile    # 选择 workflows
openspec update            # 生成命令文件 + skill 定义
```

### SDD Action → OPSX 映射

| SDD Action | OPSX 命令 |
|------------|----------|
| sdd-propose | `/opsx:propose` 或 `/opsx:continue` |
| sdd-continue | `/opsx:continue` |
| sdd-ff | `/opsx:ff` |
| sdd-verify | `/opsx:verify` |
| sdd-ship | `/opsx:sync` + `/opsx:archive` |
| sdd-quick | `/opsx:continue` |

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

## 内联引用

sdd-quick 和 sdd-test-code 使用从外部 skills 项目提取的精简参考文档：

| Reference 文件 | 来源 | 用途 |
|---------------|------|------|
| `sdd-quick/reference-grill.md` | `ai-tools/skills/productivity/grill-me` | 苏格拉底式追问技巧 |
| `sdd-quick/reference-tdd-compact.md` | `ai-tools/skills/engineering/tdd` | TDD 核心流程精简版 |
| `sdd-test-code/reference-tdd-tests.md` | `ai-tools/skills/engineering/tdd/tests.md` | 好/坏测试判断标准 |
| `sdd-test-code/reference-tdd-mocking.md` | `ai-tools/skills/engineering/tdd/mocking.md` | 仅 mock 系统边界原则 |

## 渐进采用

不需要一次性使用全部 13 个 action：

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

### OpenSpec 配置

安装 OpenSpec 后，需要启用 OPSX 命令和生成 skill 定义：

```bash
cd <your-project>
openspec init                    # 初始化 OpenSpec
openspec config profile          # 选择 workflows（启用全部 11 个 OPSX 命令）
openspec update                  # 生成 OPSX 命令文件 + OpenSpec skill 定义
```

执行后：
- `.claude/commands/opsx/` 下生成 11 个 OPSX 命令文件
- `.claude/skills/` 下生成 OpenSpec skill 定义

详见下方 [OPSX 命令体系](#opsx-命令体系) 节。

## 安装

### 从 GitHub 市场（推荐）

将仓库添加为市场，然后安装插件：

```bash
# 1. 添加市场
/plugin marketplace add liaosw97/ai-tools-bridge

# 2. 安装插件（默认用户范围）
/plugin install ai-tools-bridge@ai-tools-bridge
```

安装范围选项：
- **用户范围**（默认）：所有项目可用
- **项目范围**：仅当前项目，写入 `.claude/settings.json`（团队共享）
- **本地范围**：仅当前项目自己使用

使用交互式 UI 选择范围：运行 `/plugin` → 发现选项卡 → 选中插件按 Enter。

### 从本地安装（开发用）

```bash
git clone https://github.com/liaosw97/ai-tools-bridge.git
/plugin marketplace add ./ai-tools-bridge
/plugin install ai-tools-bridge@ai-tools-bridge
```

### 安装后

运行 `/reload-plugins` 在不重启的情况下加载新插件。

### 管理插件

```bash
/plugin                    # 打开插件管理器（发现/已安装/市场选项卡）
/plugin disable ai-tools-bridge@ai-tools-bridge   # 禁用
/plugin enable ai-tools-bridge@ai-tools-bridge     # 启用
/plugin uninstall ai-tools-bridge@ai-tools-bridge  # 卸载
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
│   ├── sdd-quick/             SKILL.md + reference-grill.md + reference-tdd-compact.md
│   ├── sdd-review-spec/       SKILL.md + spec-reviewer-prompt.md
│   ├── sdd-review-code/       SKILL.md + spec-compliance-reviewer-prompt.md
│   │                                  + code-quality-reviewer-prompt.md
│   ├── sdd-test-code/         SKILL.md + reference-tdd-tests.md + reference-tdd-mocking.md
│   ├── sdd-verify/            SKILL.md
│   └── sdd-ship/              SKILL.md
├── schemas/
│   └── sdd/
│       ├── schema.yaml        # artifact 定义、依赖链
│       └── templates/         # 8 个 artifact 模板
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
