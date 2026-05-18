---
name: sdd-brainstorm
description: "深度探索设计 — 苏格拉底式探索需求，生成 brainstorm.md，内置 review 循环"
---

# sdd-brainstorm — 深度探索设计

对需求进行深度探索，产出结构化的 brainstorm.md，为后续 proposal 提供决策基础。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

sdd-brainstorm 无前置依赖，校验直接通过。无需检查任何前置制品。

### 1. 定位 Change 目录

- 如果用户指定了 change 名称，使用 `openspec/changes/<name>/`
- 如果未指定，询问用户是创建新变更还是继续已有变更
- 新变更：创建目录 `openspec/changes/<name>/`
- 确保目录中有 `reviews/` 子目录

### 2. 读取项目上下文

- 读取项目的技术栈信息（package.json / go.mod / Cargo.toml 等）
- 读取已有的 CLAUDE.md / GEMINI.md（如有）
- 读取 openspec/config.yaml（如有）
- 读取 `openspec/backlog.md`（如有）：
  - 如果存在且表格中含状态为 `open` 的项：
    1. 输出："backlog 中有 N 个 open 项，是否有与当前需求相关的？"
    2. 列出所有 open 项的来源变更和简述
    3. 用户选择关联 → 在 brainstorm.md 的"参考资源"中引用该 backlog 项（格式：`backlog 项: [来源变更] [简述]`）
    4. 用户选择忽略 → 不记录（仅作为上下文参考）
  - 如果不存在或无 open 项：跳过，不输出任何 backlog 相关提示，不创建 backlog.md

### 3. 检查已有 artifact

- 如果 `brainstorm.md` 已存在，告知用户将在此基础上继续探索

---

## 核心执行（委托底层 skill）

**invoke `superpowers:brainstorming`**

以下 Override 指令在调用时传递给底层 skill：

### Override 指令

```
SDD Override 指令（必须遵循，优先于 brainstorming skill 的默认行为）：

1. 输出位置：
   - brainstorm 的最终产出写入 openspec/changes/<name>/brainstorm.md
   - 不要写入 docs/superpowers/ 或其他默认位置

2. 模板格式：
   - 使用 schemas/sdd/templates/brainstorm.md 的模板格式
   - 必须包含"关键决策"节

3. 禁止自动转场：
   - brainstorming 完成后，不要自动进入 writing-plans
   - 不要自动调用任何其他 skill
   - 完成后停止，等待 SDD 后置逻辑

4. 跳过内置 reviewer：
   - 不要调用内置的 review 逻辑
   - review 由 SDD 的后置逻辑负责
```

### 保留的底层行为

- 苏格拉底式提问流程
- 方案探索和多方案比较
- 分段确认机制
- 需求澄清对话

---

## 后置逻辑（SDD 自有）

### 1. Brainstorm Review 循环

读取 `brainstorm-reviewer-prompt.md`，dispatch subagent 进行审查：

**审查维度：**
- 方案完整性（是否覆盖了需求的核心场景）
- 决策清晰度（每个关键决策是否有明确的结论和理由）
- YAGNI 检查（是否包含不需要的功能）
- 可测试性（决策是否导向可验证的结果）

**Review 流程（最多 3 轮）：**
1. Dispatch reviewer subagent，产出 `reviews/brainstorm-r1.md`
2. 如果有 issues：
   - 展示 issues 给用户
   - 用户确认修复方向
   - 修复后重新 review（`reviews/brainstorm-r2.md`）
3. 最多 3 轮，通过或用户接受后停止

### 2. 产物校验

确认 `brainstorm.md` 存在且包含：
- 需求描述
- 方案探索
- 关键决策节

### 3. 完成引导

输出：
```
sdd-brainstorm 完成。

产物已持久化至:
  openspec/changes/<name>/brainstorm.md
  openspec/changes/<name>/reviews/brainstorm-r<N>.md

如需释放上下文，可安全 /clear。

推荐下一步:
  - 逐步确认细节 → /sdd-propose
  - 需求已充分明确 → /sdd-ff

★ 推荐下一步: /sdd-propose — 固化提案
  ○ /sdd-ff — 跳过 propose 直接快进
  △ /sdd-quick — 重新走快速路径
```
