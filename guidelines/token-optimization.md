# Token 优化策略

在整个 SDD 工作流中持续应用，减少不必要的 token 消耗。

---

## 核心原则

**只在需要的时候，加载需要的内容，传给需要的角色。**

---

## 上下文卫生（最重要的优化）

每个 action 完成后 `/clear` — 这是核心习惯。

**理由：** 产物在文件系统中，不在对话历史里。对话历史是不可靠的状态存储。

**安全 /clear 的时机：** 每个 action 完成并看到"产物已持久化至"提示后。

**不安全 /clear 的时机：** action 中途（sdd-brainstorm 多轮对话、sdd-plan review 循环、sdd-code TDD 循环）。

---

## Action 级优化

### sdd-brainstorm
- 起点可以是已有的需求描述，不需要从零探索
- Reviewer subagent 只传 brainstorm.md，不传整个项目上下文

### sdd-propose / sdd-continue / sdd-ff
- 不重复加载底层 skill 的引导指令
- 只传当前 change 的已有 artifact，不传其他 change 的内容
- 使用 /sdd-ff 一步到位比 /sdd-continue 多步更省 token

### sdd-plan
- 只传当前批次的 tasks + 对应 specs + design（如有）
- Reviewer subagent 只传 plan.md

### sdd-code
- 每个任务只传当前任务的完整文本 + 必要上下文
- 不传整个 plan.md 给 subagent
- 模型分层使用：
  - 简单实现（1-2 文件，spec 明确）→ 快速模型
  - 集成任务（多文件，需要协调）→ 标准模型
  - 架构/审查任务 → 最强模型
- Reviewer 使用 diff，不传整个文件

### sdd-review-code
- Phase 1 只传 spec 场景 + 代码 diff
- Phase 2 只传代码 diff + spec 上下文

### sdd-verify
- 验证报告只输出覆盖率统计，不输出每个场景的详细结果

### sdd-ship
- 只传变更名称，不传变更内容

---

## 跨 Action 优化

### 避免重复加载
- 编排层（SDD skill）描述了每个 action 的概要
- 不需要再加载底层 skill 的完整引导

### 精简指南加载
四个指南文件不一次性全部加载：
- `quality-checkpoints.md` — 只在 action 质量门检查时加载对应部分
- `decision-strategy.md` — 只在遇到决策点时加载
- `token-optimization.md` — 编排器启动时加载一次，后续隐式遵循
- `team-standards.md` — 只在 sdd-brainstorm、sdd-code、sdd-review-* 时加载

---

## 懒加载策略

### 模块化拆分

大型 skill 文件（>200 行）拆分为独立模块，按需加载：

| Skill | 模块 | 加载时机 |
|-------|------|----------|
| sdd-brainstorm | `modules/role-system.md` | 需要角色视角切换时 |
| sdd-brainstorm | `modules/split-patterns.md` | 触发拆分模式时 |
| sdd-plan | `modules/batch-mode.md` | 任务规模较大或用户选择分批时 |
| sdd-code | `modules/worktree.md` | 需要隔离工作环境或使用拆分模式时 |
| sdd-code | `modules/debugging.md` | 测试意外失败时 |

### 按需加载 Guidelines

| Guideline | 加载时机 |
|-----------|----------|
| `token-optimization.md` | 仅在首个 SDD action 初始化时加载 |
| `quality-checkpoints.md` | 在质量门检查步骤加载对应 action 的检查点部分 |
| `decision-strategy.md` | 在方案选择步骤加载 |

### 延迟加载 Reviewer Prompt

Reviewer prompt 仅在进入对应 review 循环时加载，不在前置逻辑中预加载：

| Action | Reviewer Prompt | 加载时机 |
|--------|-----------------|----------|
| sdd-brainstorm | `brainstorm-reviewer-prompt.md` | 进入 brainstorm review 循环时 |
| sdd-plan | `plan-reviewer-prompt.md` | 进入 plan review 循环时 |
| sdd-review-code | `spec-compliance-reviewer-prompt.md` | 进入 Phase 1 时 |
| sdd-review-code | `scan-reviewer-prompt.md` | 进入 Phase 1.5 时 |
| sdd-review-code | `code-quality-reviewer-prompt.md` | 进入 Phase 2 时 |

### 异常降级处理

当模块文件不存在或加载失败时：
1. 降级到完整加载（使用原始 skill 文件）
2. 记录错误日志
3. 继续执行，不阻断流程

---

## 检查清单

每次调用 subagent 或加载文件前：

1. 这个信息接收者已经有了吗？
2. 这是当前任务需要的吗？
3. 有更小的版本够用吗？
4. 可以用 diff 代替全文件吗？
5. 这个 subagent 用快速模型够吗？
6. 可以 /clear 释放上下文吗？

如果任何一个答案是"是"，就采取对应的优化措施。
