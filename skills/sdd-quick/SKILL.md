---
name: sdd-quick
description: "快速模式 — 一条命令完成简单需求的 propose → spec → tasks → code 全流程，通过前置自检评估复杂度，超出范围时提示回退到标准路径"
---

# sdd-quick — 快速模式

用一条命令完成简单需求的 propose → spec → tasks → code 全流程。

---

## 触发条件

**触发**：用户执行 `/sdd-quick`，或说"快速模式""简单需求""小修复""一站完成"。
**不触发**：复杂需求涉及架构或跨模块重构（→ 标准路径 `/sdd-propose`）；要深度探索（→ `/sdd-brainstorm`）。
**歧义处理**：复杂度不确定时执行前置自检评估。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

sdd-quick 无前置依赖，校验直接通过。

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 如果没有活跃变更，提示用户先通过 `/sdd-propose` 创建一个

### 2. 前置自检：复杂度评估

评估当前需求的复杂度，判断是否适合 quick 模式：

**疑似复杂信号**（满足任一即触发）：
- 需求描述涉及新领域建模
- 涉及跨模块重构
- 涉及外部 API 变更
- 需要设计决策（有 2+ 个候选方案）
- 用户描述的需求含"架构"、"重构"、"迁移"等关键词

**如果检测到疑似复杂**：
1. 输出提示："该需求可能超出 quick 模式适用范围，建议使用 /sdd-propose 开始标准路径"
2. 询问用户："是否继续使用 quick 模式？"
3. 用户选择继续 → 附风险提示，按正常流程执行
4. 用户选择回退 → 退出 quick，不生成任何文件

### 3. 检查 proposal.md 是否存在

- 如果 `proposal.md` 已存在 → 跳过交互收集，直接读取已有 proposal
- 如果不存在 → 进入交互收集阶段

---

## 核心执行（委托底层 skill）

### 4a. 交互收集（proposal 不存在时）

**invoke 内联 `/grill-me` 追问技巧**（参见 `reference-grill.md`）

- 使用苏格拉底式提问方法收集需求
- 最多 5 个问题，超过后自动进入生成阶段
- 多选优先，逐个分支解决
- 收集完成后自动生成 `proposal.md`

### 4b. 文档生成

**invoke `openspec-continue-change`**

Override 指令：
```
输出目录: openspec/changes/<name>/
使用 SDD 自有模板
完成后停止 — 不自动链式调用
```

依次生成：
1. `proposal.md`（如果尚不存在）
2. `specs/`（最多 5 个场景）
3. `tasks.md`（最多 10 个任务）

**上限检测**（生成过程中）：
- 如果场景数量 > 5 → 立即停止，输出超限提示
- 如果任务数量 > 10 → 立即停止，输出超限提示
- 超限处理：
  1. 输出具体超限提示（超出场景上限 5 个或任务上限 10 个）
  2. 告知已生成的中间产物可复用于标准路径
  3. 建议通过 `/sdd-propose` 或 `/sdd-ff` 继续
  4. 不删除任何已生成文件

### 4c. TDD 编码

**invoke `superpowers:test-driven-development`**（参见 `reference-tdd-compact.md`）

Override 指令：
```
不生成 plan.md
使用紧凑 TDD 循环
完成后停止
```

**质量风险提示**：如果 tasks 数量接近上限（>8），在 TDD 编码前输出提示"当前任务数量较多（N 项），建议每个任务完成后运行全量测试以确保不引入回归"。

对每个任务按 TDD 红-绿循环执行。

---

## 后置逻辑（SDD 自有）

### 1. 产物校验

- 确认 `proposal.md`、`specs/`、`tasks.md` 已生成
- 确认代码实现和测试已完成
- 快速检查：无幻觉函数、无硬编码敏感信息

### 1.5 轻量级决策追溯

如果 `brainstorm.md` 存在：
- 提取 brainstorm 中的关键决策列表
- 验证 `proposal.md` 是否引用了每个关键决策
- 未追溯的决策 → 输出警告但不阻断

如果 `brainstorm.md` 不存在 → 跳过此步骤。

### 1.6 格式校验

对生成的制品执行快速格式校验：

| Artifact | 校验项 |
|----------|--------|
| proposal.md | 意图明确、范围清晰 |
| specs/ | 每个 spec 至少有 1 个 GIVEN/WHEN/THEN 场景 |
| tasks.md | 每个任务有 `[spec:domain#scenario]` 链接 |

校验不通过 → 输出警告，不阻断（quick 模式允许用户手动修复）。

### 2. 完成引导

```
sdd-quick 完成。

已生成的制品:
  ✅ proposal.md    ✅ specs/    ✅ tasks.md
  ✅ 代码实现 + 测试

推荐下一步:
  ★ /sdd-review-code — 审查代码质量和 Spec 合规
    或 /sdd-ship — 快速变更可直接归档（sdd-ship 会提示 verify 检查）
  ○ /sdd-verify — 全面验证 Spec 场景覆盖
```
