---
name: sdd-plan
description: "细化实施计划 — 基于 tasks.md 生成 TDD 级别的实施计划，内置 review 循环"
---

# sdd-plan — 细化实施计划

将 tasks.md 中的任务细化为 2-5 分钟粒度的 TDD 实施步骤。

---

## 前置逻辑（SDD 自有）

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 确认 `tasks.md` 存在（plan 的必需输入）

### 2. 读取输入 artifact

按优先级读取：
- **tasks.md**（必需）— 要细化的任务列表
- **specs/**（必需）— 每个 task 引用的 spec 场景
- **design.md**（可选）— 技术设计参考

### 3. 识别批次

如果 plan.md 已存在且有批次记录，确定当前应规划的批次编号。

---

## 核心执行（委托底层 skill）

**invoke `superpowers:writing-plans`**

以下 Override 指令在调用时传递给底层 skill：

### Override 指令

```
SDD Override 指令（必须遵循，优先于 writing-plans skill 的默认行为）：

1. 输出位置：
   - plan 的最终产出写入 openspec/changes/<name>/plan.md
   - 不要写入 docs/superpowers/ 或其他默认位置

2. 模板格式：
   - 使用 schemas/sdd/templates/plan.md 的模板格式
   - 每个任务步骤必须保留 [spec:domain#scenario] 链接

3. 禁止自动转场：
   - plan 完成后，不要自动进入 executing-plans
   - 不要自动调用 subagent-driven-development
   - 完成后停止，等待 SDD 后置逻辑

4. 跳过内置 reviewer：
   - review 由 SDD 的后置逻辑负责

5. TDD 步骤要求：
   - 每个 task 必须包含 RED/GREEN 步骤
   - 每个步骤包含运行验证命令
   - 粒度为 2-5 分钟的工程师操作
```

### 保留的底层行为

- 2-5 分钟粒度的任务拆分
- TDD 红-绿循环结构
- 步骤间的依赖识别
- 风险点标记

---

## 后置逻辑（SDD 自有）

### 1. Plan Review 循环

读取 `plan-reviewer-prompt.md`，dispatch subagent 进行审查：

**审查维度：**
- 任务粒度（每个步骤是否在 2-5 分钟内可完成）
- TDD 步骤完整性（每个任务是否有 RED/GREEN）
- Spec 对齐（plan 中的任务是否覆盖了 tasks.md 的所有任务）
- 运行命令的正确性（测试命令是否合理）

**Review 流程（最多 3 轮）：**
1. Dispatch reviewer subagent，产出 `reviews/plan-r1.md`
2. 有 issues 时展示并修复，重新 review
3. 最多 3 轮

### 2. 产物校验

确认 `plan.md` 存在且：
- 每个 task 有对应的实施步骤
- 包含 TDD 的 RED/GREEN 结构
- 保留了 spec 链接

### 3. 完成引导

```
sdd-plan 完成。

产物已持久化至:
  openspec/changes/<name>/plan.md
  openspec/changes/<name>/reviews/plan-r<N>.md

如需释放上下文，可安全 /clear。

推荐下一步:
  → /sdd-code 开始实施
```
