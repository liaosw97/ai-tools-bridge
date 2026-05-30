## ADDED Requirements

### Requirement: 支付处理

系统 SHALL 处理支付。

#### Scenario: 支付成功
- **GIVEN** 用户发起支付
- **WHEN** 支付网关确认
- **THEN** 系统更新订单状态为已支付

#### Scenario: 支付失败
- **GIVEN** 用户发起支付
- **WHEN** 支付网关拒绝
- **THEN** 系统保持订单状态不变并通知用户
