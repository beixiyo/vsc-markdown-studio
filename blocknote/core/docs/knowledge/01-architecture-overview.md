# BlockNote 架构概览

## 技术栈分层

BlockNote 采用三层架构，每层职责明确：

| 层级 | 名称 | 角色 | 职责 |
| :--- | :--- | :--- | :--- |
| **顶层** | **BlockNote** | **业务抽象层** | 定义"块"的概念，处理 Notion 风格的交互（拖拽、斜杠菜单），将复杂的底层操作简化为块操作。 |
| **中间层** | **Tiptap** | **开发者体验层 (Framework)** | 将 ProseMirror 极其繁琐的 API 封装成现代、易用的 Hook 和 Class。提供易用的扩展（Extension）系统和命令（Command）链。 |
| **底层** | **ProseMirror** | **核心引擎 (Engine)** | 处理最难的部分：Contenteditable 的光标控制、事务（Transaction）、撤销重做栈、协同冲突解决（Steps）、Schema 约束。 |

## 核心组件关系

### ProseMirror 和 Tiptap 的关系

Tiptap 不是 ProseMirror 的替代品，而是 ProseMirror 的"外骨骼"或"驱动程序"。如果没有 ProseMirror，Tiptap 根本无法运行。

**ProseMirror 提供核心能力**：
- 文档模型（Schema/Node）
- 事务系统（Transaction）
- 光标与选区管理
- 序列化/解析

**Tiptap 提供开发便利**：
- 友好的 API 封装
- 扩展管理系统
- 链式命令调用
- React/Vue 绑定

### BlockNote 为何引入 Tiptap

1. **利用生态**：Tiptap 拥有巨大的插件生态
2. **简化开发**：API 比原生 ProseMirror 友好太多
3. **React 友好**：成熟的 React 渲染流

## BlockNote 的独特价值

BlockNote 在 Tiptap 之上构建了 **Block 抽象层**：

- **核心逻辑**：在 [packages/core](../../packages/core)
- **React 视图层**：在 [packages/react](../../packages/react)
- **禁用 Tiptap 核心扩展**：`enableCoreExtensions: false`，完全自定义块系统

## 数据模型

文档由有序 Block 列表组成，每个 Block 具备 `id/type/props/content/children` 结构。详细说明见：[Block 模型文档](./02-block-model.md)。

## 协同基座

核心依赖 Yjs（`y-prosemirror`）同步文档与插件状态。详情见：[评论与协同文档](./04-comments-and-collaboration.md)。

## 扩展系统

BlockNote 提供了扩展系统（Extension），允许开发者扩展编辑器功能。详情见：[架构文档](./05-core-ui-decoupling.md)。