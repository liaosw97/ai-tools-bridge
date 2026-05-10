---
name: sdd-doctor
description: "环境诊断 — 检查 OpenSpec、Superpowers 安装状态和 change 进度，输出诊断报告"
---

# sdd-doctor — 环境诊断

检查 SDD 工作流所需的工具和当前变更状态。

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

### 3. 输出诊断报告

```
SDD 环境诊断
═══════════════════════════════════

工具状态:
  OpenSpec     ✅ 已安装
  Superpowers  ✅ 已安装

活跃变更:
  user-auth/
    ✅ proposal.md    ✅ specs/ (2 个)
    ✅ tasks.md       ❌ plan.md
    ❌ design.md      reviews/ (1 个)
    → 建议: 运行 sdd-plan 生成实施计划

  dashboard-redesign/
    ✅ brainstorm.md  ✅ proposal.md
    ✅ specs/ (3 个)  ❌ tasks.md
    → 建议: 运行 sdd-ff 完成剩余文档

无活跃变更。
→ 建议: 运行 sdd-brainstorm 开始新变更，或 sdd-propose 快速创建提案
```

### 4. 推荐下一步

根据诊断结果推荐：
- 工具缺失 → 提示安装
- 有未完成变更 → 推荐对应的下一步 action
- 无活跃变更 → 推荐 sdd-brainstorm 或 sdd-propose 开始新变更
