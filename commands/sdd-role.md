# sdd-role — 角色显示与切换

显示当前角色或切换会话级角色。

## 使用方式

- `/sdd-role` — 显示当前角色信息
- `/sdd-role <name>` — 切换当前会话角色
- `/sdd-role --list` — 列出所有可用角色

## 执行逻辑

### 显示当前角色（无参数）

1. 获取当前会话角色（默认为上次切换的角色或系统默认）
2. 加载角色定义
3. 输出：
   ```
   当前角色: <name>
   来源: <builtin|project|user>
   身份: <角色身份描述摘要>
   ```

### 显示当前角色（无参数）实现细节

输出格式：

```
当前角色: <name>
来源: builtin / project / user
身份: <角色身份的第一句话>

可用 action: <trigger 列表>
```

示例输出：

```
当前角色: staff-engineer
来源: builtin
身份: 你是一名 Staff Engineer，负责代码审查和质量把关

可用 action: sdd-review-code, sdd-test-code
```

### 切换角色（有参数）

1. 解析角色名称，转换为小写
2. 查找角色定义（按优先级：用户级 > 项目级 > 内置）
3. 如果找到：设置会话级角色，输出确认
4. 如果未找到：输出错误，列出可用角色

### 切换角色（有参数）实现细节

流程：

1. 参数解析：
   - 将角色名称转换为小写
   - 验证格式：仅允许小写字母、数字、连字符

2. 角色查找：
   - 优先级顺序：`~/.claude/roles/` > `openspec/roles/` > `ai-tools-bridge/roles/`
   - 在各目录下查找 `<name>.md` 文件

3. 成功处理：
   - 设置环境变量或内存状态记录当前角色
   - 输出：`角色已切换为 <name>（来源: <source>）`

4. 失败处理：
   - 输出：`角色 '<name>' 不存在`
   - 输出可用角色列表
   - 当前角色不变

示例：

```
/sdd-role ceo
→ 角色已切换为 ceo（来源: builtin）

/sdd-role invalid-role
→ 角色 'invalid-role' 不存在
→ 可用角色：yc-office-hours, ceo, eng-manager, designer, developer, staff-engineer, qa-lead, cso, release-engineer, sre
```

### 列出角色（--list）

1. 扫描所有角色定义源
2. 按分类输出角色列表

### 列出角色（--list）实现细节

扫描路径：
- 内置：`ai-tools-bridge/roles/planning/`, `execution/`, `review/`, `release/`
- 项目级：`openspec/roles/`（如存在）
- 用户级：`~/.claude/roles/`（如存在）

输出格式（按分类）：

```
=== 内置角色 ===

Planning:
  - yc-office-hours
  - ceo
  - eng-manager
  - designer

Execution:
  - developer

Review:
  - staff-engineer
  - qa-lead
  - cso

Release:
  - release-engineer
  - sre

=== 项目级角色 ===（如有）
  - <角色列表>

=== 用户级角色 ===（如有）
  - <角色列表>
```

### 错误处理

| 场景 | 处理 |
|------|------|
| 角色不存在 | 输出错误信息 + 可用角色列表 |
| 角色名称格式错误 | 提示：仅允许小写字母、数字、连字符 |
| 角色定义文件损坏 | 提示格式要求，降级到默认角色 |

输出模板：

```
⚠️ 角色 '<name>' 不存在

可用角色（按分类）：
Planning: yc-office-hours, ceo, eng-manager, designer
Execution: developer
Review: staff-engineer, qa-lead, cso
Release: release-engineer, sre

使用方式: /sdd-role <name>
```

## 角色优先级规则

优先级顺序（从高到低）：

1. `--role` 参数（一次性，仅当前 action）
2. `/sdd-role` 设置的会话级角色（会话级，持续到切换或会话结束）
3. action 默认角色

示例：

```
/sdd-role ceo                 # 会话级切换为 ceo
/sdd-review-code --role cso   # 本次 action 使用 cso，下次仍为 ceo
/sdd-review-code              # 使用会话级角色 ceo
```
