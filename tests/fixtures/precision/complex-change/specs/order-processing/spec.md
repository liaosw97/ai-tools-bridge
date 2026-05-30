## ADDED Requirements

### Requirement: 订单处理

系统 SHALL 处理订单。

#### Scenario: 创建订单
- **GIVEN** 用户选择了商品
- **WHEN** 用户提交订单
- **THEN** 系统创建订单并扣减库存

#### Scenario: 取消订单
- **GIVEN** 订单未支付
- **WHEN** 用户取消订单
- **THEN** 系统取消订单并恢复库存

#### Scenario: 订单状态更新
- **GIVEN** 订单状态变更
- **WHEN** 系统处理状态变更
- **THEN** 系统更新订单状态并通知用户
