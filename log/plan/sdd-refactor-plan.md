# AI Tools Bridge - SDD 重构计划
> 保存时间: 2026-05-10
> 来源: 继续对话 @2026-05-10-022653-2026-05-10-004939-command-messageopsxexplorecomm.txt

---

## 用户请求

参考掘金文章 https://juejin.cn/post/7619871928371183666 的 SDD 方法论，优化当前 ai-tools-bridge 插件。

---

## 文章核心内容（SDD 实践：OpenSpec + Superpowers 整合创建自定义工作流）

### 1. 问题：AI 辅助开发缺什么

- 设计共识随对话消失（AI 长对话遗忘早期约束，/clear 后全部丢失）
- AI 有能力写代码但没有纪律维护工程质量（不会主动先写测试、不会系统定位 bug 根因）

两个工具分别解决：
- OpenSpec 管"写什么" — 结构化 artifact 管理变更
- Superpowers 管"怎么做" — 执行纪律约束 AI 行为

### 2. 核心理念

**Action Not Phases**
- 每个操作是独立能力（action），不是必须按顺序完成的阶段（phase）
- 依赖关系是 enabler（前置 artifact 应存在），不是 gate（缺失则阻断）
- 大特性可以走完整流程，小修复可以跳过 brainstorm 直接 sdd-propose

11 个 Action:
```
sdd-brainstorm   — 想深度探索设计
sdd-propose      — 想固化提案
sdd-ff           — 想快进生成所有规划文档
sdd-plan         — 想细化实施计划
sdd-code         — 想按 TDD 实施
sdd-continue     — 继续补充下一个 artifact
sdd-review-spec  — 想审查 spec 质量
sdd-review-code  — 想审查代码
sdd-verify       — 想全面验证
sdd-ship         — 想归档合并
sdd-doctor       — 环境诊断
```

**产物接力**
- 每个 action 的输出是下一个 action 的输入
- 所有中间状态持久化为文件
- 任意步骤之间可以安全 /clear
- 每个 action 是"无状态"的——只读取文件，不依赖对话记忆

**不修改底层工具**
- SDD 是编排层，不修改 OpenSpec 或 Superpowers 的任何原有文件

### 3. 薄编排架构

用户只认识 sdd-*，不需要知道 OpenSpec 或 Superpowers 的存在。
SDD 保留编排权，底层 skill 做核心工作。

```
用户 ──→ sdd-* skills（唯一入口）
             │
             ├── invoke → Superpowers skills（brainstorming / TDD / debugging...）
             ├── invoke → OpenSpec skills（continue-change / ff-change / verify...）
             └── SDD 自有逻辑（前置检查 / review 循环 / 产物校验）
```

**统一三段式结构：**

| 阶段 | 执行方 | 职责 |
|------|--------|------|
| 前置逻辑 | SDD 自有 | 定位 change 目录、读取已有 artifact、检查前置条件 |
| 核心执行 | invoke 底层 skill | 核心工作交给 OpenSpec 或 Superpowers |
| 后置逻辑 | SDD 自有 | review 循环、产物格式校验、下一步引导 |

**Override 机制：**

| 被调用 Skill | Override 什么 | 保留什么 |
|-------------|---------------|---------|
| superpowers:brainstorming | 输出位置、模板格式、禁止转入 writing-plans、跳过内置 reviewer | 苏格拉底式提问、方案探索、分段确认 |
| superpowers:writing-plans | 输出位置、模板格式、禁止转入 executing-plans、跳过内置 reviewer | 2-5 分钟粒度、TDD 步骤结构 |
| superpowers:using-git-worktrees | 分支命名为 `sdd/<change-name>` | 安全验证、基线测试 |

其余 skills（TDD、debugging、code-review、verification 等）的核心纪律全部保留，无需 Override。

### 4. 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│              SDD Action Skills（编排层）                       │
│  sdd-brainstorm  sdd-propose  sdd-ff  sdd-plan  sdd-code   │
│  sdd-continue  sdd-review-spec  sdd-review-code             │
│  sdd-verify  sdd-ship  sdd-doctor                           │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
    ┌───────────▼───────────┐  ┌───────▼──────────────────────┐
    │   Superpowers（纪律层） │  │   OpenSpec（规格层）           │
    │  brainstorming         │  │  Schema / 模板系统            │
    │  writing-plans         │  │  continue-change / ff-change │
    │  test-driven-development│  │  verify-change / archive     │
    │  systematic-debugging  │  │  sync-specs                  │
    │  requesting-code-review│  │  Delta Spec 格式             │
    │  using-git-worktrees   │  │                              │
    │  verification          │  │                              │
    │  finishing-branch      │  │                              │
    └────────────────────────┘  └──────────────────────────────┘
```

**委托关系全景：**

| SDD Action | 委托给 | SDD 自有逻辑 | 产物 |
|------------|--------|-------------|------|
| sdd-doctor | 无 | 检查环境、skill 完整性、change 状态 | 诊断报告 |
| sdd-brainstorm | superpowers:brainstorming | 前置：定位 change dir / 后置：brainstorm-reviewer 循环 | brainstorm.md + review |
| sdd-propose | openspec-continue-change | 前置：读 brainstorm / 后置：决策追溯检查 | proposal.md |
| sdd-continue | openspec-continue-change | 识别下一个缺失 artifact、格式校验 | 依赖链中下一个 artifact |
| sdd-ff | openspec-ff-change | 识别所有缺失 artifact、批量校验 | 所有缺失 artifact（至 tasks.md） |
| sdd-plan | superpowers:writing-plans | 前置：读 tasks+specs+design / 后置：plan-reviewer 循环 | plan.md + review |
| sdd-code | superpowers:TDD + worktrees + debugging | 前置：读 plan 定位批次 / 后置：更新 tasks.md | 代码 + 测试 + commits |
| sdd-review-spec | 无（派遣 subagent） | spec-reviewer 审查 | reviews/spec-r<N>.md |
| sdd-review-code | Phase 2: superpowers:requesting-code-review | Phase 1: spec-compliance 审查 | reviews/code-*.md |
| sdd-verify | superpowers:verification + openspec-verify | 逐条 scenario 覆盖率统计 | 验证报告 |
| sdd-ship | openspec-sync-specs + archive + superpowers:finishing-branch | 前置：最终验证 / 编排：三步顺序执行 | 归档 + specs 同步 |

### 5. Artifact 依赖链与模板

```
brainstorm.md ──→ proposal.md ──→ specs/ ──→ tasks.md ──→ plan.md
  (可选)            (必需)     ↗   (必需)      (必需)
                            proposal.md
                               ↓
                           design.md
                            (可选)
```

**必需 artifact：** proposal.md、specs/、tasks.md — spec 流程的骨架

**可选 artifact：** brainstorm.md（需求已明确时跳过）、design.md（简单变更不需要）、plan.md（紧急修复可直接实施）

关键设计：tasks.md 不硬依赖 design.md，简单变更可以从 specs 直接出 tasks。plan.md 由 sdd-plan 单独生成（而非 sdd-ff 一并生成），确保 plan 质量由 Superpowers 的 writing-plans 纪律保障。

**tasks.md 与 plan.md 的分工：**

| | tasks.md（做什么） | plan.md（怎么做） |
|--|-------------------|------------------|
| 归属 | OpenSpec 产物 | Superpowers 产物 |
| 约束 | schema 模板 | writing-plans 纪律 |
| 格式 | checkbox + spec 链接 | 文件路径 + 测试代码 + 运行命令 |
| 粒度 | spec requirement 级 | 2-5 分钟工程师操作级 |

tasks.md 中的一条：
```
- [ ] 1.1 实现主题切换 API [spec:ui-theme#toggle-theme]
```

plan.md 中的对应展开：
```
#### Task 1.1：实现主题切换 API [spec:ui-theme#toggle-theme]
- **文件**：`src/theme/ThemeProvider.ts` (Create)
- **RED**：编写失败测试
  test('toggleTheme switches from light to dark', () => { ... })
- **运行验证失败**：`npm test -- --filter "toggleTheme"`
- **GREEN**：最小实现
- **运行验证通过**：`npm test -- --filter "toggleTheme"`
```

**Schema 与模板：**

Schema（openspec/schemas/sdd/schema.yaml）只管内容约束——产物里应该有什么——不管流程编排——谁来做、怎么做。

7 个模板文件（位于 openspec/schemas/sdd/templates/）：

| 模板元素 | 生产方 | 消费方 |
|---------|--------|--------|
| spec GIVEN/WHEN/THEN 场景 | spec.md 模板要求可测试断言 | sdd-code 将场景翻译为测试 |
| tasks [spec:domain#scenario] 链接 | tasks.md 模板格式 | sdd-code 定位对应场景 |
| proposal/design "决策追溯"节 | 模板必填节 | sdd-review-spec 验证完整性 |

### 6. Review 机制

**内嵌 Review**（action 内部的质量保证，不是独立步骤）：

| 所在 Action | Reviewer | 检查焦点 |
|------------|----------|---------|
| sdd-brainstorm | brainstorm-reviewer | 方案完整性、决策清晰度、YAGNI |
| sdd-plan | plan-reviewer | 任务粒度、TDD 步骤完整性、spec 对齐 |

内嵌 review 不违反"Action Not Phases"——它是 action 内部的质量保证机制。

**独立 Review**（可选 action，按需触发）：

| Action | Reviewer | 推荐场景 |
|--------|----------|---------|
| sdd-review-spec | spec-reviewer | 大特性在实施前推荐执行 |
| sdd-review-code | spec-compliance + code-quality（双阶段） | 每批次实施后 |

**双阶段代码审查：**

sdd-review-code 分两阶段执行：

1. Phase 1：Spec 合规审查（SDD 自有逻辑，dispatch subagent）—— 代码是否实现了 spec 中的场景
2. Phase 2：代码质量审查（invoke superpowers:requesting-code-review）—— 可读性、设计模式、潜在问题

Phase 1 必须通过后才进入 Phase 2。理由：如果代码没有实现 spec 要求的功能，讨论代码质量毫无意义。先确认"做对了"，再讨论"做好了"。

所有 review 产物写入 reviews/ 目录，命名格式 `<artifact>-r<round>.md`。

### 7. 信息丢失防护

长文档链路中的信息丢失是真实风险。brainstorm.md 中的关键约束，到 plan.md 生成时可能已不可见（中间经过多次 /clear）。

**第一层：模板的"决策追溯"必填节。** proposal.md 和 design.md 模板均要求显式引用 brainstorm 中的关键决策：

```
## 决策追溯
<!-- 必填：引用 brainstorm.md 中的关键决策 -->
- 选择 [X] 而非 [Y]：[原因]（见 brainstorm.md §关键决策）
- 约束 [Z]：[来源]（见 brainstorm.md §约束分析）
```

**第二层：后置逻辑的自动检查。** sdd-propose 的后置逻辑会验证 proposal 是否引用了 brainstorm 中的所有关键决策。sdd-review-spec 也会检查决策追溯的完整性作为兜底。

信息沿依赖链向下传递：brainstorm → proposal（决策追溯）→ specs（需求场景）→ tasks（spec 链接）→ plan（保留 spec 链接）。每一环都有显式引用，不靠对话记忆。

### 8. 上下文卫生

AI 辅助开发的一大挑战是对话上下文膨胀。SDD 的解法是持久化一切，然后安心清空。

每个 action 完成时都会输出：
> "本 action 已完成，产物已持久化至 `<path>`。如需释放上下文，可安全 /clear。"

使用建议：
- 每个 action 完成后 /clear — 这是核心习惯，不是可选操作
- 看到完成提示中的文件路径就可以 /clear — 产物在文件系统中，对话历史是不可靠的状态存储
- 不要在 action 中途 /clear — 每个 action 设计为原子操作

三个 action 包含交互式流程，不适合中途清空：sdd-brainstorm（多轮对话 + review 循环）、sdd-plan（可能需要 review 循环）、sdd-code（单批次内的 TDD 循环）。

### 9. 完整工作流

**大特性标准路径：**

```
# 步骤 1：深度探索设计
sdd-brainstorm
  → brainstorm.md + reviews/brainstorm-r1.md
/clear

# 步骤 2：快进生成所有规划文档
sdd-ff
  → proposal.md + specs/ + design.md + tasks.md
/clear

# 步骤 3：审查 spec 质量（大特性推荐）
sdd-review-spec
  → reviews/spec-r1.md
/clear

# 步骤 4：细化实施计划
sdd-plan
  → plan.md + reviews/plan-r1.md
/clear

# 步骤 5-8：按批次 TDD 实施 + 代码审查
sdd-code          # 批次一
/clear
sdd-review-code   # 审查批次一
/clear
sdd-code          # 批次二
/clear
sdd-review-code   # 审查批次二
/clear

# 步骤 9：全面验证
sdd-verify
/clear

# 步骤 10：归档合并
sdd-ship
```

**小修复最短路径：**

```
sdd-propose  → /clear → sdd-ff → /clear → sdd-plan → /clear → sdd-code → /clear → sdd-ship
```

跳过 brainstorm（需求已明确）、跳过 spec review（改动小）、跳过独立 verify（ship 内置验证）。

**Next Action 引导：**

| 当前 Action | 推荐下一步 |
|------------|-----------|
| sdd-brainstorm | 逐步确认 → sdd-propose；需求充分 → sdd-ff |
| sdd-propose | 逐步确认 → sdd-continue；需求充分 → sdd-ff |
| sdd-continue | 继续 → sdd-continue；快进 → sdd-ff；到 tasks → sdd-plan |
| sdd-ff | 大特性 → sdd-review-spec；小修复 → sdd-plan |
| sdd-review-spec | Approved → sdd-plan；Issues → 修正后再审 |
| sdd-plan | sdd-code 开始实施 |
| sdd-code | sdd-review-code 审查本批次 |
| sdd-review-code | 有更多批次 → sdd-code；全完成 → sdd-verify |
| sdd-verify | Pass → sdd-ship；Fail → sdd-code 补充 |
| sdd-ship | 本轮完成 |

### 10. 渐进采用策略

不需要一次性使用全部 11 个 action。分阶段引入：

| 阶段 | 使用的 Action | 建立的习惯 |
|------|-------------|-----------|
| 第一阶段 | sdd-propose → sdd-ff → sdd-plan → sdd-code → sdd-ship | spec 驱动 + TDD |
| 第二阶段 | + sdd-review-spec + sdd-review-code | 审查纪律 |
| 第三阶段 | + sdd-brainstorm + sdd-verify | 完整工程纪律 |

每个阶段都能独立提供价值。

### 11. 目录结构

```
openspec/
├── config.yaml                     # 项目配置（默认 schema: sdd）
├── specs/                          # 全局 spec（归档后合并至此）
│   └── <domain>/
│       └── spec.md
├── schemas/
│   └── sdd/                        # SDD schema + 模板
│       ├── schema.yaml             # artifact 定义、依赖链、内容约束
│       └── templates/
│           ├── brainstorm.md
│           ├── proposal.md
│           ├── spec.md
│           ├── design.md
│           ├── tasks.md
│           ├── plan.md
│           └── review.md
└── changes/
    ├── <change-name>/              # 活跃变更
    │   ├── brainstorm.md
    │   ├── proposal.md
    │   ├── specs/
    │   │   └── <capability>/
    │   │       └── spec.md
    │   ├── design.md
    │   ├── tasks.md
    │   ├── plan.md
    │   └── reviews/
    │       ├── brainstorm-r1.md
    │       ├── spec-r1.md
    │       ├── plan-r1.md
    │       ├── code-batch1-r1.md
    │       └── code-final-r1.md
    └── archive/
        └── YYYY-MM-DD-<name>/

.claude/skills/
├── sdd-doctor/         SKILL.md
├── sdd-brainstorm/     SKILL.md + brainstorm-reviewer-prompt.md
├── sdd-propose/        SKILL.md
├── sdd-continue/       SKILL.md
├── sdd-ff/             SKILL.md
├── sdd-plan/           SKILL.md + plan-reviewer-prompt.md
├── sdd-code/           SKILL.md
├── sdd-review-spec/    SKILL.md + spec-reviewer-prompt.md
├── sdd-review-code/    SKILL.md + spec-compliance-reviewer-prompt.md
│                               + code-quality-reviewer-prompt.md
├── sdd-verify/         SKILL.md
└── sdd-ship/           SKILL.md
```

### 12. 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 架构模式 | 薄编排（invoke 委托） | 消除逻辑复制和版本漂移，底层工具可独立升级 |
| 用户入口 | 只有 sdd-* | 消除三套入口（SDD / OpenSpec / Superpowers）的选择困惑 |
| Schema instruction | 只管内容约束 | 执行者（OpenSpec skill）无法执行流程编排指令，职责分离 |
| Override 策略 | 具体路径 + 具体禁止 + 兜底检测 | 提高 Override 可靠性，避免笼统指令被忽略 |
| design 可选化 | tasks/plan 不硬依赖 design | 简单变更不需要技术设计文档 |
| ff 不生成 plan | apply 依赖 tasks 而非 plan | 让 ff 自然停在 tasks，plan 单独由 writing-plans 纪律保证质量 |
| tasks vs plan 共存 | 分开（what vs how） | 合并会导致要么 tasks 过于详细，要么 plan 过于抽象 |
| 代码审查分两阶段 | spec 合规 → 代码质量 | 先确认"做对了"再讨论"做好了" |
| Review 形态 | 内嵌（brainstorm/plan）+ 独立（spec/code） | 内嵌是质量保证，独立是可选能力，不违反 Action Not Phases |

### 13. 适用场景

- 复杂特性：brainstorm → spec → TDD 流程在需求复杂、边界条件多时价值最大
- 长期项目：归档机制将变更历史转化为制度记忆
- 团队协作：artifact 体系提供共同语言，review 让代码审查更有焦点

> 核心哲学：用结构消除歧义，用纪律保证质量，用归档积累智慧。

---

## 当前插件与 SDD 差异分析

| 维度 | 当前插件（phase-based） | SDD 方案（action-based） |
|------|------------------------|-------------------------|
| 架构 | 4 个阶段，1 个 SKILL.md | 11 个独立 action skill |
| 编排 | 复制底层逻辑 | 薄编排（invoke 委托） |
| 依赖 | 阶段必须顺序执行 | 依赖是 enabler 不是 gate |
| Review | 无独立 review | 内嵌 + 独立 review action |
| 信息防丢 | 无 | 决策追溯 + 后置检查 |
| 上下文 | 状态文件持久化 | 持久化 + 明确 /clear 引导 |
| Override | 无 | 显式覆盖底层 skill 行为 |
| 采用策略 | 一次性全用 | 渐进采用（3个阶段） |

---

## 重构计划

### 目标目录结构

```
ai-tools-bridge/
├── skills/
│   ├── sdd-doctor/
│   │   └── SKILL.md
│   ├── sdd-brainstorm/
│   │   ├── SKILL.md
│   │   └── brainstorm-reviewer-prompt.md
│   ├── sdd-propose/
│   │   └── SKILL.md
│   ├── sdd-continue/
│   │   └── SKILL.md
│   ├── sdd-ff/
│   │   └── SKILL.md
│   ├── sdd-plan/
│   │   ├── SKILL.md
│   │   └── plan-reviewer-prompt.md
│   ├── sdd-code/
│   │   └── SKILL.md
│   ├── sdd-review-spec/
│   │   ├── SKILL.md
│   │   └── spec-reviewer-prompt.md
│   ├── sdd-review-code/
│   │   ├── SKILL.md
│   │   ├── spec-compliance-reviewer-prompt.md
│   │   └── code-quality-reviewer-prompt.md
│   ├── sdd-verify/
│   │   └── SKILL.md
│   └── sdd-ship/
│       └── SKILL.md
├── schemas/
│   └── sdd/
│       ├── schema.yaml
│       └── templates/
│           ├── brainstorm.md
│           ├── proposal.md
│           ├── spec.md
│           ├── design.md
│           ├── tasks.md
│           ├── plan.md
│           └── review.md
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
├── .gitignore
├── LICENSE
└── README.md
```

### 实施步骤

#### Step 1: 删除旧文件
- 删除 skills/workflow-orchestrator/SKILL.md（旧的单一编排器）

#### Step 2: 创建 11 个 Action Skills

每个 skill 遵循统一三段式结构：前置逻辑（SDD 自有）→ 核心执行（invoke 底层 skill）→ 后置逻辑（SDD 自有）

##### 2.1 sdd-doctor
- 无委托，纯 SDD 自有逻辑
- 检查环境：OpenSpec / Superpowers 是否安装
- 检查 change 状态：扫描 openspec/changes/ 显示进行中的变更
- 输出诊断报告

##### 2.2 sdd-brainstorm
- **前置**：定位 change 目录，读取项目上下文
- **核心**：invoke superpowers:brainstorming（Override：输出到 change 目录、禁止转入 writing-plans、跳过内置 reviewer）
- **后置**：dispatch brainstorm-reviewer 循环（最多 3 轮）
- **产物**：brainstorm.md + reviews/brainstorm-r<N>.md
- **完成后**：提示可安全 /clear，推荐下一步 sdd-propose 或 sdd-ff

##### 2.3 sdd-propose
- **前置**：读取 brainstorm.md（如有）
- **核心**：invoke openspec-continue-change 或 openspec-propose
- **后置**：决策追溯检查（proposal 是否引用了 brainstorm 中的关键决策）
- **产物**：proposal.md

##### 2.4 sdd-continue
- **前置**：识别当前 change 目录中已有哪些 artifact
- **核心**：invoke openspec-continue-change，生成依赖链中下一个缺失 artifact
- **后置**：格式校验
- **产物**：依赖链中下一个 artifact

##### 2.5 sdd-ff
- **前置**：识别所有缺失 artifact
- **核心**：invoke openspec-ff-change，批量生成至 tasks.md
- **后置**：逐个格式校验
- **产物**：所有缺失 artifact（至 tasks.md，不含 plan.md）

##### 2.6 sdd-plan
- **前置**：读取 tasks.md + specs/ + design.md（如有）
- **核心**：invoke superpowers:writing-plans（Override：输出位置、禁止转入 executing-plans、跳过内置 reviewer）
- **后置**：dispatch plan-reviewer 循环（最多 3 轮）
- **产物**：plan.md + reviews/plan-r<N>.md

##### 2.7 sdd-code
- **前置**：读 plan.md 定位当前批次
- **核心**：invoke superpowers:using-git-worktrees（分支命名 sdd/<change-name>）+ superpowers:test-driven-development + superpowers:systematic-debugging（如遇失败）
- **后置**：更新 tasks.md 中对应任务状态
- **产物**：代码 + 测试 + commits

##### 2.8 sdd-review-spec
- 无委托，dispatch spec-reviewer subagent
- 审查所有 spec 文件的质量
- **产物**：reviews/spec-r<N>.md

##### 2.9 sdd-review-code（双阶段）
- **Phase 1**（SDD 自有）：dispatch spec-compliance-reviewer，检查代码是否实现了 spec 场景
- **Phase 2**（委托）：invoke superpowers:requesting-code-review，检查代码质量
- Phase 1 必须通过后才进入 Phase 2
- **产物**：reviews/code-*.md

##### 2.10 sdd-verify
- **核心**：invoke superpowers:verification-before-completion + openspec-verify-change
- **后置**：逐条 scenario 覆盖率统计
- **产物**：验证报告

##### 2.11 sdd-ship
- **前置**：最终验证
- **核心**：invoke openspec-sync-specs + openspec-archive-change + superpowers:finishing-a-development-branch（三步顺序执行）
- **产物**：归档 + specs 同步

#### Step 3: 创建 Schema 和模板

##### 3.1 schema.yaml
- 定义 7 个 artifact 及依赖关系
- 内容约束（必填字段、格式规则）
- 不含流程编排指令

##### 3.2 七个 artifact 模板
- brainstorm.md — 方案探索模板（含"关键决策"节）
- proposal.md — 提案模板（含"决策追溯"必填节）
- spec.md — 规格模板（GIVEN/WHEN/THEN 场景）
- design.md — 技术设计模板（含"决策追溯"节）
- tasks.md — 任务模板（含 [spec:domain#scenario] 链接）
- plan.md — 实施计划模板（TDD 步骤、2-5 分钟粒度）
- review.md — 审查报告模板

#### Step 4: 更新 Guidelines

- **quality-checkpoints.md** — 从 4-phase 检查点改为 action 级检查点，增加 review 相关检查
- **decision-strategy.md** — 保留核心内容，从 Phase N 引用改为 action 级引用
- **token-optimization.md** — 增加 action 间的优化策略、/clear 引导、模型分层
- **team-standards.md** — 保留，从 Phase 引用改为 action 引用

#### Step 5: 更新其他文件

- **integrations/tool-template.md** — 从 phase 映射改为 action 映射
- **plugin.json** — 版本升为 0.2.0，更新描述
- **marketplace.json** — 同步更新
- **README.md** — 完全重写，体现 action-based 架构

### Next Action 引导矩阵

| 完成 Action | 推荐下一步 |
|------------|-----------|
| sdd-brainstorm | sdd-propose（逐步）或 sdd-ff（快进） |
| sdd-propose | sdd-continue（逐步）或 sdd-ff（快进） |
| sdd-continue | sdd-continue 或 sdd-ff 或 sdd-plan |
| sdd-ff | sdd-review-spec（大特性）或 sdd-plan（小修复） |
| sdd-review-spec | sdd-plan |
| sdd-plan | sdd-code |
| sdd-code | sdd-review-code |
| sdd-review-code | sdd-code（更多批次）或 sdd-verify |
| sdd-verify | sdd-ship（通过）或 sdd-code（失败） |
| sdd-ship | 完成 |

### 渐进采用策略

| 阶段 | 使用的 Action | 建立的习惯 |
|------|-------------|-----------|
| 第一阶段 | sdd-propose → sdd-ff → sdd-plan → sdd-code → sdd-ship | spec 驱动 + TDD |
| 第二阶段 | + sdd-review-spec + sdd-review-code | 审查纪律 |
| 第三阶段 | + sdd-brainstorm + sdd-verify | 完整工程纪律 |

### 文件变更统计

- **删除**：1 个文件（skills/workflow-orchestrator/SKILL.md）
- **新建**：25 个文件（11 SKILL.md + 4 reviewer prompts + 1 schema.yaml + 7 templates + 2 目录结构）
- **更新**：7 个文件（4 guidelines + tool-template + plugin.json + README.md）

### 验证方式

1. 运行 /sdd-doctor 检查环境诊断
2. 走一遍小修复最短路径：sdd-propose → sdd-ff → sdd-plan → sdd-code → sdd-ship
3. 验证 /clear 后各 action 能正确从文件系统恢复状态
4. 验证 artifact 依赖链检查正确（缺失前置 artifact 时给出明确提示）

---

## 当前插件文件状态（已有）

```
ai-tools-bridge/
├── .git/                                    # git 仓库
├── .claude-plugin/
│   ├── plugin.json                          # 版本 0.1.0
│   └── marketplace.json
├── skills/
│   └── workflow-orchestrator/
│       └── SKILL.md                         # 旧的单一编排器（待删除）
├── guidelines/
│   ├── quality-checkpoints.md
│   ├── decision-strategy.md
│   ├── token-optimization.md
│   └── team-standards.md
├── integrations/
│   └── tool-template.md
├── .gitignore
├── LICENSE
├── README.md
└── 2026-05-10-022653-2026-05-10-004939-command-messageopsxexplorecomm.txt  # 上一次对话记录
```
