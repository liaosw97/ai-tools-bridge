---
name: sdd-continue
description: "逐步补充 artifact — 识别并生成依赖链中下一个缺失的 artifact"
---

# sdd-continue — 逐步补充 artifact

逐步推进，每次生成依赖链中下一个缺失的 artifact。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

sdd-continue 无前置阻断，依赖链中任何位置均可触发。

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 多个变更时让用户选择

### 2. 识别已有 artifact

按依赖链顺序检查：

```
brainstorm.md → proposal.md → specs/ → design.md → tasks.md
```

标记每个 artifact 的存在状态。

### 3. 确定下一个缺失 artifact

找到依赖链中第一个缺失的 artifact：
- 如果 proposal.md 缺失 → 下一步生成 proposal
- 如果 specs/ 缺失 → 下一步生成 specs
- 如果 design.md 缺失 → 询问用户是否需要（可选 artifact）
- 如果 tasks.md 缺失 → 下一步生成 tasks
- 如果全部存在 → 提示所有规划文档已完成

---

## 核心执行（委托底层 skill）

**invoke `openspec-continue-change`**

传递信息：
- 当前 change 目录路径
- 已有 artifact 的内容摘要
- 需要生成的下一个 artifact 类型

---

## 后置逻辑（SDD 自有）

### 1. 格式校验

验证新生成的 artifact：
- 文件存在且非空
- 包含模板要求的必填字段
- 如果是 specs/：验证 GIVEN/WHEN/THEN 场景格式
- 如果是 tasks.md：验证 `[spec:domain#scenario]` 链接格式

### 2. 完成引导

```
sdd-continue 完成。

已生成: [artifact 名称]
产物已持久化至: openspec/changes/<name>/[artifact]

当前进度:
  ✅ proposal.md  ✅ specs/  ❌ design.md  ❌ tasks.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 继续下一个 → /sdd-continue
  - 快进生成所有剩余 → /sdd-ff
  - 已到 tasks.md → /sdd-plan

★ 推荐下一步: 根据当前进度动态推荐（下一个缺失 artifact 的生成方式）
当前进度:
  ✅/❌ proposal.md  ✅/❌ specs/  ✅/❌ design.md  ✅/❌ tasks.md
```
