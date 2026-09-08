---
name: sdd-doctor
description: "环境诊断 — 检查 OpenSpec、Superpowers 安装状态和 change 进度，输出诊断报告"
---

# sdd-doctor — 环境诊断

检查 SDD 工作流所需的工具和当前变更状态，评估变更复杂度并推荐工作流路径。

---

<!-- include: ../_shared/base-triggers.md -->

**触发**：用户执行 `/sdd-doctor`，或说"检查环境""诊断""当前状态""推荐路径"且需要了解项目或变更状态。
**不触发**：用户要执行具体操作（→ 对应 action）；用户要修改代码（→ `/sdd-code`）。
**歧义处理**：无活跃变更时输出环境诊断后推荐创建新变更。

<!-- include: ../_shared/output-constraints.md -->

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

sdd-doctor 无前置依赖，校验直接通过。

注：sdd-doctor 为诊断工具，不适用角色视角。

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

---

## 核心执行（SDD 自有）

**无底层 skill 委托，由 SDD 自有逻辑执行。**

---

### 1. 检查工具安装

逐一检测以下工具是否可用：

| 工具 | 检测方式 | 状态 |
|------|---------|------|
| OpenSpec | 检查 `openspec/` 目录是否存在，或 `openspec` CLI 是否可用 | ✅/❌ |
| Superpowers | 检查 `superpowers:brainstorming` skill 是否可调用 | ✅/❌ |

### 2. 检查 Change 状态

扫描 `openspec/changes/` 目录：

- 列出所有活跃变更
- 对每个变更，检查已有 artifact：
  - brainstorm.md
  - proposal.md
  - specs/
  - design.md
  - tasks.md
  - plan.md
  - hotfix.md（轻轨）
  - test-cases.md（重轨）
  - reviews/
- **轨道标记判定**：读 proposal.md 或 hotfix.md 头部 `track:` 元数据 → 显示 `[hotfix]` / `[quick]` / `[feature]`（无元数据时按存在产物推断：仅 hotfix.md → hotfix；有 proposal 但无 functions/test-cases → quick/feature 按 proposal 声明）

**父子关系拓扑**（当 `change-registry.yaml` 存在时显示）：

```
父子关系拓扑:
  parent-change (active)
    ├─ child-change-1 (active) — 进度: 63%
    │   └─ 依赖: child-change-2
    └─ child-change-2 (archived)
```

- 层级关系：父 change → 子 change 的缩进结构
- 每个 change 标注 `status`（active/archived）
- 子 change 显示进度（扫描 tasks.md 的 `- [x]` 标记数 / 总任务数 × 100%，总任务数 = `- [ ]` 和 `- [x]` 行数之和）
- 无 tasks.md 时进度显示 "N/A"
- 子 change 显示 `depends_on` 依赖关系
- 无注册表时跳过此节

**注册表与文件系统一致性检查**（当 `change-registry.yaml` 存在时执行）：

1. 遍历注册表中所有 `status: active` 的 change
2. 检查每个 change 的目录 `openspec/changes/<name>/` 是否存在
3. 目录不存在 → 标记为孤项，输出：
   ```
   ⚠️ 检测到注册表与文件系统不一致：
     - <change-name> — 注册表中为 active，但目录不存在
     建议：确认后手动删除注册表项
   ```
4. 仅检查 active 状态的 change（archived 的 change 目录已移至 archive/）

### 3. 复杂度评估

根据活跃变更的制品内容评估复杂度。

#### 3a. 跳过条件

- **无活跃变更** → 输出"无活跃变更"，跳过复杂度评估，仅输出环境诊断报告。推荐 `/sdd-brainstorm` 或 `/sdd-propose` 开始新变更。
- **有 change 但缺少 specs/ 和 tasks.md** → 跳过复杂度评估，不输出评级。根据缺失制品推荐下一步（如"运行 /sdd-ff 生成 specs 和 tasks"）。

#### 3b. 五维度评估

当活跃变更存在 `specs/`（含至少一个 spec.md）或 `tasks.md` 时，按五个维度采集指标：

| 指标 | 权重 | 来源 |
|------|------|------|
| spec 场景数量 | 高 | specs/*/spec.md 中 GIVEN/WHEN/THEN 计数 |
| tasks 数量 | 高 | tasks.md 中 `- [ ]` checkbox 计数 |
| 影响文件数 | 中 | proposal.md 影响分析 |
| 涉及领域数 | 中 | specs/ 下一级子目录数 |
| 外部依赖变更 | 低 | proposal.md 依赖描述 |

- proposal 不存在时，影响文件数和依赖变更按 0 计，不阻断评估，标注"部分指标使用默认值"。
- 指标采集失败时，失败指标按 0 计，不阻断评估，标注失败原因。
- **Evidence completeness ceiling**：5 个维度中至少需要采集到 2 个高权重维度（spec 场景数、tasks 数量）的数据才能给出评级，否则输出"数据不足，无法评级"并推荐生成缺失制品。低权重维度（影响文件数、涉及领域数、外部依赖变更）缺失时不阻断评级，标注"部分指标使用默认值"。

#### 3c. 评级规则

| 评级 | 场景数 | 任务数 | 领域数 |
|------|--------|--------|--------|
| 简单(S) | 1-5 | ≤10 | 1 |
| 中等(M) | 4-8 | 6-15 | 1-2 |
| 复杂(L) | >8 | >15 | ≥3 |

- 多维度指向不同评级时取最高（就高不就低）。
- 评级阈值为初始经验值，将随使用迭代调整。
- 多个活跃变更时独立评估各变更复杂度，互不影响。

---

## 后置逻辑（SDD 自有）

### 1. 输出诊断报告

```
SDD 环境诊断
═══════════════════════════════════

工具状态:
  OpenSpec     ✅ 已安装
  Superpowers  ✅ 已安装

限制配置:
  quick-questions: 5 (默认值)
  quick-scenarios: 5 (默认值)
  quick-tasks: 10 (默认值)
  review-rounds: 3 (默认值)
  hotfix-locate-rounds: 3 (默认值)
  hotfix-max-files: 2 (默认值)
  hotfix-max-scenarios: 3 (默认值)
  quick-max-files: 3 (默认值)

活跃变更:
  user-auth/ [中等(M)]
    ✅ proposal.md    ✅ specs/ (2 个)
    ✅ tasks.md       ❌ plan.md
    ❌ design.md      reviews/ (1 个)
    → 建议: 运行 sdd-plan 生成实施计划

  dashboard-redesign/ [简单(S)]
    ✅ brainstorm.md  ✅ proposal.md
    ✅ specs/ (3 个)  ❌ tasks.md
    → 建议: 运行 sdd-ff 完成剩余文档

无活跃变更。
→ 建议: 运行 sdd-brainstorm 开始新变更，或 sdd-propose 快速创建提案
```

**限制配置输出说明**：
- 读取 `openspec/config.yaml` 的 `limits` 节
- 已配置且有效 → 显示配置值
- 未配置或无效 → 显示默认值并标注"(默认值)"
- 配置值无效时标注"(默认值，配置值无效)"

### 2. 路径推荐

根据复杂度评级推荐工作流路径（双轨制）：

#### 简单(S) — 轻轨

- 若是 bug 修复/细小改动：★ 推荐 /sdd-hotfix
- 若是小型新功能：★ 推荐 /sdd-quick（轻量收敛版）
- ○ 可选标准路径：/sdd-propose → /sdd-ff → /sdd-code
- 提示：轻轨目标 10-15 分钟闭环，超盒自动升轨

#### 中等(M) — 重轨

- ★ 推荐重轨：/sdd-propose → /sdd-analyze → /sdd-plan → /sdd-code → /sdd-verify → /sdd-ship
- **analyze 必需**（M/L 重轨级，产 functions.md 三图 + test-cases.md）
- 标注可跳过 brainstorm
- △ 可跳过 /sdd-review-spec、/sdd-review-code

#### 复杂(L) — 重轨完整

- ★ 推荐重轨完整流程：brainstorm → propose → analyze → plan → code → review-spec → review-code → verify → ship
- **analyze 必需**（产三图 + test-cases.md）
- 提示复杂变更建议使用 /sdd-plan 分批生成
- 所有步骤均为推荐，无跳过建议

#### 活跃变更展示（含轨道标记）

```
活跃变更:
  user-auth/ [feature]  中等(M)
    ✅ proposal.md    ✅ specs/ (2 个)   ✅ functions.md
    ✅ test-cases.md  ✅ tasks.md        ❌ plan.md
    → 建议: 运行 /sdd-plan 生成实施计划

  fix-login-redirect/ [hotfix] 简单(S)
    ✅ hotfix.md
    → 建议: 运行 /sdd-ship 轻量归档，或查看卡片详情
```

### 3. 完成引导

```
sdd-doctor 完成。

推荐下一步:
  1. ★ 根据复杂度评级选择路径（见上方推荐）
  2. ○ /sdd-brainstorm — 手动从头脑风暴开始
  3. ○ /sdd-propose — 手动从提案开始

如需释放上下文，可安全 /clear。
```
