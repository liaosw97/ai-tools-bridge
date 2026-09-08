---
name: sdd-hotfix
description: "hotfix 修复 — bug 修复与细小改动的调试轨，目标 10-15 分钟闭环：定位根因 → 最小修复 → 测试 → 提交 → hotfix.md 卡片留痕。产物仅卡片，不生成 proposal/spec/tasks"
---

# sdd-hotfix — 快速修复

用调试认知模型完成 bug 修复/细小改动，产物收敛为 1 份 hotfix.md 卡片。

---

<!-- include: ../_shared/base-triggers.md -->

**触发**：用户执行 `/sdd-hotfix`，或说"改个 bug""小修复""修一下""这个功能坏了""报错了""hotfix"。
**不触发**：小型**新功能**（→ `/sdd-quick`）；复杂需求涉及架构/跨模块重构（→ 标准路径 `/sdd-propose`）；要深度探索（→ `/sdd-brainstorm`）。
**歧义处理**：修复还是新功能不明时，询问用户确认；涉及存量模块的小改动默认走 hotfix。

<!-- include: ../_shared/output-constraints.md -->

<!-- include: ../_shared/scope-box.md -->

<!-- include: ../_shared/hotfix-mode.md -->

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- 无前置 artifact 依赖（hotfix 不进依赖链）
- 注：sdd-hotfix 为调试修复流程，不适用统一角色视角（无角色加载）

### 0.5 读取 Limits 配置

读取 `openspec/config.yaml` 的 `limits` 节（scope-box.md §2 定义默认值）：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `hotfix-locate-rounds` | 3 | 定位尝试轮数上限，达限提示升轨 |
| `hotfix-max-files` | 2 | 改动源文件盒 |
| `hotfix-max-scenarios` | 3 | 测试场景盒 |

配置值无效/缺失 → 使用默认值。

### 1. 入口判定

判断是否真 hotfix（命中任一"不可 hotfix 信号"→ 拒绝并引导升轨 `/sdd-propose`）：

- 修改公共接口签名
- 跨 2+ 模块
- 需要数据迁移
- 需要设计决策（有 2+ 候选方案）
- 需求描述含"架构""重构""迁移"等关键词

### 2. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更（或按 bug 描述新建 hotfix change 目录 `<fix-<简述>>`）
- 无活跃变更时创建新 change 目录（名称建议 `fix-<问题简述>`）

---

## 核心执行（SDD 自有 + 精简委托）

### 3. 预估告知

根据现象先给预估（仅告知不判定）："预期约 X 分钟（改动 ≤2 源文件 + 回归测试）"。

### 4. 定位根因

按 hotfix-mode.md 调试认知模型：

1. 复现（无法复现 → 卡片记录现象与尝试步骤，标注"未复现"）
2. 二分定位根因（含 文件:行）
3. 尝试达 N 轮（默认 3）仍未定位 → 提示升轨，不再无限排查

### 5. 修复确认

向用户陈述根因 + 最小改动方案，**一行确认后动手**。

### 6. 最小修复 + 测试

- 按 hotfix-mode.md：只改必要代码、补/跑回归测试（TDD 紧凑循环）
- 明确影响范围

### 7. 提交

- 单一 commit，message 前缀 `hotfix(<name>):`

---

## 后置逻辑（SDD 自有）

### 1. 卡片留痕

写入 `openspec/changes/<name>/hotfix.md`（模板见 `schemas/sdd/templates/hotfix.md`）：

- 现象 / 根因(文件:行) / 修复(文件+影响范围) / 验证(命令+结果+未覆盖) / 衍生(延后项→backlog)

### 2. 产物校验

- 确认 hotfix.md 已生成，结构完整
- 确认改动未超盒（>2 源文件或 >3 场景 → 触发升轨流程，scope-box.md §3）
- 快速检查：无敏感信息硬编码

### 3. 完成引导

```
sdd-hotfix 完成。

产物已持久化至:
  openspec/changes/<name>/hotfix.md

推荐下一步:
  1. ★ /sdd-ship — 轻量归档（hotfix 豁免三步校验）
  2. ○ /sdd-doctor — 查看修复历史
  3. △ 若修复衍生出新需求 → /sdd-propose 新建 feature change
```

如需释放上下文，可安全 /clear。
