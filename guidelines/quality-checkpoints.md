# 代码质量检查点

每个 SDD action 完成后执行对应检查。不通过时列出具体问题，提供修复/接受风险/暂停三个选项。

---

## 全局约定

### Review 循环上限

所有内置 review 循环（brainstorm、plan 等）最多 **3 轮**。通过或用户接受后停止。该上限适用于所有含 review 子流程的 SDD action。

---

## Action 级质量门

### sdd-brainstorm 质量门

- [ ] brainstorm.md 存在且非空
- [ ] 包含至少 2 个候选方案
- [ ] 关键决策节存在，每个决策有结论和理由
- [ ] 无 TBD/TODO 占位符
- [ ] Review 已通过（或用户接受）

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

### sdd-code 质量门（每个任务）

- [ ] 测试通过（有测试，且运行通过）
- [ ] Spec 合规（实现与 spec 场景一致）
- [ ] 无幻觉函数/类型（引用的函数和类型在代码中确实存在）
- [ ] 错误处理已覆盖（不吞错误、不忽略异常）
- [ ] 无硬编码的敏感信息
- [ ] 遵循项目现有代码风格

### sdd-review-code 质量门

- [ ] Spec 合规审查通过（Phase 1）
- [ ] 无 critical 代码质量问题（Phase 2）

### sdd-verify 质量门

- [ ] 所有测试通过
- [ ] Spec 场景覆盖率 100%
- [ ] 无编译/lint 错误

### sdd-ship 质量门

- [ ] tasks.md 中所有任务标记为 [x]
- [ ] 变更已归档
- [ ] 全局 specs 已同步
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
