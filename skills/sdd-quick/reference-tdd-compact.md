# TDD 核心流程 — 紧凑版

> 来源：[`skills/engineering/tdd`](https://github.com/liaosw97/ai-tools/tree/main/skills/skills/engineering/tdd)

## 核心原则

测试验证行为而非实现。代码可以完全改变，但测试不应受影响。

## 垂直切片（Tracer Bullet）

**不要**先写所有测试再写所有实现（水平切片）。正确做法：

```
RED→GREEN: test1→impl1
RED→GREEN: test2→impl2
RED→GREEN: test3→impl3
```

每次一个测试 → 一个实现 → 重复。每个测试响应前一个循环中学到的内容。

## 红绿循环

### RED — 编写一个失败测试
- 一个测试验证一个行为
- 测试名称描述行为，不描述实现
- 使用真实代码，避免不必要的 mock

### GREEN — 最小实现
- 写最简单的代码让测试通过
- 不添加额外功能
- 不重构其他代码

### 运行验证
- 每次必须运行测试确认状态
- RED 阶段确认测试因功能缺失而失败
- GREEN 阶段确认所有测试通过

## 检查清单

```
[ ] 测试描述行为，不描述实现
[ ] 测试仅使用公共接口
[ ] 测试能经受内部重构
[ ] 代码是最小实现
[ ] 没有投机性功能
```
