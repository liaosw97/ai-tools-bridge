## 注册表共享模块

### 注册表读取逻辑

输入：当前 change 名称
输出：{ parent, children, depends_on, status }

行为：
1. 检查 `openspec/change-registry.yaml` 是否存在
2. 不存在 → 返回空对象（降级为无注册表模式）
3. 存在 → 读取并解析 YAML
4. 在 `changes` 数组中查找名称匹配的 change
5. 未找到 → 返回空对象
6. 找到 → 返回 { parent, children, depends_on, status }

### 注册表写入逻辑

输入：change 记录（name/status/description/tags/created/archived/parent/children/depends_on）

行为：
1. 检查 `openspec/change-registry.yaml` 是否存在
2. 不存在 → 用默认模板创建新文件（version: 1, schema: change-registry, changes: []）
3. 存在 → 读取并解析 YAML
4. 查找 changes 数组中是否已有同名的 change 记录
5. 已有 → 更新该记录的字段
6. 没有 → 追加新记录
7. 如果是添加子 change，同时更新父 change 的 children 列表
8. 序列化为 YAML 并写回文件

异常处理：
- 文件写入失败 → 输出错误，终止操作
- YAML 解析失败 → 输出警告，不修改文件

### 向后兼容规则

当 `openspec/change-registry.yaml` 不存在时，所有 action 的行为约束：

- **sdd-plan**：执行时不输出注册表相关提示，不尝试读取/写入 `change-registry.yaml`
- **sdd-ship**：执行时不执行归档顺序检查，不输出子 change 状态提示
- **sdd-code/sdd-propose**：执行时不输出迭代引导提示
- **所有 action**：不输出注册表不存在的警告

检测方式：每次操作前检查文件是否存在，不存在则跳过所有注册表相关逻辑。

### 异常处理规则

1. **文件损坏或 YAML 格式错误**：
   - 捕获 YAML 解析异常
   - 输出警告："⚠️ change-registry.yaml 格式错误，降级为无注册表模式"
   - 降级后所有 action 行为与无注册表时一致

2. **版本不匹配**：
   - 读取 `version` 字段与当前期望版本（1）比较
   - 不匹配时输出警告："⚠️ change-registry.yaml 版本不匹配（期望 v1，实际 v{version}），继续执行"
   - 不阻断操作

3. **孤目录检测**（change 目录已手动删除）：
   - sdd-doctor 检测注册表存在但目录不存在的情况
   - 输出提示："检测到 change 目录不存在但注册表中存在，请确认是否删除注册表项"

4. **名称冲突**：
   - 添加子 change 时检查名称是否已存在于注册表
   - 冲突时输出："名称冲突，请重新输入"，不更新注册表