# Test Cases: <变更名称>

> 测试用例矩阵 — spec 场景 × 用例覆盖证据。plan 阶段生成（从 TDD 步骤汇总去重），sdd-code 实施回填，sdd-verify 核验。

| # | Spec 场景 | 测试文件 | 用例名 | 描述 | 输入 (GIVEN) | 预期 (THEN) | 状态 |
|---|-----------|---------|--------|------|-------------|-------------|------|
| 1 | [spec:<domain>#<scenario>] | tests/<file>.spec.ts | <camelCase_identifier> | <中文可读说明> | <前置条件/输入> | <预期结果> | ☐ |
| 2 | ... | ... | ... | ... | ... | ... | ☐ |

<!-- 格式说明:
  - 用例名 = 代码标识符（camelCase/snake_case），可符号级 grep 对齐测试代码
  - 描述列 = 中文人读说明
  - 主键锚定 spec 场景 [spec:domain#scenario]（与 tasks 链接同锚）
  - 状态: ☐ 待覆盖 → ✓ 通过 → ✗ 失败及原因（sdd-code 回填、sdd-verify 核验）
-->
