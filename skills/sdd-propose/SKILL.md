---
name: sdd-propose
description: "固化提案 — 基于需求或 brainstorm.md 生成 proposal.md，含决策追溯检查"
---

# sdd-propose — 固化提案

将需求或 brainstorm 探索的结果固化为结构化的 proposal.md。

---

## 前置逻辑（SDD 自有）

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
```
