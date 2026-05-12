---
name: sdd-doctor
description: "环境诊断 — 检查 OpenSpec、Superpowers 安装状态和 change 进度，输出诊断报告"
---

# sdd-doctor — 环境诊断

检查 SDD 工作流所需的工具和当前变更状态，评估变更复杂度并推荐工作流路径。

---

## 执行步骤

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
  - reviews/

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

#### 3c. 评级规则

| 评级 | 场景数 | 任务数 | 领域数 |
|------|--------|--------|--------|
| 简单(S) | 1-3 | ≤5 | 1 |
| 中等(M) | 4-8 | 6-15 | 1-2 |
| 复杂(L) | >8 | >15 | ≥3 |

- 多维度指向不同评级时取最高（就高不就低）。
- 评级阈值为初始经验值，将随使用迭代调整。
- 多个活跃变更时独立评估各变更复杂度，互不影响。

### 4. 输出诊断报告

```
SDD 环境诊断
═══════════════════════════════════

工具状态:
  OpenSpec     ✅ 已安装
  Superpowers  ✅ 已安装

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

### 5. 路径推荐

根据复杂度评级推荐工作流路径：

#### 简单(S) — 快速路径

- ★ 推荐 /sdd-quick（快速模式）
- ○ 可选标准路径：/sdd-propose → /sdd-ff → /sdd-code
- 提示：简单需求可跳过 brainstorm 和独立 review

#### 中等(M) — 标准路径

- ★ 推荐标准路径：/sdd-propose → /sdd-ff → /sdd-plan → /sdd-code
- 标注可跳过 brainstorm
- △ 可跳过 /sdd-review-spec、/sdd-review-code

#### 复杂(L) — 完整流程

- ★ 推荐完整流程：brainstorm → propose → ff → plan → code → review-spec → review-code → verify → ship
- 提示复杂变更建议使用 /sdd-plan 分批生成
- 所有步骤均为推荐，无跳过建议

### 6. 完成引导

```
sdd-doctor 完成。

★ 推荐下一步: 根据复杂度评级选择路径（见上方推荐）
  ○ /sdd-brainstorm — 手动从头脑风暴开始
  ○ /sdd-propose — 手动从提案开始

如需释放上下文，可安全 /clear。
```
