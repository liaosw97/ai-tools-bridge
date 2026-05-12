# 好测试与坏测试

> 来源：[`skills/engineering/tdd/tests.md`](https://github.com/liaosw97/ai-tools/tree/main/skills/skills/engineering/tdd/tests.md)

## 好测试

集成风格：通过真实接口测试，不 mock 内部组件。

特征：
- 测试用户/调用者关心的行为
- 仅使用公共 API
- 能经受内部重构
- 描述 WHAT，不描述 HOW
- 每个测试一个逻辑断言

## 坏测试

实现细节测试：与内部结构耦合。

红旗信号：
- Mock 内部协作者
- 测试私有方法
- 断言调用次数/顺序
- 重构时测试失败但行为未变
- 测试名称描述 HOW 不描述 WHAT
- 通过外部手段验证而非接口
