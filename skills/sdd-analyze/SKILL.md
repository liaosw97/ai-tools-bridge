---
name: sdd-analyze
description: "需求结构化解析 — 将需求解析为 模块→功能→函数 三层结构，产出函数签名和调用关系图"
---

# sdd-analyze — 需求结构化解析

将需求解析为 模块→功能→函数 三层结构，产出函数签名和调用关系图。

---

<!-- include: ../_shared/base-triggers.md -->

**触发**：用户执行 `/sdd-analyze`，或说"分析需求""解析功能""函数蓝图"。
**不触发**：sdd-brainstorm 未完成（→ 提示先完成 brainstorm）；已有 code 变更未提交（→ 提示先提交）。
**歧义处理**：无 active change 时提示先创建 change。

<!-- include: ../_shared/output-constraints.md -->

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：无 active change → 拒绝执行
- **阻断**：已有未提交的 code 变更 → 提示先 git commit
- **警告**：在 code 阶段调用（plan → code 及之后）→ 提示"已在 code 阶段，需要重新生成 plan 并确认是否覆盖已有代码"，询问用户"是否确认重新生成？(y/n)"
  - 用户确认（y）→ 触发从 propose → ff → plan 的重新生成流程，更新所有关联 artifacts（specs、tasks、plan），完成后提示"重新生成完成，请重新执行 /sdd-code"
  - 用户拒绝（n）→ 保持当前所有 artifacts 不变，继续执行 sdd-analyze 核心逻辑（仅分析，不覆盖已有代码）
- **functions.md 已存在时**：询问用户"已有 functions.md，是否覆盖重新生成？(y/n)"，用户选择覆盖则全量替换，选择追加则在已有基础上追加

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 读取输入

- 读取 `brainstorm.md`（如有，作为需求上下文）
- 读取 `proposal.md`（如有，作为需求范围参考）
- 读取 `specs/` 下的 spec 文件（如有，作为场景参考）

---

## 核心执行（SDD 自有）

### 1. 需求分析

- 读取用户输入的需求描述，或基于已有 artifact（brainstorm.md/proposal.md）推断
- 需求描述为空或过于模糊时，提示用户补充描述，可选择基于已有上下文推断
- 部分 artifact 已存在时按阶段处理：proposal 完成但 specs 未生成时基于 proposal 解析；specs 已完成时基于 specs 场景解析

### 2. 模块→功能→函数 三层解析

- 将需求分解为模块（Module）→ 功能（Feature）→ 函数（Function）三层结构
- 每个函数包含：函数名、参数列表、返回值类型、简要描述、所属模块路径
- 记录函数间的调用关系（调用链）

### 3. 调用关系冲突检测

- 存在已有代码库时，检测解析出的调用关系与已有代码的实际调用关系是否一致
- 不一致时告警并输出差异对比，标注冲突位置，供人工裁决

### 4. 人工审核确认

- 展示完整三层结构给用户，等待用户确认
- 用户可增删改模块/功能/函数，AI 相应调整调用关系

### 5. 产出 functions.md

- 将确认后的结果写入 `openspec/changes/<name>/functions.md`
- 格式见 functions-template.md

---

## 后置逻辑（SDD 自有）

### 1. 产物校验

- 确认 `functions.md` 存在且结构完整
- 每个函数至少包含函数名和所属模块

### 2. 完成引导

```
sdd-analyze 完成。

产物已持久化至:
  openspec/changes/<name>/functions.md

推荐下一步:
  1. ★ /sdd-plan — 基于函数蓝图生成实施计划
  2. ○ /sdd-ff — 重新生成 specs/tasks 以反映函数结构
```

---

## 审查

### 审查提示词

见 `analyze-reviewer-prompt.md`。

### 审查清单

- 函数签名是否完整（函数名、参数、返回值、描述）
- 调用关系是否合理（无循环依赖、无孤立节点）
- 模块划分是否符合 SRP
- 是否覆盖了所有 spec 场景