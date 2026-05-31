---
name: sdd-brainstorm
description: "深度探索设计 — 苏格拉底式探索需求，生成 brainstorm.md，内置 review 循环"
---

# sdd-brainstorm — 深度探索设计

对需求进行深度探索，产出结构化的 brainstorm.md，为后续 proposal 提供决策基础。

---

## 触发条件

**触发**：用户执行 `/sdd-brainstorm`，或说"探索需求""头脑风暴""方案比较""深度设计"且需要澄清需求。
**不触发**：需求已明确可直接提案（→ `/sdd-propose`）；要直接写代码（→ `/sdd-code`）。
**歧义处理**：已有 brainstorm.md 时确认是继续探索还是覆盖。

## 输出约束

禁止输出:
- 开场白（"让我来探索..."）
- 工具调用前后的重复描述
- 未经验证的决策结论
- 已知信息的复述

## 行为准则（整个会话有效，不因对话长度放松）

1. ❗ 每个决策必须引用来源（用户输入 + 探索过程）— 每次输出前自检
2. ❗ 关键决策为空时必须输出警告 — 每次输出前自检
3. ❗ 禁止编造未验证的决策结论 — 每次输出前自检

## 工具优先级

| 操作 | 首选工具 | 降级条件 | 降级工具 |
|------|---------|---------|---------|
| 读取文件 | Read | Read 返回错误 | Bash cat |
| 搜索关键词 | Grep | 连续 2 次失败 | Bash grep |
| 写入文件 | Write | — | — |

- 单次超时 ≠ 工具不可用，必须重试 1 次
- 降级必须标注: "⚠️ 降级: [原因]"

## 零结果与幻觉防护

- 所有决策必须引用来源（用户输入 + 探索过程）
- 无法形成决策时输出"探索未完成，需要更多信息"
- 关键决策为空时输出警告

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

sdd-brainstorm 无前置依赖，校验直接通过。无需检查任何前置制品。

### 0.3 角色加载

**默认角色**: `yc-office-hours`
**可选角色**: `ceo`, `designer`

> 角色加载的完整逻辑（参数解析、优先级规则、查找合并、错误处理）见 `modules/role-system.md`。

### 0.5 拆分模式检测

> 拆分模式的完整逻辑（检测、交互流程、异常处理）见 `modules/split-patterns.md`。

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

### 3.3 状态文件读取
> `node ai-tools-bridge/scripts/state-file.mjs read <change-dir>` — 不存在时从 artifact 重建。

### 3.5 Guidelines 按需加载

> 按需加载规则见 `guidelines/token-optimization.md` §按需加载 Guidelines。

---

## 依赖链声明

**数据传递规则**：
- 后置逻辑的输入 = 核心执行的完整产出（brainstorm.md）
- 禁止重新生成：后续步骤必须引用前序实际产出，不可重新搜索或重新创建
- 产物校验时检查 brainstorm.md 是否包含：需求描述、方案探索、关键决策节

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

**Reviewer Prompt 延迟加载**：仅在进入 review 循环时加载 `brainstorm-reviewer-prompt.md`（不在前置逻辑中预加载）。

读取 `brainstorm-reviewer-prompt.md`，dispatch subagent 进行审查：

**审查维度：**
- 方案完整性（是否覆盖了需求的核心场景）
- 决策清晰度（每个关键决策是否有明确的结论和理由）
- YAGNI 检查（是否包含不需要的功能）
- 可测试性（决策是否导向可验证的结果）

**Review 流程（最多 3 轮）：**

读取 `openspec/config.yaml` 的 `limits.review-rounds`（默认 3）作为上限。

1. Dispatch reviewer subagent，产出 `reviews/brainstorm-r<N>.md`
2. 有 issues → 展示给用户 → 修复后重新 review
3. 达限后提供选项：`① 继续修复`（取消轮次限制）/ `② 接受当前状态并继续`（终止 review）

提示：可在 openspec/config.yaml 的 limits 节中调整上限。

### 2. 产物校验

确认 `brainstorm.md` 存在且包含：
- 需求描述
- 方案探索
- 关键决策节

### 2.5 状态文件更新
> `node ai-tools-bridge/scripts/state-file.mjs update <change-dir> --phase brainstorm`

### 3. 完成引导

输出：
```
sdd-brainstorm 完成。

产物已持久化至:
  openspec/changes/<name>/brainstorm.md
  openspec/changes/<name>/reviews/brainstorm-r<N>.md

如需释放上下文，可安全 /clear。

★ 推荐下一步: /sdd-propose — 固化提案
  ○ /sdd-ff — 需求已充分明确时跳过 propose 直接快进
```
