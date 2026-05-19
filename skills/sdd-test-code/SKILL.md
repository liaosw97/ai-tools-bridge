---
name: sdd-test-code
description: "TDD 补全 — 基于 review 报告补全 PARTIAL/MISSING 场景的测试，修复测试质量问题，严格不修改实现代码"
---

# sdd-test-code — TDD 循环补全

在 sdd-review-code 审查完成后，针对 PARTIAL/MISSING 场景补充缺失测试，修复测试质量 issues。

---

## 触发条件

**触发**：用户执行 `/sdd-test-code`，或说"补全测试""补充缺失测试""修复测试质量"。
**不触发**：要写新功能代码（→ `/sdd-code`）；要审查代码（→ `/sdd-review-code`）。
**歧义处理**：无 review 报告时建议先审查（→ `/sdd-review-code`）。

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **阻断**：`reviews/` 不存在或为空 → 拒绝执行，输出错误提示建议先执行 `/sdd-review-code`

### 1. 定位最新 review 报告

扫描 `openspec/changes/<name>/reviews/` 目录：

- 按**最新**修改时间排序，定位：
  - 最新的 `spec-compliance-*.md` 报告
  - 最新的 `code-quality-*.md` 报告
- 若最新报告时间跨度较大（超过 24 小时），输出**时间跨度警告**提示用户确认时效性
- 若 `reviews/` 不存在或为空 → 阻断，输出错误提示建议先执行 `/sdd-review-code`

### 2. 提取补全目标

从 spec-compliance 报告中提取：
- 所有标记为 **PARTIAL** 的场景
- 所有标记为 **MISSING** 的场景

从 code-quality 报告中提取：
- 所有**测试质量**相关的 issues

### 3. 判断是否需要操作

- 如果无 PARTIAL/MISSING 且无测试质量 issues → 输出**空操作提示**：
  ```
  所有场景均已覆盖，无测试质量问题。
  建议跳过当前步骤。
  ```
  → 直接进入后置推荐

- 如果仅 code-quality 报告不存在 → 仅基于 spec-compliance 执行补全，输出提示说明跳过了测试质量检查
- 如果仅 spec-compliance 不存在但 code-quality 存在 → 仅处理测试质量 issues

---

## 核心执行（委托底层 skill）

### 4a. 场景补全（PARTIAL/MISSING）

**invoke `superpowers:test-driven-development`**（参见 `reference-tdd-tests.md`）

Override 指令：
```
严格约束：不修改实现代码，仅补充/修复测试
每个场景独立提交
完成后停止
```

对每个 PARTIAL/MISSING 场景执行 RED-GREEN 循环：

1. **RED** — 针对该场景编写失败测试
2. **GREEN** — 调整测试代码使其通过（补充断言、修正测试数据、修复测试逻辑；不修改实现代码）
3. **运行验证** — 确认测试通过
4. **独立提交** — 每个场景一个 commit

处理异常：
- 场景对应的 spec 定义无法定位 → 标记为 `SKIPPED`，继续处理其余
- 测试修复引入新失败 → 回滚该场景提交，标记为 `FAILED`，继续处理下一个

### 4b. 测试质量修复

**invoke `superpowers:test-driven-development`**（参见 `reference-tdd-mocking.md`）

对每个测试质量 issue：
1. 定位对应的测试文件
2. 按照 /tdd 的 tests.md 和 mocking.md 规范修复
3. 运行验证
4. 独立提交

---

## 后置逻辑（SDD 自有）

### 1. 输出补全统计

```
sdd-test-code 完成。

补全统计:
  PARTIAL: [N] 补全, [M] 跳过, [K] 失败
  MISSING: [N] 补全, [M] 跳过, [K] 失败
  测试质量修复: [N] 个 issues

所有测试通过。
```

### 2. 推荐操作

```
推荐下一步:
  ★ /sdd-verify — 全面验证 Spec 场景覆盖
  ○ /sdd-ship — 归档合并（sdd-ship 会提示 verify 检查）
```
