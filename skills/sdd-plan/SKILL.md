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

## 输出约束

禁止输出:
- 开场白（"让我来生成计划..."）
- 工具调用前后的重复描述
- 未引用 tasks 或 spec 条文的计划步骤
- 已知信息的复述

## 零结果与幻觉防护

- 所有计划步骤必须引用来源（tasks.md + spec 文件路径）
- tasks.md 为空时输出"tasks.md 无任务项"而非编造计划
- 无法定位 spec 时标注"⚠️ 无法找到对应 spec"

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

检查必需制品是否存在：

- **tasks.md 不存在** → 阻断：输出"缺少 tasks.md，请先执行 /sdd-ff 生成任务"
- **tasks.md 存在但内容为空** → 阻断：输出"tasks.md 无任务项，请先执行 /sdd-ff 生成任务"
- **specs/ 目录下无 spec 文件** → 阻断：输出"缺少 spec 文件，请先执行 /sdd-ff 生成规格"
- **tasks 中部分任务缺少 `[spec:domain#scenario]` 链接** → 警告：输出缺少链接的任务列表，建议补充
- 阻断级缺失时拒绝执行，输出具体缺失项和修复建议

### 0.3 角色加载

**默认角色**: `eng-manager`
**可选角色**: `ceo`

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更
- 确认 `tasks.md` 存在（plan 的必需输入）

### 2. 读取输入 artifact

按优先级读取：
- **tasks.md**（必需）— 要细化的任务列表
- **specs/**（必需）— 每个 task 引用的 spec 场景
- **design.md**（可选）— 技术设计参考

### 2.5 功能树读取（拆分模式）

当 brainstorm.md 包含"## 功能拆分"节时，执行以下逻辑：

1. **解析功能树**：
   - 识别 Markdown 嵌套列表格式（L1/L2/L3 层级）
   - 提取叶子节点列表（无子节点的功能单元）

2. **叶子节点提取**：
   - 输出格式：`[模块/单元/功能点]` 路径
   - 用于后续任务组标注 `[unit:模块/单元/功能点]`

3. **无功能拆分节时**：跳过此步骤，使用原有 tasks.md 结构

### 3. 任务规模检测与批次识别

> 任务规模检测的完整逻辑（阈值判断、用户选择）见 `modules/batch-mode.md`。

如果 plan.md 已存在且有批次记录，确定当前应规划的批次编号。

### 3.5 Guidelines 按需加载

> 按需加载规则见 `guidelines/token-optimization.md` §按需加载 Guidelines。

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

> 分批生成模式的完整逻辑（批次划分、依赖检测、循环依赖处理）见 `modules/batch-mode.md`。

### 保留的底层行为

- 2-5 分钟粒度的任务拆分
- TDD 红-绿循环结构
- 步骤间的依赖识别
- 风险点标记

---

## 后置逻辑（SDD 自有）

### 1. Plan Review 循环

**Reviewer Prompt 延迟加载**：仅在进入 review 循环时加载 `plan-reviewer-prompt.md`（不在前置逻辑中预加载）。

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

读取 `openspec/config.yaml` 的 `limits.review-rounds` 配置值（默认 3），作为 review 循环上限。

**配置值验证**：
- 配置项不存在 → 使用默认值 3
- 配置项值为非数字类型 → 使用默认值 3
- 配置项值为 0 或负数 → 使用默认值 3

Review 流程：
1. Dispatch reviewer subagent，产出 `reviews/plan-r1.md`
2. 有 issues 时展示给用户
3. 用户确认修复方向
4. 修复后重新 review（`reviews/plan-r2.md`）
5. 最多 N 轮（N = limits.review-rounds），通过或用户接受后停止

**Review 达限处理**：

当 review 循环达到 `limits.review-rounds`（默认 3）轮次时：
1. 输出已达 review 上限的提示
2. 列出剩余未解决的 issues
3. 提供选项：
   - `① 继续修复` — 进入下一轮 review，不再有轮次限制
   - `② 接受当前状态并继续` — 终止 review 循环，在 review 文件中标注"用户接受，剩余 issues 未修复"
4. 提示消息包含可发现性信息："可在 openspec/config.yaml 的 limits 节中调整上限"

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
