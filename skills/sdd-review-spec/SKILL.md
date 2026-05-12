---
name: sdd-review-spec
description: "Spec 审查 — 独立审查 spec 质量，检查场景完整性、决策追溯、可测试性"
---

# sdd-review-spec — Spec 审查

独立审查当前变更的所有 spec 文件质量。大特性在实施前推荐执行。

---

## 前置逻辑（SDD 自有）

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 收集 Spec 文件

- 读取 `specs/` 目录下的所有 spec 文件
- 读取 `proposal.md`（作为 spec 的上下文）
- 读取 `brainstorm.md`（如有，用于决策追溯验证）

### 3. 确认审查范围

向用户展示将审查的 spec 列表，确认。

---

## 核心执行（SDD 自有，dispatch subagent）

**无底层 skill 委托，由 SDD 自有逻辑执行。**

读取 `spec-reviewer-prompt.md`，dispatch subagent 进行审查。

审查覆盖：
- 所有 spec 文件
- proposal 与 spec 的一致性
- brainstorm 决策追溯完整性

---

## 后置逻辑（SDD 自有）

### 1. 输出审查报告

产物写入 `reviews/spec-r<N>.md`

### 2. 审查结果处理

```
sdd-review-spec 完成。

审查结果:
  APPROVED — 所有 spec 质量通过
  或
  NEEDS_REVISION — 发现 N 个 issues

如需释放上下文，可安全 /clear。

推荐下一步:
  - Approved → /sdd-plan 生成实施计划
  - Issues → 修正 spec 后重新审查

★ 推荐下一步: /sdd-propose — 修正提案后重新生成
  ○ /sdd-ff — 快进生成剩余文档
```
