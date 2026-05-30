## ADDED Requirements

### Requirement: 通知系统

系统 SHALL 发送通知。

#### Scenario: 订单确认通知
- **GIVEN** 订单创建成功
- **WHEN** 系统发送通知
- **THEN** 用户收到订单确认

#### Scenario: 支付成功通知
- **GIVEN** 支付成功
- **WHEN** 系统发送通知
- **THEN** 用户收到支付确认

#### Scenario: 订单状态变更通知
- **GIVEN** 订单状态变更
- **WHEN** 系统发送通知
- **THEN** 用户收到状态更新
