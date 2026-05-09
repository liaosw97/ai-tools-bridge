---
name: ai-tools-bridge
description: "AI工具桥接编排器 — 串联 OpenSpec（规格生成）、Superpowers（深度细化 + 执行）等工具，提供阶段确认、跳过机制、质量检查点，减少心智负担。"
---

# AI Tools Bridge — 开发工作流编排器

统一编排 AI 开发工具链，让每个工具在最合适的阶段发挥作用。

**核心理念：** 每个阶段前确认、可跳过、可暂停。编排器记住状态，下一阶段自动适配。

---

## 启动行为

当用户表达开发意图时（"做一个 X"、"实现 Y"、"帮我开发 Z"），编排器启动：

1. **检测已安装工具** — 扫描当前环境中可用的工具：
   - OpenSpec：检查 `openspec/` 目录或 `openspec` CLI 是否存在
   - Superpowers：检查 superpowers skills 是否可调用
   - 其他：检查 integrations/ 下注册的工具
2. **展示工作流概览** — 列出所有可用阶段及其状态
3. **询问用户从哪里开始** — 提供选项（见下方交互格式）

---

## 工作流阶段

```
Phase 1: 规格生成 ──→ Phase 2: 深度细化 ──→ Phase 3: 任务执行 ──→ Phase 4: 完成收尾
 (OpenSpec)            (Brainstorming)        (Subagent-dev)       (Review+Archive)
  [可跳过]               [可跳过]                [可跳过]              [可跳过]
```

### Phase 1: 规格生成（OpenSpec）

**目标：** 快速建立规格框架，产出结构化文档。

**执行：**
- 调用 `/opsx:explore` 或 `/opsx:propose`
- 产出：`openspec/changes/<name>/` 下的 proposal.md、specs/、tasks.md 骨架

**质量门（通过才能进入下一阶段）：**
- proposal.md 存在且非空
- 至少有一个 spec 文件
- tasks.md 存在（可以为骨架）

**完成后提示：**
> Phase 1 完成。规格已生成到 `openspec/changes/<name>/`。
> 1. 继续 Phase 2（深度细化）
> 2. 暂停，稍后继续
> 3. 跳到其他阶段

### Phase 2: 深度细化（Brainstorming）

**目标：** 基于 Phase 1 的产出，补充技术细节、边界条件、团队规范约束。

**前置输入：**
- 如果 Phase 1 已执行：读取 `openspec/changes/<name>/` 下的所有产出
- 如果 Phase 1 被跳过：让用户指定已有的规格文档路径

**执行：**
- 使用 brainstorming skill 的标准流程
- 但起点不是"从零了解需求"，而是"审查和强化已有规格"
- 重点关注：
  - 技术细节补充（具体的数据结构、接口签名、错误码）
  - 边界条件和异常流
  - 团队规范约束（从 `openspec/config.yaml` 或项目约定读取）
  - 可测试性（每个需求都有验证标准）
- 细化后的内容回写到 `openspec/changes/<name>/` 对应文件

**质量门：**
- 无 TBD、TODO、或模糊描述
- 每个需求可映射到具体的验证方式
- 无内部矛盾
- scope 合理（一个实现周期能完成）

**完成后提示：**
> Phase 2 完成。设计已细化。
> 1. 继续 Phase 3（任务执行）
> 2. 暂停，稍后继续
> 3. 跳到其他阶段

### Phase 3: 任务执行（Subagent-dev）

**目标：** 读取强化后的 tasks.md，按任务逐一实现。

**前置输入：**
- 如果 Phase 2 已执行：读取强化后的 `openspec/changes/<name>/tasks.md`
- 如果 Phase 2 被跳过但 Phase 1 执行了：读取 Phase 1 的 tasks.md
- 如果 Phase 1 也跳过了：让用户指定 tasks 文件路径

**执行：**
- **跳过 writing-plans skill** — 直接使用已有的 tasks.md
- 如果 tasks.md 粒度不够细（每个任务超过 2-5 分钟工作量），先将其拆分为更细粒度的子任务
- 使用 `superpowers:subagent-driven-development` 执行
- 每个任务完成后执行 spec compliance + code quality 双重审查

**质量门：**
- 所有 tasks.md 中的任务标记为完成
- 测试通过
- 无遗留的 spec 合规问题

**完成后提示：**
> Phase 3 完成。所有任务已实现。
> 1. 继续 Phase 4（完成收尾）
> 2. 暂停，稍后继续
> 3. 跳到其他阶段

### Phase 4: 完成收尾

**目标：** 代码审查、验证、归档。

**执行：**
1. `superpowers:requesting-code-review` — 整体代码审查
2. `superpowers:verification-before-completion` — 验证所有测试和功能
3. `superpowers:finishing-a-development-branch` — 分支管理（合并/PR）
4. `/opsx:archive` — 归档变更记录

**质量门：**
- Code review 通过
- 所有验证命令成功
- 变更已归档

**完成后：**
> Phase 4 完成。工作流结束。变更已归档。

---

## 交互格式

### 启动时

```
编排器: 开发工作流已启动。检测到以下工具:
  ✅ OpenSpec (规格管理)
  ✅ Superpowers (执行纪律)

  当前工作流:
  Phase 1 (规格生成)    ⬜ 待执行
  Phase 2 (深度细化)    ⬜ 待执行
  Phase 3 (任务执行)    ⬜ 待执行
  Phase 4 (完成收尾)    ⬜ 待执行

  请选择:
  1. 从 Phase 1 开始（完整流程）
  2. 跳到 Phase 2（已有 OpenSpec 产出）
  3. 跳到 Phase 3（已有设计文档，直接实现）
  4. 只执行 Phase 4（收尾审查）
  5. 自定义：指定要执行的阶段
```

### 阶段间

```
编排器: Phase N 完成。[简要总结产出]
  下一阶段: Phase N+1 (名称)

  1. 继续执行
  2. 暂停，稍后继续
  3. 跳过此阶段
  4. 跳到其他阶段
```

### 恢复时

当用户在后续对话中说"继续开发"、"继续上次的工作"时：
1. 扫描 `openspec/changes/` 找到进行中的变更
2. 检查哪些产出已存在，推断当前停留在哪个阶段
3. 展示状态并询问从哪里继续

---

## 跳过逻辑

当阶段被跳过时，编排器自动适配后续阶段的输入来源：

| 跳过场景 | 后续阶段行为 |
|----------|-------------|
| 跳过 Phase 1 | Phase 2 要求用户指定已有规格文档路径 |
| 跳过 Phase 2 | Phase 3 直接使用 Phase 1 的原始 tasks.md（提醒：未经细化，可能粒度不够） |
| 跳过 Phase 1+2 | Phase 3 要求用户指定 tasks 文件或手动描述任务 |
| 跳过 Phase 3 | Phase 4 只做审查和归档（代码已存在） |

**跳过警告：** 当跳过会明显影响质量时，编排器应提醒，但不阻止。例如：
> ⚠️ 跳过 Phase 2 意味着 tasks.md 未经细化，可能缺少边界条件和团队规范约束。建议至少做一次快速审查。

---

## 质量门规则

每个阶段结束时，编排器自动执行对应的质量门检查。检查不通过时：

1. 列出具体的不通过项
2. 提供选项：
   - 修复后重试（留在当前阶段）
   - 接受风险，继续下一阶段
   - 暂停

质量门检查引用 `guidelines/quality-checkpoints.md` 中的标准。

---

## 工具检测

编排器启动时检测可用工具，动态调整工作流：

- **OpenSpec 不可用：** Phase 1 标记为不可用，建议用户手动提供规格文档
- **Superpowers 不可用：** Phase 2 退化为普通对话式设计，Phase 3 退化为手动逐步执行
- **两者都不可用：** 编排器仍可作为工作流指引使用，但功能受限

---

## 内置指南

编排器在以下时机自动引用对应指南：

| 指南 | 何时引用 |
|------|---------|
| `guidelines/quality-checkpoints.md` | 每个阶段的质量门检查 |
| `guidelines/decision-strategy.md` | 执行过程中遇到模糊需求或决策点 |
| `guidelines/token-optimization.md` | 整个流程中持续应用 |
| `guidelines/team-standards.md` | Phase 2 细化时、Phase 3 执行时 |
| `integrations/tool-template.md` | 用户想接入新工具时 |

---

## Token 优化策略

编排器自身遵循以下原则，同时指导各阶段的 token 使用：

1. **不重复加载** — 编排器已包含各阶段的概要，不需要再加载子 skill 的完整引导
2. **按需读取指南** — 只在需要时读取 guidelines/ 文件，不一次性全部加载
3. **精简 context 传递** — subagent 只传递当前任务需要的 context，不传整个 specs
4. **模型分层** — 遵循 subagent-driven-development 的模型选择策略
5. **状态持久化** — 工作流状态写入文件（`openspec/changes/<name>/.workflow-state`），跨会话恢复时不需要重新探索

详细的 token 优化策略见 `guidelines/token-optimization.md`。

---

## 工作流状态文件

每个变更的工作流状态保存在 `openspec/changes/<name>/.workflow-state`：

```yaml
change: <name>
phases:
  phase1:
    status: completed | skipped | pending | in_progress
    completed_at: YYYY-MM-DDTHH:mm:ss
  phase2:
    status: ...
  phase3:
    status: ...
  phase4:
    status: ...
current_phase: N
```

恢复时读取此文件确定当前进度。
