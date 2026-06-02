### 0.3 角色加载

在执行核心逻辑前，加载并应用角色视角：

#### 参数解析

检查命令是否包含 `--role <name>` 参数：

- 如果存在：
  1. 提取角色名称
  2. 转换为小写
  3. 验证格式（小写字母、数字、连字符）
  4. 设置参数级角色覆盖

- 如果不存在：
  - 继续检查会话级角色

参数优先级高于会话级角色。

#### 角色优先级规则

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

#### 角色查找与合并

按优先级查找角色定义：用户级 > 项目级 > 内置

##### 角色文件查找（三层源）

按以下顺序查找角色定义文件：

1. **用户级**：`~/.claude/roles/<name>.md`
2. **项目级**：`openspec/roles/<name>.md`
3. **内置**：`ai-tools-bridge/roles/{planning,execution,review,release}/<name>.md`

查找流程：

```
function findRole(name):
  sources = [
    ("user", "~/.claude/roles/"),
    ("project", "openspec/roles/"),
    ("builtin", "ai-tools-bridge/roles/")
  ]

  for (sourceType, path) in sources:
    files = glob("${path}/**/*.md")
    for file in files:
      if file.endsWith("/${name}.md"):
        return { source: sourceType, path: file }

  return null  # 角色不存在
```

返回第一个匹配的角色文件，同时记录来源类型。

##### 优先级合并规则

**优先级**：用户级 > 项目级 > 内置

**合并策略**：

- 找到第一个匹配即停止查找（不合并多个源）
- 高优先级源的角色完全覆盖低优先级源的同名角色
- 不同名角色可共存（用户可添加自定义角色）

**冲突处理**：

当检测到同一角色在多个源中存在时：

```
⚠️ 角色 'ceo' 存在于多个源：
  - 用户级：~/.claude/roles/ceo.md
  - 内置：ai-tools-bridge/roles/planning/ceo.md

使用优先级最高的源：用户级
```

**实现要点**：

- 查找时按优先级顺序遍历
- 找到后立即返回，不继续查找低优先级源
- 记录角色来源用于显示和审计

##### 角色文件缺失降级

当请求的角色在所有源中都不存在时：

**处理流程**：

1. 输出警告：
   ```
   ⚠️ 角色 '<name>' 不存在，降级到默认角色 '<default-role>'
   ```

2. 获取当前 action 的默认角色

3. 使用默认角色继续执行

4. 不阻断 action 执行

**降级记录**：

在 review 文件头部添加：

```markdown
> ⚠️ 角色降级: '<requested-role>' 不存在，已使用默认角色 '<default-role>'
```

**示例**：

```
/sdd-review-code --role invalid

→ ⚠️ 角色 'invalid' 不存在，降级到默认角色 'staff-engineer'
→ 可用角色：yc-office-hours, ceo, eng-manager, designer, developer, staff-engineer, qa-lead, cso, release-engineer, sre
→ 继续执行 sdd-review-code（使用 staff-engineer 角色）
```

##### 角色定义格式错误处理

角色定义文件必须包含以下要素：

**必需字段**：
- YAML frontmatter 中的 `name` 字段
- `# 角色` 节

**可选字段**：
- YAML frontmatter 中的 `trigger` 字段
- `# 专业视角`、`# 强制问题`、`# 输出格式` 节

**格式校验流程**：

1. 解析 YAML frontmatter
2. 验证 `name` 字段存在且非空
3. 验证文档包含 `# 角色` 节

**错误处理**：

| 错误类型 | 处理 |
|----------|------|
| YAML 解析失败 | 输出错误位置，降级到默认角色 |
| 缺少 `name` 字段 | 提示"角色定义缺少 name 字段"，降级 |
| 缺少 `# 角色` 节 | 提示"角色定义缺少身份描述"，降级 |
| 缺少字段 | 提示"角色定义缺少必需字段"，降级 |
| 未知字段 | 忽略，不报错 |

**错误输出示例**：

```
⚠️ 角色定义格式错误：~/.claude/roles/my-role.md

错误：缺少必需字段 'name'

格式要求：
---
name: <角色名称>
trigger: <可选，action 列表>
---

# 角色
<角色身份描述>

# 专业视角
<视角列表>

# 强制问题
1. <问题>
...

# 输出格式
## <输出节>
---

降级到默认角色 '<default-role>'
```
