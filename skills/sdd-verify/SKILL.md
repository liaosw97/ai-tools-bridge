---
name: sdd-verify
description: "全面验证 — 逐条验证 spec 场景覆盖，运行所有测试，产出验证报告"
---

# sdd-verify — 全面验证

对所有 spec 场景进行逐一验证，确认实现完整性和测试覆盖率。

---

## 前置逻辑（SDD 自有）

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

运行所有验证命令：
- 单元测试
- 集成测试
- Lint 检查
- 类型检查
- 构建验证

### 2b. Spec 验证

**invoke `openspec-verify-change`**

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
```
