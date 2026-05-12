---
name: sdd-ff
description: "快进生成所有文档 — 批量生成所有缺失 artifact 至 tasks.md"
---

# sdd-ff — 快进生成所有文档

一次性生成所有缺失的规划文档，从当前进度快进到 tasks.md。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：`proposal.md` 不存在 → 拒绝执行，输出"缺少 proposal.md，请先执行 /sdd-propose 生成 proposal"
- **警告**：`proposal.md` 存在但影响分析为空或含占位符 → 提示用户补充，可强制继续

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 多个变更时让用户选择
- 如果没有任何变更，提示先运行 sdd-propose

### 2. 评估当前状态

列出已有和缺失的 artifact：

```
当前状态:
  ✅ brainstorm.md（如有）
  ✅ proposal.md
  ❌ specs/
  ❌ design.md
  ❌ tasks.md

将生成: specs/ → design.md → tasks.md
```

### 3. 确认

向用户展示将要生成的 artifact 列表，确认后执行。

---

## 核心执行（委托底层 skill）

**invoke `openspec-ff-change`**

传递信息：
- change 目录路径
- 已有 artifact 的内容（作为输入上下文）
- 生成目标：所有缺失 artifact，截止到 tasks.md

**注意：** sdd-ff 不生成 plan.md。plan.md 由 sdd-plan 单独生成，确保质量由 Superpowers 的 writing-plans 纪律保障。

---

## 后置逻辑（SDD 自有）

### 1. 逐个格式校验

对每个新生成的 artifact 执行校验：

| Artifact | 校验项 |
|----------|--------|
| proposal.md | 意图明确、范围清晰、决策追溯完整 |
| specs/ | 每个 spec 有 GIVEN/WHEN/THEN 场景 |
| design.md | 技术方案可行、决策追溯完整（如生成） |
| tasks.md | 每个任务有 spec 链接 `[spec:domain#scenario]` |

如果有校验不通过：
```
⚠️ 以下 artifact 格式有问题：
  specs/user-auth.md — 缺少 GIVEN/WHEN/THEN 场景
  tasks.md — 任务 2.1 缺少 spec 链接

建议修复后再继续，或运行 /sdd-review-spec 做完整审查。
```

### 2. 完成引导

```
sdd-ff 完成。

已生成:
  openspec/changes/<name>/specs/ (N 个 spec)
  openspec/changes/<name>/design.md
  openspec/changes/<name>/tasks.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 大特性，建议先审查 spec → /sdd-review-spec
  - 小修复，直接生成计划 → /sdd-plan

★ 推荐下一步: /sdd-plan [中等/复杂] 或 /sdd-code [简单]（根据复杂度动态选择）
  ○ /sdd-review-spec — 先审查 spec 质量
  △ /sdd-quick — 重新走快速路径
```
