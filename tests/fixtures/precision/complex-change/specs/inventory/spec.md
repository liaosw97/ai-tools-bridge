## ADDED Requirements

### Requirement: 库存管理

系统 SHALL 管理库存。

#### Scenario: 库存扣减
- **GIVEN** 订单创建
- **WHEN** 系统扣减库存
- **THEN** 库存数量减少

#### Scenario: 库存恢复
- **GIVEN** 订单取消
- **WHEN** 系统恢复库存
- **THEN** 库存数量增加

#### Scenario: 库存不足
- **GIVEN** 商品库存不足
- **WHEN** 用户尝试购买
- **THEN** 系统拒绝订单并通知用户
