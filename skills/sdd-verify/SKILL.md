---
name: sdd-verify
description: "全面验证 — 逐条验证 spec 场景覆盖，运行所有测试，产出验证报告"
---

# sdd-verify — 全面验证

对所有 spec 场景进行逐一验证，确认实现完整性和测试覆盖率。

---

## 触发条件

**触发**：用户执行 `/sdd-verify`，或说"验证""全面验证""运行所有测试""检查覆盖率"。
**不触发**：要审查代码质量（→ `/sdd-review-code`）；要归档（→ `/sdd-ship`）。
**歧义处理**：无代码变更时建议先编码（→ `/sdd-code`）。

## 输出约束

禁止输出:
- 开场白（"让我来验证..."）
- 工具调用前后的重复描述
- 未经验证的通过声明
- 已知信息的复述

## 零结果与幻觉防护

- 所有验证结论必须引用来源（测试输出 + 文件路径）
- 无法检查的项目标注"⚠️ 无法验证"并提示用户确认
- 测试未运行时不可声明"通过"

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：`specs/` 不存在或无代码文件 → 拒绝执行，输出"缺少 spec 或代码，请先执行 /sdd-code 完成实现"

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 收集验证材料

- 读取 `specs/` — 所有需要验证的场景
- 读取 `tasks.md` — 任务完成状态
- 读取 `plan.md`（如有）— 实施范围

---

## 核心执行（委托底层 skill）

### 2a. 代码验证

**invoke `superpowers:verification-before-completion`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
```

运行所有验证命令：
- 单元测试
- 集成测试
- Lint 检查
- 类型检查
- 构建验证

### 2b. Spec 验证

**invoke `openspec-verify-change`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
输出位置 — 产物写入 openspec/changes/<name>/ 目录
```

验证变更的 spec 合规性。

---

## 后置逻辑（SDD 自有）

### 1. Scenario 覆盖率统计

逐条检查 spec 场景：

```
Scenario 覆盖率:
  spec:auth#login           ✅ 有测试覆盖
  spec:auth#logout          ✅ 有测试覆盖
  spec:auth#token-refresh   ❌ 无测试覆盖
  spec:auth#failed-login    ⚠️ 测试存在但未覆盖边界值

覆盖率: 3/4 (75%)
```

### 2. 验证报告

汇总所有验证结果：

**判定规则**：
- **PASSED**：所有 spec 场景有测试覆盖 + 所有测试通过 + Lint/类型检查/构建均通过
- **FAILED**：任一项不满足

```
验证报告
═══════════════════════════════════

单元测试:     ✅ 42/42 通过
集成测试:     ✅ 12/12 通过
Lint:         ✅ 无错误
类型检查:     ✅ 无错误
构建:         ✅ 成功
Spec 覆盖率:  ⚠️ 75% (3/4 场景)

未覆盖场景:
  - spec:auth#token-refresh — 需要补充测试

推荐下一步:
  - Pass → /sdd-ship 归档合并
  - Fail → /sdd-code 补充缺失实现
```

### 3. 完成引导

```
sdd-verify 完成。

验证报告: [PASSED / FAILED]

如需释放上下文，可安全 /clear。

推荐下一步:
  - 通过 → /sdd-ship 归档合并
  - 未通过 → /sdd-code 补充缺失的实现

★ 推荐下一步: /sdd-ship — 归档合并
  ○ /sdd-code — 修复验证失败项
```
