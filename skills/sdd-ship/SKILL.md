---
name: sdd-ship
description: "归档合并 — 同步 specs、归档变更、合并分支，完成变更周期。在 sdd-verify 通过后执行，不可逆操作需用户确认"
---

# sdd-ship — 归档合并

完成变更的最后一步：同步 specs、归档变更、合并分支。

---

## 触发条件

**触发**：用户执行 `/sdd-ship`，或说"归档""合并分支""完成变更""ship"且当前有活跃变更。
**不触发**：用户只想查看变更状态（→ `/sdd-doctor`）；用户要修改代码（→ `/sdd-code`）。
**歧义处理**：多个活跃变更时逐一列出，由用户选择。

## 行为准则（整个归档过程有效，不因步骤推进而放松）

1. ❗ **归档前必须确认** — 不可逆操作，执行前向用户展示归档内容摘要并要求确认 — 每次写入前自检
2. ❗ **验证后才归档** — 必须通过最终验证检查才执行核心步骤 — 每进入下一步前自检
3. ❗ **失败时停止而非跳过** — 任一核心步骤失败时停止并报告，不继续下一步 — 每步执行前自检

## 输出约束

禁止输出:
- 开场白（"我来帮你归档..."）
- 工具调用描述（"现在调用 openspec-archive-change..."）
- 未经验证的归档成功声明
- 超过 3 句的"使用建议"

## 零结果与幻觉防护

- 所有归档验证结论必须引用工具确认结果（文件路径 + 状态）
- 完成引导中的"使用阶段建议"必须基于本次会话实际使用的 action 推断，禁止凭空推测
- 无活跃变更时输出"无活跃变更可归档"而非编造归档内容

标注规则：工具确认→无标注 / 降级推测→"⚠️ 降级分析" / 通用建议→"💡 通用建议"

---

## 前置逻辑（SDD 自有）

### 0. 前置校验

- **警告**：未执行 sdd-verify → 建议先运行 /sdd-verify 确认所有场景覆盖，用户确认后可强制继续（简单修复允许跳过 verify 直接归档）
- **警告**：存在未通过的 review issues → 列出未通过项，建议修复后再归档，用户确认后可强制继续

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

### 2.5 延后项提取

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

### Step 3: Finish Branch

**invoke `superpowers:finishing-a-development-branch`**

Override 指令：
```
完成后停止 — 不要自动调用其他 skill 或继续下一个 action
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

变更已完成，无后续操作。
```

注意：完成引导不再输出"使用阶段建议"。使用建议应由 `/sdd-doctor` 基于实际使用数据给出，而非归档时凭空推断。
