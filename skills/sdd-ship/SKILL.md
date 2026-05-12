---
name: sdd-ship
description: "归档合并 — 同步 specs、归档变更、合并分支，完成整个变更周期"
---

# sdd-ship — 归档合并

完成变更的最后一步：同步 specs、归档变更、合并分支。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：无验证报告（sdd-verify 未执行）→ 拒绝执行，输出"验证未完成，请先执行 /sdd-verify"
- **警告**：存在未通过的 review issues → 列出未通过项，建议修复后再归档，用户确认后可强制继续

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 最终验证

快速检查变更是否可以交付：
- tasks.md 中所有任务是否标记为 `[x]`
- 是否有未提交的代码变更
- 是否有未解决的 review issues

如果有未完成项：
```
⚠️ 以下项目未完成，建议先处理：
  - tasks.md: 2/5 任务未完成
  - reviews/code-batch2.md: 1 个 critical issue 未解决

是否仍要归档？(y/n)
```

---

## 核心执行（三步顺序执行）

### Step 1: Sync Specs

**invoke `openspec-sync-specs`**

将变更中的 specs 同步到全局 specs 目录。

### Step 2: Archive Change

**invoke `openspec-archive-change`**

将活跃变更归档到 `openspec/changes/archive/YYYY-MM-DD-<name>/`。

### Step 3: Finish Branch

**invoke `superpowers:finishing-a-development-branch`**

处理分支合并：
- 向用户展示合并选项（merge / rebase / squash）
- 执行合并
- 清理分支

---

## 后置逻辑（SDD 自有）

### 1. 确认归档

验证归档成功：
- 变更目录已移至 archive/
- 全局 specs 已更新
- 分支已合并

### 2. 完成引导

```
sdd-ship 完成。变更 [<name>] 已归档。

归档位置: openspec/changes/archive/YYYY-MM-DD-<name>/
全局 specs 已更新。
分支已合并。

本轮变更完成。

变更已完成，无后续操作。
  当前使用阶段: [根据使用的 action 推断]
  下一阶段建议: [推荐可以开始使用的额外 action]
```
