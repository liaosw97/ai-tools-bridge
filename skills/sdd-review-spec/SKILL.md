---
name: sdd-review-spec
description: "Spec 审查 — 独立审查 spec 质量，检查场景完整性、决策追溯、可测试性"
---

# sdd-review-spec — Spec 审查

独立审查当前变更的所有 spec 文件质量。大特性在实施前推荐执行。

---

## 触发条件

**触发**：用户执行 `/sdd-review-spec`，或说"审查 spec""检查规格质量""验证场景完整性"。
**不触发**：要审查代码质量（→ `/sdd-review-code`）；要修改 spec（→ `/sdd-ff`）。
**歧义处理**：无 spec 文件时建议先生成（→ `/sdd-ff`）。

## 输出约束

禁止输出:
- 开场白（"让我来审查..."）
- 工具调用前后的重复描述
- 未引用 spec 条文的审查意见
- 已知信息的复述

## 零结果与幻觉防护

- 所有审查发现必须引用来源（spec 文件路径 + 场景编号）
- spec 文件为空时输出"spec 文件为空，无法审查"而非编造意见

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：`specs/` 不存在或无 spec 文件 → 拒绝执行，输出"缺少 spec 文件，请先执行 /sdd-ff 生成规格"

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

★ 推荐下一步（按审查结果）:
  Approved → /sdd-plan — 生成实施计划
  Issues → /sdd-propose — 修正提案后重新生成
  ○ /sdd-ff — 快进生成剩余文档
```
