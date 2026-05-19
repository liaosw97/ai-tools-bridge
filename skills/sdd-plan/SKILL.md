---
name: sdd-plan
description: "细化实施计划 — 基于 tasks.md 生成 TDD 级别的实施计划，内置 review 循环"
---

# sdd-plan — 细化实施计划

将 tasks.md 中的任务细化为 2-5 分钟粒度的 TDD 实施步骤。

---

## 触发条件

**触发**：用户执行 `/sdd-plan`，或说"生成计划""细化任务""TDD 计划""实施计划"。
**不触发**：要直接编码（→ `/sdd-code`）；要审查 spec（→ `/sdd-review-spec`）。
**歧义处理**：多个活跃变更时让用户选择；plan.md 已存在时确认覆盖或追加批次。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

检查必需制品是否存在：

- **tasks.md 不存在** → 阻断：输出"缺少 tasks.md，请先执行 /sdd-ff 生成任务"
- **tasks.md 存在但内容为空** → 阻断：输出"tasks.md 无任务项，请先执行 /sdd-ff 生成任务"
- **specs/ 目录下无 spec 文件** → 阻断：输出"缺少 spec 文件，请先执行 /sdd-ff 生成规格"
- **tasks 中部分任务缺少 `[spec:domain#scenario]` 链接** → 警告：输出缺少链接的任务列表，建议补充
- 阻断级缺失时拒绝执行，输出具体缺失项和修复建议

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 确认 `tasks.md` 存在（plan 的必需输入）

### 2. 读取输入 artifact

按优先级读取：
- **tasks.md**（必需）— 要细化的任务列表
- **specs/**（必需）— 每个 task 引用的 spec 场景
- **design.md**（可选）— 技术设计参考

### 3. 任务规模检测

统计 tasks.md 中的任务数量，判断规模：

> **注**：本阈值用于 plan 生成模式选择（分批/一次性），与 sdd-doctor 的路径推荐评级（简单/中等/复杂）是不同维度，两者独立。

| 规模 | 任务数量 | 处理策略 |
|------|----------|----------|
| 小型（≤10） | ≤10 | 正常生成完整 plan |
| 中型（11-25） | 11-25 | 提示用户选择模式 |
| 大型（>25） | >25 | 强建议拆分或分批 |

#### 小型（≤10）

跳过规模判断提示，直接生成完整 plan.md。

#### 中型（11-25）

输出任务规模提示："当前 tasks 包含 N 项任务，属于中等规模"，询问用户选择：
- **一次性生成** — 生成完整 plan.md（与小型相同）
- **分批生成** — 按依赖关系分批，逐批生成

#### 大型（>25）

输出强建议提示："当前 tasks 包含 N 项任务，属于大型变更"，提供两个选项：
- **拆分为多个 change** — 建议回到 /sdd-propose 重新规划范围，将当前需求拆分为多个独立 change。当前 plan 生成终止。
- **分批生成** — 在当前 change 内分批生成 plan

### 4. 识别批次

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

### 分批生成模式

当用户选择分批生成时：

1. 将 tasks.md 中的任务按依赖关系分为 N 批（每批 5-10 个任务）
2. 逐批生成：生成第 1 批写入 plan.md（带批次标记），询问用户是否继续下一批
3. 用户确认后生成第 2 批追加到 plan.md，直到所有批次完成
4. 每批之间有明确的 checkpoint 标记

#### plan.md 批次格式

```
## 批次 1/N：[批次标题]

<!-- 依赖：[前置依赖说明] -->
<!-- 任务范围：[task 编号列表] -->

[批次内的 TDD 步骤...]

--- checkpoint ---
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

**分批模式审查：**
- 按批次独立审查，每批检查 TDD 步骤完整性、Spec 对齐、依赖顺序
- 跨批次依赖关系的一致性在最后一批审查时检查

**Review 流程（最多 3 轮）：**
1. Dispatch reviewer subagent，产出 `reviews/plan-r1.md`
2. 有 issues 时展示给用户
3. 用户确认修复方向
4. 修复后重新 review（`reviews/plan-r2.md`）
5. 最多 3 轮，通过或用户接受后停止

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

★ 推荐下一步: /sdd-code — 开始 TDD 实施
  ○ /sdd-review-spec — 先审查 spec 质量
```
