# 新工具接入模板

将新的 AI 工具或插件接入 SDD 工作流的标准模板。

---

## 接入步骤

### 1. 创建工具注册文件

在 `integrations/` 目录下创建 `<tool-name>.md`：

```markdown
# <工具名称>

## 基本信息
- **名称:**
- **用途:** 一句话描述
- **检测方式:** 如何判断此工具已安装
- **官网/仓库:** URL

## Action 映射

此工具可以增强或替换哪些 SDD action？

- [ ] sdd-brainstorm — 增强/替换 brainstorm 的探索能力
- [ ] sdd-propose — 增强/替换提案生成
- [ ] sdd-continue / sdd-ff — 增强/替换 artifact 生成
- [ ] sdd-plan — 增强/替换计划生成
- [ ] sdd-code — 增强/替换 TDD 实施能力
- [ ] sdd-review-spec — 增强/替换 spec 审查
- [ ] sdd-review-code — 增强/替换代码审查
- [ ] sdd-verify — 增强/替换验证能力
- [ ] sdd-ship — 增强/替换归档/合并
- [ ] sdd-doctor — 增强/替换环境诊断
- [ ] 新 action — 需要新增一个独立的 action

## 输入

此工具需要读取什么？
- 输入来源（文件路径、数据格式）
- 必需输入 vs 可选输入

## 输出

此工具产出什么？
- 输出位置（文件路径）
- 输出格式
- 下游 action 如何消费此输出

## 调用方式

- 命令/技能名称
- 参数格式
- 是否需要用户交互

## 质量门

此工具完成后应满足什么标准？

## Override 需求

此工具介入时，是否需要 Override 底层 skill 的默认行为？
- 具体要 Override 什么
- 具体要禁止什么
- 保留什么

## Token 影响

- 预估额外 token 消耗
- 可优化的点
```

### 2. 更新对应 Action Skill

在映射到的 action 的 SKILL.md 中：
- 更新核心执行部分（增加新工具的 invoke 逻辑）
- 更新 Override 指令（如需要）
- 更新质量门

### 3. 更新 sdd-doctor

在 sdd-doctor 中添加新工具的检测逻辑。

### 4. 测试验证

- [ ] 工具检测正确
- [ ] Action 在工具不可用时正确降级
- [ ] 与已有工具的串联/互斥逻辑正确
- [ ] Token 消耗在预期范围内
