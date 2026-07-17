---
name: sdd-ship
description: "归档合并 — 同步 specs、归档变更、合并分支，完成变更周期。在 sdd-verify 通过后执行，不可逆操作需用户确认"
---

# sdd-ship — 归档合并

完成变更的最后一步：同步 specs、归档变更、合并分支。

---

<!-- include: ../_shared/base-triggers.md -->

**触发**：用户执行 `/sdd-ship`，或说"归档""合并分支""完成变更""ship"且当前有活跃变更。
**不触发**：用户只想查看变更状态（→ `/sdd-doctor`）；用户要修改代码（→ `/sdd-code`）。
**歧义处理**：多个活跃变更时逐一列出，由用户选择。

## 行为准则（整个归档过程有效，不因步骤推进而放松）

1. ❗ **归档前必须确认** — 不可逆操作，执行前向用户展示归档内容摘要并要求确认 — 每次写入前自检
2. ❗ **验证后才归档** — 必须通过最终验证检查才执行核心步骤 — 每进入下一步前自检
3. ❗ **失败时停止而非跳过** — 任一核心步骤失败时停止并报告，不继续下一步 — 每步执行前自检

<!-- include: ../_shared/output-constraints.md -->

标注规则：工具确认→无标注 / 降级推测→"⚠️ 降级分析" / 通用建议→"💡 通用建议"

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **警告**：未执行 sdd-verify → 建议先运行 /sdd-verify 确认所有场景覆盖，用户确认后可强制继续（简单修复允许跳过 verify 直接归档）
- **警告**：存在未通过的 review issues → 列出未通过项，建议修复后再归档，用户确认后可强制继续

<!-- include: ../_shared/role-loading.md -->

**默认角色**: `release-engineer`
**可选角色**: `sre`

### 1. 定位 Change 目录

- 扫描 `openspec/changes/` 找到活跃变更

### 2. 最终验证

快速检查变更是否可以交付：
- tasks.md 中所有任务是否标记为 `[x]`
- 是否有未提交的代码变更
- 是否有未解决的 review issues

如果有未完成项：
```
⚠️ 以下项目未完成，建议先处理：
  - tasks.md: 2/5 任务未完成
  - reviews/code-quality-r2.md: 1 个 critical issue 未解决

是否仍要归档？(y/n)
```

### 2.5 子 change 归档前检查

- 读取 `change-registry.yaml`（如不存在则跳过）
- 检查当前 change 在注册表中是否有 `depends_on` 字段
- 如果 `depends_on` 非空：
  - 遍历 `depends_on` 列表中每个 change 的 `status`
  - 全部为 `archived` → 允许归档
  - 存在 `active` → 阻断，输出：
    ```
    ❌ 无法归档：存在未完成的依赖 change

    本 change 依赖以下子 change 先归档：
    - <dep-name-1> — 未完成（status: active）

    请先完成并归档依赖的 change：
    ① 查看依赖 change 状态 → /sdd-doctor <dep-name>
    ② 继续依赖 change 实施 → /sdd-code <dep-name>
    ```

### 2.6 父 change 归档前检查

- 读取 `change-registry.yaml`
- 检查当前 change 在注册表中是否有 `children`
- 如果有子 change：
  - 遍历 `children` 列表中每个 change 的 `status`
  - 全部为 `archived` → 允许归档
  - 存在 `active` → 阻断，输出：
    ```
    ❌ 无法归档：存在未完成的子 change

    子 change 状态：
    - <child-name-1> — 已完成（可归档）
    - <child-name-2> — 未完成（tasks: 3/8 未完成）

    请先完成并归档所有子 change：
    ① 继续子 change 实施 → /sdd-code <child-name>
    ② 归档已完成子 change → /sdd-ship <child-name>
    ```
- 无子 change 时跳过检查

### 2.7 延后项提取

归档前从 proposal.md 中提取延后项，写入 `openspec/backlog.md`：

1. **扫描 proposal.md**，搜索以下延后标记关键词：
   - `P1`、`P2`（后跟"延后"、"后续"、"迭代"、"非本次"、"不在范围"等上下文）
   - `延后项`、`后续迭代`、`不在范围`、`不包含`（后跟功能描述）

2. **过滤已完成项**：如果延后项在 proposal 中已有删除线（`~~...~~`）或显式标注"已完成"，跳过该项。

3. **处理提取结果**：
   - 如果存在未过滤的延后项：
     a. 检查 `openspec/backlog.md` 是否存在
     b. 不存在 → 使用 `schemas/sdd/templates/backlog.md` 模板创建
     c. 已存在 → 读取现有内容
     d. 将新项追加到表格末尾，每项格式：`| 来源变更名 | P1/P2 | 简述 | open |`
     e. 如检测到来源变更相同且简述高度相似的已有项，提示用户人工判断是否合并（不自动合并）
     f. 展示提取结果，用户确认后继续
   - 如果无延后项 → 输出"proposal 中无延后项，跳过 backlog 更新"，继续归档

### 2.7 提交整理（可选）

在 Sync Specs 之前执行提交整理，操作 git 提交历史：

1. **扫描 commit 列表**：`git log <base-branch>..HEAD --oneline`，列出当前变更的所有 commit
2. **判断跳过条件**：如果 commit 数量 <= 1，自动跳过整理流程
3. **询问用户**："是否整理提交历史？(y/n)"
   - y → 进入 AI 分析合并建议（见 Task 4.2）
   - n → 跳过，继续后续流程

#### AI 分析合并建议

用户选择整理后，AI 自动执行：

1. **分析 commit**：对每个 commit，分析其 diff 内容
2. **模块归类**：
   - 如有 functions.md → 按 functions.md 的模块定义归类
   - 无 functions.md 但有 proposal.md → 按 proposal 模块定义归类
   - 均无 → 按 commit message 关键词和 diff 语义推断，标注"仅供参考"
3. **生成建议**：展示归类结果和合并方案，例如：
   ```
   ├── 模块 A（3 commits）
   ├── 模块 B（2 commits）
   └── 杂项（1 commit）
   建议合并为 3 个 commit
   ```
4. **用户确认**：展示建议方案，等待用户确认
   - 确认 → 执行合并
   - 不满意 → 用户可手动指定合并策略，AI 按指令执行

#### 执行 squash merge

1. **按方案执行**：对每个模块组执行 `git rebase -i` 或 `git merge --squash`
2. **保留 commit 信息**：合并后的 commit message 包含模块名和原始 commit 摘要

#### 冲突处理

- 如果 squash merge 出现冲突：
  1. 提示用户："合并出现冲突，请手动解决后继续"
  2. 用户解决冲突并 `git add` 后，AI 检测到冲突已解决
  3. 继续执行后续归档流程

#### 完成确认

合并完成后输出：
```
提交整理完成。
  原始: N commits → 合并后: M commits
```

---

## 核心执行（三步顺序执行）

### Step 1: Sync Specs

<!-- OpenSpec 插件提供的 skill -->
**invoke `openspec-sync-specs`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
```

将变更中的 specs 同步到全局 specs目录。

**验证**：确认全局 specs 目录下已包含本次变更的所有 spec 文件。
**失败处理**：sync 失败 → 停止，报告错误，不进入 Step 2。

✅ Checkpoint: "Step 1 完成: N 个 spec 已同步"

### Step 2: Archive Change

<!-- OpenSpec 插件提供的 skill -->
**invoke `openspec-archive-change`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
```

将活跃变更归档到 `openspec/changes/archive/YYYY-MM-DD-<name>/`。

**验证**：确认活跃目录已移至 archive/，原路径不再存在。
**失败处理**：archive 失败 → 停止，报告错误，不进入 Step 3。注意 Step 1 已完成（specs 已同步），需标注"部分完成"状态。

✅ Checkpoint: "Step 2 完成: 变更已归档至 archive/"

**归档后处理 — 父 change tasks.md 更新**：

1. 读取 `change-registry.yaml`，获取当前子 change 的 `parent`
2. 如果 `parent` 存在：
   a. 读取父 change 目录下的 `tasks.md`
   b. 扫描所有 `[delegated:<child-name>]` 标记
   c. 将匹配标记替换为 `[x]`
   d. 写回父 change 的 `tasks.md`
   e. 输出更新摘要："父 change tasks.md 已更新：N 个 [delegated:<child-name>] → [x]"

**归档后处理 — 注册表状态更新**：

1. 读取 `change-registry.yaml`
2. 查找当前 change 的记录
3. 将 `status` 更新为 `archived`
4. 设置 `archived` 字段为当天日期（YYYY-MM-DD）
5. 序列化并写回文件
6. 注意：父 change 归档不影响子 change 的注册表记录

### Step 3: Finish Branch

**invoke `superpowers:finishing-a-development-branch`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action

安全约束（必须遵循）：
1. 禁止 force-push（git push --force）
2. 禁止删除远程分支
3. 合并前必须向用户展示合并选项并获得确认
4. 清理分支前必须确认合并已完成
```

处理分支合并：
- 向用户展示合并选项（merge / rebase / squash）
- 执行合并
- 清理分支

**失败处理**：合并冲突 → 停止，展示冲突内容，由用户解决后重试。

✅ Checkpoint: "Step 3 完成: 分支已合并"

---

## 后置逻辑（SDD 自有）

### 1. 确认归档

验证归档成功（每项必须通过工具检查确认，不可凭记忆声明）：

| 验证项 | 检查方法 | 通过条件 |
|--------|---------|---------|
| 变更目录已移至 archive/ | `ls openspec/changes/archive/` | 目标目录存在 |
| 活跃目录已移除 | `ls openspec/changes/` | 原目录不存在 |
| 全局 specs 已更新 | `ls openspec/specs/` 对比 sync 前文件数 | 文件数 ≥ sync 前 |
| 分支已合并 | `git branch --merged` | 特性分支不在活跃列表 |

如有任一项未通过 → 输出"⚠️ 归档验证未完全通过"并列出失败项，不声明归档成功。
如有任一项无法检查（如 git 不可用、目录权限问题）→ 输出"⚠️ 无法验证: [项目]"并提示用户人工确认，降级为 INCONCLUSIVE 而非 FAILED。

### 2. 完成引导

```
sdd-ship 完成。变更 [<name>] 已归档。

归档位置: openspec/changes/archive/YYYY-MM-DD-<name>/
全局 specs 已更新。
分支已合并。

本轮变更完成。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
后续操作（按需执行）：

□ 推送代码
  git push origin <main-branch>
  git push --tags  # 如有版本标签

□ 验证部署
  - 确认 CI/CD 流水线通过
  - 在测试环境验证功能
  - 监控生产环境（如已部署）

□ 更新 backlog
  - 检查 openspec/backlog.md 是否有衍生任务
  - 更新相关 backlog 项状态

□ 开始新变更
  /sdd-brainstorm <新需求>   # 新需求探索
  /sdd-quick <简单需求>      # 简单需求快速通道

□ 回顾改进（可选）
  - 记录本次变更的经验教训
  - 更新项目文档（如有必要）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

注意：完成引导不再输出"使用阶段建议"。使用建议应由 `/sdd-doctor` 基于实际使用数据给出，而非归档时凭空推断。

<!-- SDD 流程指引：覆盖 OPSX 建议 -->
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SDD 流程指引
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

流程完成，变更已归档。
