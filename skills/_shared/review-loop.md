### Review 循环

读取 `<reviewer-prompt>.md`，dispatch subagent 进行审查：

**审查维度：**
- 方案完整性（是否覆盖了需求的核心场景）
- 决策清晰度（每个关键决策是否有明确的结论和理由）
- YAGNI 检查（是否包含不需要的功能）
- 可测试性（决策是否导向可验证的结果）

**Review 流程（最多 3 轮）：**

读取 `openspec/config.yaml` 的 `limits.review-rounds` 配置值（默认 3），作为 review 循环上限。

**配置值验证**：
- 配置项不存在 → 使用默认值 3
- 配置项值为非数字类型 → 使用默认值 3
- 配置项值为 0 或负数 → 使用默认值 3

Review 流程：
1. Dispatch reviewer subagent，产出 `reviews/<artifact>-r1.md`
2. 如果有 issues：
   - 展示 issues 给用户
   - 用户确认修复方向
   - 修复后重新 review（`reviews/<artifact>-r2.md`）
3. 最多 N 轮（N = limits.review-rounds），通过或用户接受后停止

**Review 达限处理**：

当 review 循环达到 `limits.review-rounds`（默认 3）轮次时：
1. 输出已达 review 上限的提示
2. 列出剩余未解决的 issues
3. 提供选项：
   - `① 继续修复` — 进入下一轮 review，不再有轮次限制
   - `② 接受当前状态并继续` — 终止 review 循环，在 review 文件中标注"用户接受，剩余 issues 未修复"，进入后置逻辑
4. 提示消息包含可发现性信息："可在 openspec/config.yaml 的 limits 节中调整上限"

**用户选择"继续修复"后**：
- 取消轮次限制
- 进入下一轮 review，直到所有 issues 解决或用户主动选择接受
- 每轮修复结束时再次提供"继续修复"或"接受并继续"选项
- 如果 AI 无法解决某些 issues（技术限制/需求冲突），用户可通过"接受并继续"选项退出

**用户选择"接受并继续"后**：
- review 循环终止
- 在 review 文件中标注"用户接受，剩余 issues 未修复"
- 进入后置逻辑的产物校验和完成引导
