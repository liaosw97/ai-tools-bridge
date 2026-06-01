# Plan: 复杂变更示例

> 实施计划 — TDD 级别的详细步骤

## 批次一：订单处理

### Task 1.1: 实现创建订单 [spec:order-processing#创建订单]

- **RED**: 编写创建订单测试
- **GREEN**: 实现 createOrder 函数

### Task 1.2: 实现取消订单 [spec:order-processing#取消订单]

- **RED**: 编写取消订单测试
- **GREEN**: 实现 cancelOrder 函数

### Task 1.3: 实现订单状态更新 [spec:order-processing#订单状态更新]

- **RED**: 编写状态更新测试
- **GREEN**: 实现 updateOrderStatus 函数

### Task 1.4: 编写订单测试 [spec:order-processing#创建订单]

- **验证**: 所有订单测试通过

## 批次二：支付处理（依赖批次一）

### Task 2.1: 实现支付成功 [spec:payment#支付成功]

- **RED**: 编写支付成功测试
- **GREEN**: 实现 processPayment 函数
- **依赖**: 订单状态需为 pending（批次一）

### Task 2.2: 实现支付失败 [spec:payment#支付失败]

- **RED**: 编写支付失败测试
- **GREEN**: 实现支付失败处理

### Task 2.3: 编写支付测试 [spec:payment#支付成功]

- **验证**: 所有支付测试通过

## 批次三：库存管理（依赖批次一）

### Task 3.1: 实现库存扣减 [spec:inventory#库存扣减]

- **RED**: 编写库存扣减测试
- **GREEN**: 实现 deductStock 函数
- **依赖**: 创建订单时触发（批次一）

### Task 3.2: 实现库存恢复 [spec:inventory#库存恢复]

- **RED**: 编写库存恢复测试
- **GREEN**: 实现 restoreStock 函数

### Task 3.3: 实现库存不足处理 [spec:inventory#库存不足]

- **RED**: 编写库存不足测试
- **GREEN**: 实现库存不足拒绝下单

### Task 3.4: 编写库存测试 [spec:inventory#库存扣减]

- **验证**: 所有库存测试通过

## 批次四：通知系统（依赖批次二、三）

### Task 4.1: 实现订单确认通知 [spec:notification#订单确认通知]

- **RED**: 编写通知测试
- **GREEN**: 实现 sendOrderConfirmation 函数
- **依赖**: 订单创建成功后触发

### Task 4.2: 实现支付成功通知 [spec:notification#支付成功通知]

- **RED**: 编写支付通知测试
- **GREEN**: 实现 sendPaymentSuccess 函数
- **依赖**: 支付成功后触发（批次二）

### Task 4.3: 实现状态变更通知 [spec:notification#订单状态变更通知]

- **RED**: 编写状态通知测试
- **GREEN**: 实现 sendStatusUpdate 函数

### Task 4.4: 编写通知测试 [spec:notification#订单确认通知]

- **验证**: 所有通知测试通过

## 批次五：集成测试（依赖批次一至四）

### Task 5.1: 编写端到端订单流程测试 [spec:order-processing#创建订单]

- **验证**: 创建订单 → 支付 → 库存扣减 → 通知 全链路

### Task 5.2: 编写支付集成测试 [spec:payment#支付成功]

- **验证**: 支付成功 → 订单状态更新 → 通知
