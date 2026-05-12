# Mock 指南 — 仅 Mock 系统边界

> 来源：[`skills/engineering/tdd/mocking.md`](https://github.com/liaosw97/ai-tools/tree/main/skills/skills/engineering/tdd/mocking.md)

## 何时 Mock

仅在**系统边界**处 mock：
- 外部 API（支付、邮件等）
- 数据库（有时 — 优先使用测试数据库）
- 时间/随机性
- 文件系统（有时）

不要 mock：
- 你自己的类/模块
- 内部协作者
- 任何你能控制的东西

## 可 Mock 性设计

### 1. 依赖注入

传入外部依赖而非内部创建。

### 2. SDK 风格接口

为每个外部操作创建特定函数，而非一个带条件逻辑的通用函数。

好处：
- 每个 mock 返回一个特定数据结构
- 测试设置中无需条件逻辑
- 易于看到测试使用了哪些端点
- 每个端点的类型安全
