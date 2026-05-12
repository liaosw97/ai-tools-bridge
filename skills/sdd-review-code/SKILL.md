---
name: sdd-review-code
description: "代码审查（双阶段）— Phase 1: Spec 合规审查 → Phase 2: 代码质量审查"
---

# sdd-review-code — 代码审查（双阶段）

分两阶段审查代码：先确认"做对了"（spec 合规），再讨论"做好了"（代码质量）。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：无代码变更（git 无未提交更改）或 `specs/` 不存在 → 拒绝执行，输出具体缺失项和修复建议
- **警告**：spec 场景总数少于 tasks 数量 → 提示"spec 场景数（N）少于 tasks 数量（M），可能存在未覆盖的功能点"

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 收集审查材料

- 读取 `specs/` — 作为 Phase 1 的审查基准
- 读取 `plan.md`（如有）— 了解实施范围
- 获取自上次 review 以来的代码变更（git diff）
- 确定当前批次编号（用于 review 文件命名）

---

## Phase 1: Spec 合规审查（SDD 自有）

**dispatch spec-compliance-reviewer subagent**

读取 `spec-compliance-reviewer-prompt.md`，dispatch subagent 审查：

**审查目标：** 代码是否实现了 spec 中定义的每一个场景。

审查逻辑：
1. 提取所有 spec 文件中的 GIVEN/WHEN/THEN 场景
2. 在代码变更中寻找每个场景的实现
3. 标记未实现或部分实现的场景

**Phase 1 结果：**
- 如果所有 spec 场景都已实现 → 进入 Phase 2
- 如果有未实现的场景 → 停止，报告问题：
  ```
  ⚠️ Phase 1 发现 spec 合规问题：
    - [spec:auth#login] 未找到登录失败场景的实现
    - [spec:auth#token-refresh] 部分实现：缺少过期处理

  建议: 运行 /sdd-code 补充缺失的实现，而非继续代码质量审查。
  ```

产物：`reviews/spec-compliance-batch<N>.md`

---

## Phase 2: 代码质量审查（委托底层 skill）

**仅在 Phase 1 通过后执行。**

**invoke `superpowers:requesting-code-review`**

传递信息：
- 代码变更的 diff
- 相关的 spec 场景（作为审查上下文）
- 项目的代码风格约定

### Override 指令

```
SDD Override 指令：
1. 输出位置：审查结果写入 openspec/changes/<name>/reviews/code-batch<N>.md
2. 审查焦点：可读性、设计模式、潜在问题、性能
3. 已通过 spec 合规审查，不需要再检查功能正确性
```

### 保留的底层行为

- 系统化的代码审查流程
- 具体的改进建议
- 严重性分级

---

## 后置逻辑（SDD 自有）

### 1. 汇总审查结果

```
sdd-review-code 完成。

Phase 1 (Spec 合规): ✅ PASSED — 所有场景已实现
Phase 2 (代码质量):
  - [N] 个 critical issues
  - [N] 个 major issues
  - [N] 个 minor issues

产物:
  reviews/spec-compliance-batch<N>.md
  reviews/code-batch<N>.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 有更多批次 → /sdd-code 继续实施
  - 全部完成 → /sdd-verify 全面验证
  - 有 critical issues → 修复后重新 /sdd-review-code
```
