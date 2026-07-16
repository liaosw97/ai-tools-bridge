---
name: sdd-plan
description: "细化实施计划 — 基于 tasks.md 生成 TDD 级别的实施计划，内置 review 循环"
---

# sdd-plan — 细化实施计划

将 tasks.md 中的任务细化为 2-5 分钟粒度的 TDD 实施步骤。

---

<!-- include: ../_shared/base-triggers.md -->

**触发**：用户执行 `/sdd-plan`，或说"生成计划""细化任务""TDD 计划""实施计划"。
**不触发**：要直接编码（→ `/sdd-code`）；要审查 spec（→ `/sdd-review-spec`）。
**歧义处理**：多个活跃变更时让用户选择；plan.md 已存在时确认覆盖或追加批次。

<!-- include: ../_shared/output-constraints.md -->

<!-- include: ../_shared/change-registry.md -->

## 前置逻辑（SDD 自有）

### 0. 前置校验

检查必需制品是否存在：

- **tasks.md 不存在** → 阻断：输出"缺少 tasks.md，请先执行 /sdd-ff 生成任务"
- **tasks.md 存在但内容为空** → 阻断：输出"tasks.md 无任务项，请先执行 /sdd-ff 生成任务"
- **specs/ 目录下无 spec 文件** → 阻断：输出"缺少 spec 文件，请先执行 /sdd-ff 生成规格"
- **tasks 中部分任务缺少 `[spec:domain#scenario]` 链接** → 警告：输出缺少链接的任务列表，建议补充
- 阻断级缺失时拒绝执行，输出具体缺失项和修复建议

<!-- include: ../_shared/role-loading.md -->

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
- **functions.md**（可选）— 函数蓝图，含函数签名和调用链

### 2.3 读取函数蓝图（可选）

- 检查 `openspec/changes/<name>/functions.md` 是否存在
- 存在 → 读取函数签名和调用关系，获取模块→功能→函数的层次结构及函数间调用链
- 不存在 → 跳过，按原有流程基于 tasks.md 编排

### 2.5 功能树读取（拆分模式）

当 brainstorm.md 包含"## 功能拆分"节时，执行以下逻辑：

1. **解析功能树**：
   - 识别 Markdown 嵌套列表格式（L1/L2/L3 层级）
   - 提取叶子节点列表（无子节点的功能单元）

2. **叶子节点提取**：
   - 输出格式：`[模块/单元/功能点]` 路径
   - 用于后续任务组标注 `[unit:模块/单元/功能点]`

3. **无功能拆分节时**：跳过此步骤，使用原有 tasks.md 结构

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
- **拆分为多个 change** — 建议回到 /sdd-propose 重新规划范围，将当前需求拆分为多个独立 change。当前 plan 生成终止。或进入拆分流程（详见下方"拆分流程"）
- **分批生成** — 在当前 change 内分批生成 plan

### 拆分流程（大型变更选择"拆分为多个 change"时触发）

1. 询问用户输入子 change 名称，输出命名规范建议：`<original-name>-part<N>`
2. 用户确认名称后进入文件复制等后续步骤
3. 用户取消则输出"已取消拆分"，当前状态不变

### 创建子 change 目录并复制文件

1. 创建 `openspec/changes/<child-name>/` 目录
2. 复制制品（选择性复制）：
   - 复制父 change 的 `brainstorm.md` → 子 change 目录
   - 复制父 change 的 `proposal.md` → 子 change 目录
   - 复制父 change 的 `specs/` 目录（递归）→ 子 change 目录
   - 复制父 change 的 `design.md`（如有）→ 子 change 目录
   - 不复制 `plan.md`、`reviews/` 目录
3. 不覆盖子 change 已有文件

### tasks.md 过滤分配（A+C 混合模式）

1. AI 按以下优先级分配任务：
   a. 优先按 `[unit:...]` 标注自动分配——标注匹配的子 change 功能单元的任务归入该子 change
   b. 无标注的任务按功能语义推荐分配
   c. 一次性展示推荐分配结果，用户整体确认或逐条调整
   d. 每个任务条目只分配到一个子 change
2. 用户确认：
   - 确认 → 继续注册表更新
   - 取消 → 输出"已取消拆分"，当前状态不变
3. 分配完成后：
   - 子 change 生成过滤后的 tasks.md
   - 父 change 的 tasks.md 中将已分配任务标记为 `[delegated:<child-name>]`

### 更新注册表

1. 在 `change-registry.yaml` 中记录：
   - 父 change 记录（如不存在则创建）
   - 子 change 记录（name/status/parent/description/tags/depends_on/created）
   - 父 change 的 `children` 字段列出所有子 change 名称
2. 提示用户可设置子 change 的 `description`、`tags`、`depends_on` 字段

### 生成 inherited-specs.md

在子 change 目录创建 `inherited-specs.md`，结构如下：

```markdown
## 来源 Change
- 名称: <parent-change-name>
- 拆分日期: <YYYY-MM-DD>

## 继承的 Spec 场景
<列出从父 change 继承的 spec 场景列表>

## 未继承的依赖项
<列出有间接依赖但未包含的场景（如有）>

## 刷新记录
- 创建时快照：<YYYY-MM-DD>
- 最后同步：同上（静态快照，不自动同步）
```

父 change 无 specs/ 目录时，"继承的 Spec 场景"标记为"无"。
文件已存在时跳过生成。

### 拆分后输出引导（拆分流程完成后）

输出以下信息：
```
已拆分为多个 change。

子 change: <child-name>
路径: openspec/changes/<child-name>/
继承文档:
  - brainstorm.md
  - proposal.md
  - specs/
  - tasks.md

推荐下一步:
  ① /sdd-plan <child-name> — 进入子 change 的 plan 生成
  ② /sdd-code — 继续当前 change 的剩余任务
```

注意：所有命令使用 `/sdd-` 前缀（方案 C 吸收，禁止输出 `/opsx:` 命令）。

### 3. 完成引导（命令输出格式规范）

完成引导中的所有命令**必须使用 `/sdd-` 前缀**，禁止输出 `/opsx:` 命令。

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

### 按函数蓝图编排批次

如果 functions.md 存在，在编排批次时：

1. **按模块分组**：将 tasks.md 中的任务按 functions.md 的模块定义分组，确保同模块任务在同一批次或相邻批次
2. **按调用链排序**：分析函数间的调用关系（调用链），被依赖的函数所在的任务排在前面实施
3. **标注函数签名**：在 plan.md 的 TDD 步骤中引用对应函数签名，格式：`[func:<模块>/<功能>/<函数名>]`
4. **流程级测试批次**：在相关函数全部实现后，安排流程级测试批次验证函数间契约

#### 无 functions.md 时的降级

如果 functions.md 不存在，按原有流程基于 tasks.md 描述编排，不阻塞。

### 依赖检测（拆分模式）

当功能树解析完成后，执行以下依赖检测：

**数据依赖检测**：
- 规则：分析功能单元间的数据流关系
- 检测方法：检查功能单元 B 是否使用功能单元 A 的输出数据
- 输出格式：`"[功能单元 B] 可能依赖 [功能单元 A]（数据流）"`

**API 依赖检测**：
- 规则：分析功能单元间的接口调用关系
- 检测方法：检查功能单元 B 是否调用功能单元 A 的 API
- 输出格式：`"[功能单元 B] 可能依赖 [功能单元 A]（API 调用）"`

**UI 依赖检测**：
- 规则：分析功能单元间的组件嵌套关系
- 检测方法：检查功能单元 B 的组件是否嵌入功能单元 A 的页面
- 输出格式：`"[功能单元 B] 可能依赖 [功能单元 A]（UI 嵌套）"`

**循环依赖处理**：
- 检测到循环依赖（A→B→A）时：
  1. 输出警告：`"⚠️ 检测到循环依赖：[功能单元 A] ↔ [功能单元 B]"`
  2. 提供解决方案：
     - ① 合并为同一功能单元
     - ② 引入中间层解耦
     - ③ 用户手动指定执行顺序
  3. 用户选择后调整 plan.md 任务顺序

**用户确认依赖顺序**：
- 检测到依赖关系时，询问用户是否调整任务顺序
- 用户确认调整 → 在 plan.md 中添加依赖标注
- 用户拒绝调整 → 标注"用户确认忽略依赖风险"

**任务组标注格式**：
- 在 plan.md 任务标题后添加：`[unit:模块/单元/功能点]`
- 标注示例：`### Task 1.1: 实现用户列表功能 [unit:用户管理/用户列表]`

---

## 后置逻辑（SDD 自有）

### 1. Plan Review 循环

读取 `plan-reviewer-prompt.md`，dispatch subagent 进行审查。

<!-- include: ../_shared/review-loop.md -->

**Review 流程（最多 3 轮）：**

读取 `openspec/config.yaml` 的 `limits.review-rounds` 配置值（默认 3），作为 review 循环上限。

**分批模式审查：**
- 按批次独立审查，每批检查 TDD 步骤完整性、Spec 对齐、依赖顺序
- 跨批次依赖关系的一致性在最后一批审查时检查

**Review 达限处理**：

当 review 循环达到 `limits.review-rounds`（默认 3）轮次时：
1. 输出已达 review 上限的提示
2. 列出剩余未解决的 issues
3. 提供选项：
   - `① 继续修复` — 进入下一轮 review，不再有轮次限制
   - `② 接受当前状态并继续` — 终止 review 循环，在 review 文件中标注"用户接受，剩余 issues 未修复"，进入后置逻辑
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

推荐下一步:
  1. ★ /sdd-code — 开始 TDD 实施
  2. ○ /sdd-review-spec — 先审查 spec 质量
```
