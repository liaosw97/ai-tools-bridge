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

## 零结果与幻觉防护

- 所有决策必须引用来源（用户输入 + 探索过程）
- 无法形成决策时输出"探索未完成，需要更多信息"
- 关键决策为空时输出警告

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

读取 `openspec/config.yaml` 的 `limits.review-rounds` 配置值（默认 3），作为 review 循环上限。

**配置值验证**：
- 配置项不存在 → 使用默认值 3
- 配置项值为非数字类型 → 使用默认值 3
- 配置项值为 0 或负数 → 使用默认值 3

Review 流程：
1. Dispatch reviewer subagent，产出 `reviews/brainstorm-r1.md`
2. 如果有 issues：
   - 展示 issues 给用户
   - 用户确认修复方向
   - 修复后重新 review（`reviews/brainstorm-r2.md`）
3. 最多 N 轮（N = limits.review-rounds），通过或用户接受后停止

**Review 达限处理**：

当 review 循环达到 `limits.review-rounds`（默认 3）轮次时：
1. 输出已达 review 上限的提示
2. 列出剩余未解决的 issues
3. 提供选项：
   - `① 继续修复` — 进入下一轮 review，不再有轮次限制
   - `② 接受当前状态并继续` — 终止 review 循环，在 review 文件中标注"用户接受，剩余 issues 未修复"，进入后置逻辑
4. 提示消息包含可发现性信息："可在 openspec/config.yaml 的 limits 节中调整上限"

**用户选择"继续修复"后**：
- 取消轮次限制
- 进入下一轮 review，直到所有 issues 解决或用户主动选择接受
- 每轮修复结束时再次提供"继续修复"或"接受并继续"选项
- 如果 AI 无法解决某些 issues（技术限制/需求冲突），用户可通过"接受并继续"选项退出

**用户选择"接受并继续"后**：
- review 循环终止
- 在 review 文件中标注"用户接受，剩余 issues 未修复"
- 进入后置逻辑的产物校验和完成引导

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

★ 推荐下一步: /sdd-propose — 固化提案
  ○ /sdd-ff — 需求已充分明确时跳过 propose 直接快进
```
