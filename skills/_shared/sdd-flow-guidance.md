# SDD 流程指引模板

本文件为所有调用 OPSX 命令的 SDD action 提供统一的流程指引格式。

## 使用方式

### 推荐方式：直接复制

由于每个 action 的流程指引内容不同，且 Claude Code 的 include 机制不支持条件渲染，**推荐直接复制**对应 action 的内容到 SKILL.md 中。

**复制步骤**：
1. 在本文件中找到对应 action 的流程指引模板（见下方"各 Action 的下一步建议"节）
2. 复制完整的模板内容（包括分隔线）
3. 粘贴到 SKILL.md 的"完成引导"部分

### 不推荐的方式：include 引用

虽然 include 机制（`<!-- include: path -->`）可用于其他共享模块（如 base-triggers.md），但由于 SDD 流程指引每个 action 的内容不同，include 引用会导致所有 action 显示相同的流程指引，不符合预期。

## 格式规范

### 分隔线
使用 `━━━` 水平线作为上下边框，宽度为 35 个字符。

### 标题
`SDD 流程指引（覆盖可能显示的 OPSX 建议）`

### 优先级标记
- ★ = 推荐操作（流程中的下一步）
- ○ = 可选操作（替代路径）
- △ = 回退操作（回到之前的步骤）

### 完成消息格式（sdd-ship 专用）
`流程完成，变更已归档。`

### 错误恢复格式（OPSX 失败时）
`建议检查 openspec 环境后重试。`

## 各 Action 的下一步建议

### sdd-propose 完成后
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

推荐下一步:
  1. ★ /sdd-ff — 快进生成所有文档
  2. ○ /sdd-continue — 逐步确认细节
  3. △ /sdd-brainstorm — 回退补充探索
```

### sdd-continue 完成后
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

推荐下一步:
  1. ★ /sdd-continue — 继续下一个 artifact
  2. ○ /sdd-ff — 快进生成所有剩余
```

### sdd-ff 完成后
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

推荐下一步:
  1. ★ /sdd-plan — 生成实施计划
  2. ○ /sdd-review-spec — 先审查 spec 质量
```

### sdd-verify 完成后
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

推荐下一步:
  1. ★ /sdd-ship — 归档合并
  2. ○ /sdd-code — 修复问题
```

### sdd-ship 完成后

> **注意**：sdd-ship 是流程的最后一步，使用简化标题（无"请忽略 OPSX 建议"提示），因为此时不存在 OPSX 建议干扰。

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

流程完成，变更已归档。
```

### sdd-quick 完成后（所有 artifact 已生成）
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

推荐下一步:
  1. ★ /sdd-ship — 归档合并
```

### sdd-quick 完成后（实现不完整）
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引（覆盖可能显示的 OPSX 建议）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

流程完成，但实现可能不完整。
推荐下一步:
  1. ★ /sdd-verify — 验证实现完整性
  2. ○ /sdd-ship — 归档合并（确认实现完整后）
```

## 一致性检查

当修改流程指引格式时，需要确保 6 个 SKILL.md 的格式一致。

### 检查命令

```bash
# 检查所有 6 个 SKILL.md 是否包含 SDD 流程指引
for skill in sdd-propose sdd-continue sdd-ff sdd-verify sdd-ship sdd-quick; do
  grep "SDD 流程指引" ai-tools-bridge/skills/$skill/SKILL.md > /dev/null && echo "$skill: OK" || echo "$skill: MISSING"
done

# 检查分隔线格式
for skill in sdd-propose sdd-continue sdd-ff sdd-verify sdd-ship sdd-quick; do
  grep "━━━" ai-tools-bridge/skills/$skill/SKILL.md > /dev/null && echo "$skill: OK" || echo "$skill: MISSING"
done
```

### 一致性要求

- 所有 6 个 SKILL.md 必须包含 SDD 流程指引
- 所有流程指引必须使用 `━━━` 分隔线
- 标题格式必须一致（sdd-ship 使用简化标题）
- 推荐下一步必须使用 ★○△ 标记
