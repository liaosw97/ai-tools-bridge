# AI Tools Bridge — AI 开发工作流编排器

统一编排 OpenSpec + Superpowers 工具链，减少心智负担，提高代码生成准确率。

## 它解决什么问题

同时使用 OpenSpec 和 Superpowers 时会遇到：

- **重复加载** — 两个插件的引导指令同时注入，还没开始就消耗大量 token
- **流程冲突** — brainstorming 和 opsx:explore 功能重叠，AI 不知道用哪个
- **文档碎片** — 设计文档分散在 `docs/superpowers/` 和 `openspec/changes/` 两处
- **心智负担** — 每次开发都要想"现在该用哪个工具、走哪个流程"

AI Tools Bridge 把它们串成一个清晰的、可控制的流水线。

## 工作流

```
Phase 1: 规格生成 ──→ Phase 2: 深度细化 ──→ Phase 3: 任务执行 ──→ Phase 4: 完成收尾
 (OpenSpec)            (Brainstorming)        (Subagent-dev)       (Review+Archive)
```

| 阶段 | 工具 | 做什么 | 可跳过 |
|------|------|--------|--------|
| Phase 1 | OpenSpec | 快速生成结构化规格（proposal + specs + tasks 骨架） | 是 |
| Phase 2 | Superpowers Brainstorming | 基于已有规格进行深度细化，补充技术细节和团队规范 | 是 |
| Phase 3 | Superpowers Subagent-dev | 读取 tasks.md 逐一实现，双重审查（spec + quality） | 是 |
| Phase 4 | Superpowers + OpenSpec | 代码审查、验证、分支管理、归档 | 是 |

**每个阶段执行前都会确认**，你可以选择执行、跳过或暂停。

## 核心特性

### 阶段确认 + 跳过

启动时展示完整工作流，你决定从哪里开始：

```
编排器: 当前工作流:
  Phase 1 (规格生成)    ⬜ 待执行
  Phase 2 (深度细化)    ⬜ 待执行
  Phase 3 (任务执行)    ⬜ 待执行
  Phase 4 (完成收尾)    ⬜ 待执行

  请选择:
  1. 从 Phase 1 开始（完整流程）
  2. 跳到 Phase 2（已有 OpenSpec 产出）
  3. 跳到 Phase 3（已有设计文档，直接实现）
  4. 自定义
```

每个阶段完成后也会询问：继续 / 暂停 / 跳到其他阶段。

### 质量门

每个阶段结束自动执行检查：
- Phase 1：规格文件完整、无空壳
- Phase 2：无模糊描述、无占位符、需求可验证
- Phase 3：测试通过、spec 合规、无幻觉函数
- Phase 4：代码审查通过、变更已归档

### 四个内置指南

| 指南 | 作用 |
|------|------|
| `quality-checkpoints.md` | AI 编码错误检查、安全检查、测试覆盖检查 |
| `decision-strategy.md` | 何时 AI 自主决策、何时必须问用户、模糊需求处理 |
| `token-optimization.md` | 各阶段的 token 节省策略、模型分层、按需加载 |
| `team-standards.md` | 错误处理规范、日志规范、安全检查清单、测试规范 |

### 可扩展

通过 `integrations/tool-template.md` 接入新工具。定义阶段映射、输入输出、质量门即可。

## 前置依赖

| 工具 | 必需 | 作用 |
|------|------|------|
| [OpenSpec](https://github.com/nickmilo/OpenSpec) | 推荐 | 规格管理（Phase 1 + Phase 4 归档） |
| [Superpowers](https://github.com/obra/superpowers) | 推荐 | 执行纪律（Phase 2 + Phase 3 + Phase 4） |

两个都未安装时，编排器仍可作为工作流指引使用，但功能受限。

## 安装

### 方式一：从 Marketplace 安装（推荐）

添加 marketplace 后安装插件：

```bash
# 添加 marketplace
claude plugin marketplace add <your-username>/ai-tools-bridge

# 安装插件
claude plugin install ai-tools-bridge
```

或在 Claude Code 中使用命令：
```
/plugin marketplace add <your-username>/ai-tools-bridge
/plugin install ai-tools-bridge
```

### 方式二：直接从 GitHub 安装

```bash
claude plugin add https://github.com/<your-username>/ai-tools-bridge
```

### 方式三：从本地安装

```bash
git clone https://github.com/<your-username>/ai-tools-bridge.git
claude plugin add /path/to/ai-tools-bridge
```

## 使用

安装后在 Claude Code 中正常对话即可。当你说"做一个 X"、"实现 Y"等开发意图时，编排器会自动启动。

### 典型流程

```
你: 帮我实现用户认证功能

编排器: 开发工作流已启动。
  ✅ OpenSpec (规格管理)
  ✅ Superpowers (执行纪律)

  从 Phase 1 开始...

[Phase 1: OpenSpec 生成规格]

编排器: Phase 1 完成。继续 Phase 2？
  1. 继续  2. 暂停  3. 跳过

你: 1

[Phase 2: Brainstorming 细化设计]

编排器: Phase 2 完成。继续 Phase 3？
你: 1

[Phase 3: Subagent 逐一实现]

编排器: Phase 3 完成。继续 Phase 4？
你: 1

[Phase 4: 审查 + 归档]

编排器: Phase 4 完成。工作流结束。
```

### 恢复中断的工作

```
你: 继续上次的工作

编排器: 找到进行中的变更: user-auth
  Phase 1 ✅  Phase 2 ✅  Phase 3 ⬜ (进行中)
  从 Phase 3 继续？
```

## 目录结构

```
ai-tools-bridge/
├── skills/
│   └── workflow-orchestrator/
│       └── SKILL.md               # 主编排器（工作流逻辑、确认机制、跳过逻辑）
├── .claude-plugin/
│   └── plugin.json                # Claude Code 插件元数据
├── guidelines/
│   ├── quality-checkpoints.md     # 代码质量检查点
│   ├── decision-strategy.md       # 决策策略指引
│   ├── token-optimization.md      # Token 优化策略
│   └── team-standards.md          # 团队规范检查
└── integrations/
    └── tool-template.md           # 新工具接入模板
```

## 接入新工具

1. 复制 `integrations/tool-template.md` 作为模板
2. 填写工具信息、阶段映射、输入输出
3. 更新 `SKILL.md` 中的工具检测和阶段描述
4. 测试验证

详见 `integrations/tool-template.md`。
