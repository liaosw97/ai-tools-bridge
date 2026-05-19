---
name: sdd-review-code
description: "代码审查 — Phase 1: 场景-代码映射验证 → Phase 1.5: 规范扫描（条件执行）→ Phase 2: 代码质量审查"
---

# sdd-review-code — 代码审查

分阶段审查代码：先确认"做对了"（场景-代码映射验证），条件执行规范扫描，最后讨论"做好了"（代码质量）。

---

## 触发条件

**触发**：用户执行 `/sdd-review-code`，或说"审查代码""代码 review""检查代码质量"。
**不触发**：要审查 spec 质量（→ `/sdd-review-spec`）；要补全测试（→ `/sdd-test-code`）。
**歧义处理**：无代码变更时建议先编码（→ `/sdd-code`）。

## 输出约束

禁止输出:
- 开场白（"让我来审查..."）
- 工具调用前后的重复描述
- 未引用代码位置或 spec 条文的审查意见
- 已知信息的复述

## 零结果与幻觉防护

- 所有审查发现必须引用 evidence 来源（spec 文件路径 + 代码文件路径）
- 无法定位代码时标注"⚠️ 无法验证"而非跳过
- 无代码变更时输出"无代码变更可审查"而非编造意见

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

**审查目标：** 代码是否实现了 spec 中定义的每一个场景。（代码层面的 spec 合规审查，区别于 sdd-verify 的测试层面覆盖验证）

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

产物：`reviews/spec-compliance-r<N>.md`

---

## Phase 1.5: 规范扫描（SDD 自有，条件执行）

**仅在 Phase 1 通过后执行。**

读取 `scan-reviewer-prompt.md`，dispatch subagent 进行规范扫描：

### 工作类型检测

通过 git diff 检查变更文件路径：
- **skill 开发**：变更文件包含 `SKILL.md` 或 `skills/` 目录下的 Markdown 文件
- **代码开发**：其他所有情况

### 扫描调度

```
检测工作类型
  ├── skill 开发 → 调用 skill-craft-adapter:skill-check（单文件）
  │                或 skill-craft-adapter:skill-audit（多文件系统级）
  ├── 代码开发 → 查询可用 skill 列表
  │   ├── 找到描述含"代码质量""安全""质量规范"的 skill → 调用
  │   └── 未找到 → SKIPPED
  └── skill-craft-adapter 不可用 → SKIPPED
```

### Phase 1.5 结果

- **SCANNED** — 扫描完成，结果写入 `reviews/scan-r<N>.md`
  - 如果发现 critical/major 问题，在报告中列出问题描述和修复建议
  - 不阻断 Phase 2 执行，问题在汇总中报告
- **SKIPPED** — 无可用规范扫描 skill，跳过扫描阶段

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
1. 输出位置：审查结果写入 openspec/changes/<name>/reviews/code-quality-r<N>.md
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

汇总时必须引用 evidence 来源（spec 文件路径 + 代码文件路径），不可仅凭记忆声明结论。

```
sdd-review-code 完成。

Phase 1 (Spec 合规): ✅ PASSED — 所有场景已实现
  evidence: specs/<domain>/spec.md (N 个场景) vs 代码变更 (N 个文件)
Phase 1.5 (规范扫描): SCANNED / SKIPPED
  SCANNED: 已调用 <skill-name>，发现 N 个问题
  evidence: reviews/scan-r<N>.md
  或
  SKIPPED: 无可用规范扫描 skill
Phase 2 (代码质量):
  - [N] 个 critical issues
  - [N] 个 major issues
  - [N] 个 minor issues
  evidence: reviews/code-quality-r<N>.md

产物:
  reviews/spec-compliance-r<N>.md
  reviews/scan-r<N>.md (如执行了扫描)
  reviews/code-quality-r<N>.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 有 PARTIAL/MISSING 场景 → ★ /sdd-test-code 补全缺失测试
  - 全部 PASSED → ★ /sdd-verify 全面验证
  - 有 critical issues → 修复后重新 /sdd-review-code
  - 有更多批次 → /sdd-code 继续实施
```
