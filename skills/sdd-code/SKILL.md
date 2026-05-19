---
name: sdd-code
description: "TDD 实施 — 按 plan.md 中的批次执行 TDD 循环，产出代码+测试+commits"
---

# sdd-code — TDD 实施

按 plan.md 中的实施计划，执行 TDD 红-绿循环，产出代码和测试。

---

## 触发条件

**触发**：用户执行 `/sdd-code`，或说"开始编码""TDD 实施""实现功能""写代码"。
**不触发**：要补全测试（→ `/sdd-test-code`）；要审查代码（→ `/sdd-review-code`）。
**歧义处理**：无 plan.md 且 tasks >15 时建议先执行 `/sdd-plan`。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：`tasks.md` 不存在 → 拒绝执行，输出"缺少 tasks.md，请先执行 /sdd-ff 生成 tasks"
- **警告**：tasks 数量 >15 且 `plan.md` 不存在 → 提示"tasks.md 包含 N 项任务但缺少 plan.md，建议先执行 /sdd-plan。跳过 plan 时建议每个任务完成后运行全量测试以确保不引入回归"，用户确认后可强制继续

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 读取输入 artifact

- **plan.md**（强烈推荐）— 实施计划和 TDD 步骤
- **tasks.md**（必需）— 任务清单和状态
- **specs/** — 当前批次涉及的 spec 场景

### 3. 定位当前批次

- 如果 plan.md 存在：读取批次划分，定位当前应实施的批次
- 如果 plan.md 不存在：从 tasks.md 中选择未完成的任务
- 向用户确认本次要实施的批次/任务范围

### 4. Worktree 准备（推荐）

- 如果当前不在 worktree 中，建议创建
- 分支命名：`sdd/<change-name>`

---

## 核心执行（委托底层 skill）

### 4a. Worktree（如需）

**invoke `superpowers:using-git-worktrees`**

Override：
```
分支命名: sdd/<change-name>
```

保留：安全验证、基线测试

### 4b. TDD 循环

**invoke `superpowers:test-driven-development`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
```

对当前批次的每个任务，按 TDD 铁律执行：

1. **RED** — 编写失败测试
2. **运行验证** — 确认测试失败
3. **GREEN** — 最小实现使测试通过
4. **运行验证** — 确认测试通过

每个任务完成后 commit。

### 4c. 调试（如遇失败）

**invoke `superpowers:systematic-debugging`**（仅在测试意外失败时）

- 系统化定位根因
- 不猜测，不盲目重试
- 修复后重新运行验证

---

## 后置逻辑（SDD 自有）

### 1. 更新 tasks.md

将已完成任务标记为 `[x]`：
```
- [x] 1.1 实现主题切换 API [spec:ui-theme#toggle-theme]
```

### 2. 产物校验

- 确认 commit 已创建
- 确认 tasks.md 已更新
- 快速检查：无幻觉函数、无硬编码敏感信息

### 3. 完成引导

```
sdd-code 完成。

批次 [N] 已实施并提交。
tasks.md 已更新。

如需释放上下文，可安全 /clear。

推荐下一步:
  - 审查本批次代码 → /sdd-review-code
  - 继续下一批次 → /sdd-code

★ 推荐下一步: /sdd-review-code [中等/复杂] 或 /sdd-ship [简单]（sdd-ship 会提示 verify 检查）
  ○ /sdd-verify — 全面验证 Spec 场景覆盖
```
