---
name: sdd-propose
description: "固化提案 — 基于需求或 brainstorm.md 生成 proposal.md，含决策追溯检查"
---

# sdd-propose — 固化提案

将需求或 brainstorm 探索的结果固化为结构化的 proposal.md。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- 如果 `brainstorm.md` 存在，检查其中的关键决策项是否有空项（或包含未替换的 HTML 注释占位符 `<!-- ... -->`）
- 发现有空项 → 输出**警告**：列出具体缺失的决策项，建议用户补充，询问是否强制继续
- 用户确认后可强制继续

### 1. 定位 Change 目录

- 如果用户指定了 change 名称，使用 `openspec/changes/<name>/`
- 如果未指定，扫描 `openspec/changes/` 找到活跃变更
- 如果有多个活跃变更，让用户选择
- 新变更：创建目录

### 2. 读取前置 artifact

- 如果 `brainstorm.md` 存在，读取其中内容
- 提取 brainstorm 中的关键决策列表（用于后置的决策追溯检查）

### 3. 检查依赖

- proposal.md 不依赖 brainstorm.md（可直接跳过 brainstorm 创建 proposal）
- 如果已存在 proposal.md，询问用户是覆盖还是在现有基础上修改

---

## 核心执行（委托底层 skill）

**invoke `openspec-continue-change` 或 `openspec-propose`**

根据当前状态选择：
- 如果 change 目录已存在且有其他 artifact → invoke `openspec-continue-change`
- 如果是全新变更 → invoke `openspec-propose`

传递上下文信息：
- brainstorm.md 的关键决策（如有）
- 用户直接提供的需求描述（如有）

---

## 后置逻辑（SDD 自有）

### 1. 决策追溯检查

如果 brainstorm.md 存在：
- 提取 brainstorm 中的所有关键决策
- 验证 proposal.md 是否引用了每一个关键决策
- 检查格式：`选择 [X] 而非 [Y]：[原因]（见 brainstorm.md §关键决策）`

如果有未追溯的决策：
```
⚠️ 决策追溯检查：以下 brainstorm 决策未在 proposal 中引用：
  - [决策1描述]
  - [决策2描述]
建议补充到 proposal.md 的"决策追溯"节。
```

### 1.5 跨模块影响扫描

读取 proposal.md 的范围节，结合项目结构评估跨模块影响：

1. **前置判断**：如果 proposal.md 的"范围"节已包含跨模块影响分析段落，输出"已检测到跨模块影响分析，跳过扫描"，跳到步骤 2。

2. **扫描项目结构**：
   - 检查 `specs/` 目录下的子目录数量（N）
   - N ≥ 2：执行完整跨模块分析（步骤 3）
   - N ≤ 1 或 `specs/` 不存在：简化为"请确认变更影响的文件/目录范围是否完整"，不修改 proposal，跳到步骤 2

3. **多模块分析**：
   - 读取现有 specs 内容，识别与当前 proposal 主题相关的模块
   - 检查 proposal 的"范围"节是否已提及跨模块影响
   - 如未提及 → 输出警告："⚠️ 当前 proposal 未提及跨模块影响。项目中存在 N 个模块/领域（N = specs/ 下子目录数量），请确认变更范围是否完整。"

4. **用户确认**：
   - "以下模块可能与本次变更相关：[列表]。是否需要纳入范围？"
   - 用户确认纳入 → 将影响项追加到 proposal.md 的"范围 > 包含"节和"决策追溯"节
   - 用户拒绝 → 在决策追溯中记录"已评估跨模块影响，不需要同步"的理由
   - AI 无法确定模块相关性 → 列出所有模块，由用户逐一确认

### 2. 产物校验

确认 `proposal.md` 存在且包含：
- 变更意图和范围
- 决策追溯节（如果 brainstorm 存在）

### 3. 完成引导

```
sdd-propose 完成。

产物已持久化至:
  openspec/changes/<name>/proposal.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 逐步确认 → /sdd-continue
  - 快进生成所有文档 → /sdd-ff

★ 推荐下一步: /sdd-ff — 快进生成所有文档
  ○ /sdd-plan — 直接生成实施计划（需先有 spec+tasks）
  △ /sdd-brainstorm — 回退补充探索
```
