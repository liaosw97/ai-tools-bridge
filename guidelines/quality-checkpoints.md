# 代码质量检查点

每个 SDD action 完成后执行对应检查。不通过时列出具体问题，提供修复/接受风险/暂停三个选项。

---

## 全局约定

### Review 循环上限

所有内置 review 循环（brainstorm、plan 等）默认最多 **N 轮**（可在 `openspec/config.yaml` 的 `limits.review-rounds` 中配置，默认 3）。通过或用户接受后停止。该上限适用于所有含 review 子流程的 SDD action。

### 轨道×产物矩阵

各轨道必须/可选/禁止的产物（doctor 与各 action 据此判定边界）：

| 轨道 | 产物约束 |
|------|---------|
| hotfix | hotfix.md 唯一；proposal/spec/tasks/functions/test-cases 均禁止 |
| quick | proposal/spec/tasks 精简版（spec-compact 格式）；不生成 functions/test-cases |
| M 重轨 | proposal/spec/functions（三图）/plan/test-cases 全部必需 |
| L 重轨 | M + brainstorm/review 全流程 |

---

## Action 级质量门

### sdd-hotfix 质量门

- [ ] hotfix.md 存在且非空（含现象/根因/修复/验证/衍生）
- [ ] 改动未超工作量盒（≤2 源文件 + ≤3 测试场景）
- [ ] 未生成 proposal.md/specs/tasks.md（轻轨产物约束）
- [ ] 无硬编码敏感信息
- [ ] 回归测试通过

### sdd-brainstorm 质量门

- [ ] brainstorm.md 存在且非空
- [ ] 包含至少 2 个候选方案
- [ ] 关键决策节存在，每个决策有结论和理由
- [ ] 无 TBD/TODO 占位符
- [ ] Review 已通过（或用户接受）

### sdd-analyze 质量门

- [ ] functions.md 存在且非空
- [ ] 每个功能函数有明确的输入/输出签名和用途说明
- [ ] 函数拆分粒度合理（可独立测试、可独立实现）
- [ ] 无 TBD/TODO 占位符
- [ ] 三图齐备：功能架构图（flowchart）+ 函数声明图（classDiagram）+ 调用关系图（flowchart）
- [ ] mermaid 命名约定合规：architecture-* / functions-* / calls-*（可 grep）
- [ ] 调用关系图无孤立节点、无循环依赖（静态检查）
- [ ] 存量节点已用 classDef existing 灰虚线标注（如有）
- [ ] 函数签名含批次占位（`批次: <plan 阶段回填>`）

> 注：mermaid 校验为**结构化静态检查**（代码块/命名/节点可 grep 判定），不做渲染级校验（不引入画图工具链）。

### sdd-propose 质量门

- [ ] proposal.md 存在且非空
- [ ] 变更意图和范围明确
- [ ] 如果 brainstorm.md 存在，决策追溯完整
- [ ] 无重复的 change name

### sdd-ff 质量门

- [ ] proposal.md 存在
- [ ] 至少一个 spec 文件存在
- [ ] 每个 spec 有 GIVEN/WHEN/THEN 场景
- [ ] tasks.md 存在，每个任务有 spec 链接
- [ ] specs 描述的是用户可观测的行为，不是内部实现

### sdd-plan 质量门

- [ ] plan.md 存在且非空
- [ ] 每个任务有 RED/GREEN 步骤
- [ ] 每个步骤有运行验证命令
- [ ] 任务粒度在 2-5 分钟内
- [ ] Review 已通过（或用户接受）
- [ ] （M/L 重轨）test-cases.md 已生成，用例行锚定 spec 场景
- [ ] （M/L 重轨，有 functions.md）批次归属已回写 functions.md

### sdd-code 质量门（每个任务）

- [ ] 测试通过（有测试，且运行通过）
- [ ] Spec 合规（实现与 spec 场景一致）
- [ ] 无幻觉函数/类型（引用的函数和类型在代码中确实存在）
- [ ] 错误处理已覆盖（不吞错误、不忽略异常）
- [ ] 无硬编码的敏感信息
- [ ] 遵循项目现有代码风格
- [ ] （契约批次）本批实现 ⊆ 声明、声明 ⊆ 实现、用例行已回填
- [ ] （契约批次）无幻影测试（用例名与 test-cases.md 对齐）

### sdd-review-code 质量门

- [ ] Spec 合规审查通过（Phase 1）
- [ ] 无 critical 代码质量问题（Phase 2）

### sdd-verify 质量门

- [ ] 所有测试通过
- [ ] Spec 场景覆盖率 100%
- [ ] 无编译/lint 错误
- [ ] （M/L 重轨）三向对齐通过（声明=实现=test-cases 覆盖）
- [ ] （M/L 重轨）test-cases.md 状态全部回填
- [ ] （hotfix change）降级输出卡片摘要，不报错阻断

### sdd-ship 质量门

- [ ] tasks.md 中所有任务标记为 [x]（hotfix change 豁免此条，走卡片归档）
- [ ] 变更已归档
- [ ] 全局 specs 已同步（hotfix 无 specs 豁免）
- [ ] 分支已合并

---

## 常见 AI 编码错误检查

在 sdd-code 执行过程中，对每个任务的产出额外检查：

| 错误类型 | 检查方式 |
|----------|---------|
| 幻觉函数/方法 | grep 验证引用的函数在代码库中存在 |
| 过度设计 | 检查是否引入了 spec 未要求的功能 |
| 遗漏错误处理 | 检查 async/await 是否有 try-catch，I/O 操作是否处理失败 |
| 类型不一致 | 检查函数签名与调用处的参数类型匹配 |
| 硬编码值 | 检查配置项、URL、超时时间等是否提取为常量 |
| 测试遗漏 | 检查边界值（空输入、极大值、null/undefined）是否有测试 |
| 安全漏洞 | 检查用户输入是否经过验证，SQL/命令注入，XSS |

---

## 使用方式

每个 action 完成时自动调用对应的质量门检查。不需要手动触发。

检查结果格式：
```
质量门检查:
  ✅ proposal.md 存在且非空
  ✅ specs/ 目录有 3 个 spec 文件
  ❌ tasks.md 中任务 2.1 缺少 spec 链接

  建议: 为任务 2.1 添加 [spec:domain#scenario] 链接
```
