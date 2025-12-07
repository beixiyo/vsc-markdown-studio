# BlockNote 学习指南

## 学习背景

这个仓库更新很快，而且代码都是别人维护，自己添加功能比较麻烦。作者甚至故意让构建都一堆报错。因此需要快速了解核心实现，以便自己开发一套高效的 Markdown 编辑器。

## 核心问题解答

### 1. BlockNote 的核心实现和基础

**技术栈**：
- **底层**：ProseMirror - 提供文档模型、状态管理、事务系统
- **中间层**：Tiptap - 基于 ProseMirror 的富文本编辑器框架，提供扩展系统和命令系统
- **上层**：BlockNote - 在 Tiptap 之上构建的 Block 抽象层

**架构特点**：
- BlockNote 使用 Tiptap 编辑器实例（`editor._tiptapEditor`），但禁用了 Tiptap 的核心扩展（`enableCoreExtensions: false`）
- 核心逻辑在 `packages/core`，与 UI 框架解耦
- React 视图层在 `packages/react`，但核心逻辑可以用于任何框架

详细架构说明见：[架构概览](./01-architecture-overview.md)

### 2. "块"（Block）的概念和好处

BlockNote 的 Block 是一个高级抽象，提供了稳定的 `id` 和清晰的层级结构。详细说明见：[Block 模型文档](./02-block-model.md)

**核心优势**：
- **稳定的标识**：每个 Block 有唯一的 `id`，便于追踪和操作
- **统一的 API**：所有 Block 都支持相同的操作（插入、移动、嵌套、删除）
- **清晰的层级结构**：`content` 和 `children` 分离，便于实现拖拽、缩进等操作
- **易于序列化**：结构清晰，易于存储和传输

### 3. 评论功能实现

评论功能**不必须基于块**，BlockNote 使用 Mark 实现。ProseMirror 的 Mark 机制自动处理大部分边界情况。详细说明见：[评论与协同文档](./04-comments-and-collaboration.md)

**关键点**：
- 使用 Tiptap Mark（不是 Node）实现评论标记
- `inclusive: false` 确保边界输入不会扩展标记
- `keepOnSplit: true` 确保换行时标记保持连续
- 当标记完全消失时，线程数据仍在 ThreadStore 中，可手动处理

### 4. 多人协同实现

基于 Yjs 实现，配合 `y-prosemirror` 插件。评论数据通过 `ThreadStore` 管理，可以基于 Yjs 或 REST API。详细说明见：[评论与协同文档](./04-comments-and-collaboration.md#多人协同实现)

## 实现自己的编辑器

基于 BlockNote 的学习，实现一套高效的 Markdown 编辑器的建议：

### 技术选型

1. **底层引擎**：继续使用 ProseMirror（处理文档模型、事务系统、光标控制等）
2. **框架层**：
   - 可以选择 Tiptap（API 友好，生态成熟）
   - 或者直接基于 ProseMirror（更灵活，但开发成本高）
3. **数据模型**：
   - 可以借鉴 BlockNote 的 Block 模型（稳定的 ID、清晰的层级结构）
   - 或者设计自己的数据结构
4. **协同方案**：继续使用 Yjs（CRDT，成熟的协同解决方案）

### 架构设计

1. **Core-UI 分离**：确保核心逻辑与 UI 框架解耦
2. **插件系统**：设计灵活的扩展机制
3. **评论功能**：基于 Mark 实现，处理好边界情况
4. **性能优化**：
   - Block 缓存
   - 增量更新
   - 懒加载

### 开发计划

1. **第一阶段**：实现核心编辑器功能
   - 基于 ProseMirror/Tiptap
   - 实现基础的 Block 模型
   - 支持基础的文本编辑

2. **第二阶段**：实现高级功能
   - 拖拽排序
   - 嵌套结构
   - 批量操作

3. **第三阶段**：实现协同和评论
   - 集成 Yjs
   - 实现评论功能
   - 处理边界情况

4. **第四阶段**：优化和扩展
   - 性能优化
   - 插件系统
   - 多 UI 框架支持