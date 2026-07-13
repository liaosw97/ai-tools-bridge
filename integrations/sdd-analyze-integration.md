# sdd-analyze 集成说明

## 概要

sdd-analyze 将需求解析为 模块→功能→函数 三层结构，产出 functions.md。
本文档记录 sdd-analyze 与其他 SDD action 的集成关系。

## 触发入口

- `/sdd-analyze` — 直接调用
- sdd-brainstorm 完成后询问 → 用户选择"是"
- 需求阶段（propose/specs/tasks）手动调用

## 与其他 action 的集成

| Action | 集成方式 | 依赖方向 |
|--------|---------|---------|
| sdd-brainstorm | 完成后询问入口 | sdd-brainstorm → sdd-analyze |
| sdd-plan | 读取 functions.md 编排批次 | sdd-plan ← functions.md |
| sdd-code | 读取 functions.md 按签名实现 | sdd-code ← functions.md |
| sdd-ship | 提交整理时引用模块定义 | sdd-ship ← functions.md |

## 制品流

```
sdd-analyze → functions.md → sdd-plan (批次编排)
                             → sdd-code (签名约束)
                             → sdd-ship (模块归类)
```

## 降级策略

- 无 functions.md 时：sdd-plan/sdd-code/sdd-ship 均按原有逻辑工作，不阻塞
- code 阶段调用：提示重新生成 plan，用户确认后触发重新生成
- 已存在 functions.md：询问用户是覆盖还是追加