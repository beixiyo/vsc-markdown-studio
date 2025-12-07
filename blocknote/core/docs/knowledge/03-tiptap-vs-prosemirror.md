# Tiptap 与 ProseMirror 的关系分析

## 问题解析
**"既然 Tiptap 是个完整的 Markdown 编辑器，为什么还需要 ProseMirror 呢？"**

这是一个常见的误解。答案是：**Tiptap 不是 ProseMirror 的替代品，而是 ProseMirror 的"外骨骼"或"驱动程序"。**

如果没有 ProseMirror，Tiptap 根本无法运行。它们的关系类似于 **React 与 JavaScript**，或者 **汽车与发动机** 的关系。

## 1. 核心关系：分层架构

BlockNote 的技术栈是一个典型的三层洋葱结构：

| 层级 | 名称 | 角色 | 职责 |
| :--- | :--- | :--- | :--- |
| **顶层** | **BlockNote** | **业务抽象层** | 定义"块"的概念，处理 Notion 风格的交互（拖拽、斜杠菜单），将复杂的底层操作简化为块操作。 |
| **中间层** | **Tiptap** | **开发者体验层 (Framework)** | 将 ProseMirror 极其繁琐的 API 封装成现代、易用的 Hook 和 Class。提供易用的扩展（Extension）系统和命令（Command）链。 |
| **底层** | **ProseMirror** | **核心引擎 (Engine)** | 处理最难的部分：Contenteditable 的光标控制、事务（Transaction）、撤销重做栈、协同冲突解决（Steps）、Schema 约束。 |

## 2. 为什么 Tiptap 必须依赖 ProseMirror？

Tiptap 并不是自己重新写了一个编辑器引擎，它**完全依赖** ProseMirror 来完成所有实际的工作。

### ProseMirror 做了什么（引擎的工作）？
ProseMirror 解决了富文本编辑器开发中**最困难、最底层**的问题，这些是 Tiptap 没有重新发明的：
1.  **文档模型 (Model)**：定义文档不是 HTML 字符串，而是一棵树（Node Tree）。
2.  **事务系统 (Transactions)**：每一次按键、每一个加粗操作，都是一个 Transaction。这让"撤销/重做"和"多人协同"成为可能。
3.  **光标与选区 (Selection)**：在浏览器极其混乱的 `contenteditable` 接口之上，抹平了 Safari/Chrome/Firefox 的差异。
4.  **序列化/解析 (Serializer/Parser)**：负责 HTML/Markdown 与内部 JSON 树之间的转换。

### Tiptap 做了什么（框架的工作）？
如果你直接用 ProseMirror 开发，你需要写大量的样板代码。Tiptap 把这些封装了：
1.  **Headless UI**：ProseMirror 原生没有任何 UI 绑定，Tiptap 提供了很好的 Vue/React 绑定接口（BlockNote 也是看中了这一点）。
2.  **扩展管理**：ProseMirror 的插件（Plugin）配置很复杂，Tiptap 发明了一套 `Extension` 类，把 Schema 定义、快捷键、输入规则、命令都打包在一起。
3.  **链式命令**：`editor.chain().focus().toggleBold().run()` —— 这种优雅的 API 是 Tiptap 提供的，原生 ProseMirror 需要你手动创建并分发 Transaction。

## 3. BlockNote 为什么要引入 Tiptap？

既然 BlockNote 要做通过"块"来抽象，为什么不直接基于 ProseMirror？

1.  **利用生态**：Tiptap 拥有巨大的插件生态。BlockNote 虽然禁用了 Tiptap 的核心样式，但依然利用了它的扩展机制（如 `Extension.create`）来管理功能。
2.  **简化开发**：Tiptap 的 API 比 ProseMirror 友好太多。BlockNote 的核心开发者不需要每天去处理底层的 ProseMirror Transaction 细节，而是调用 Tiptap 的 API。
3.  **React 友好**：BlockNote 利用了 Tiptap 成熟的 React 渲染流（`NodeView` 的 React 包装器），这比手写 ProseMirror 的 React 绑定要稳定得多。

## 4. 总结

并不是 "Tiptap 还需要 ProseMirror"，而是 **Tiptap 就是一个运行在 ProseMirror 引擎上的皮肤**。

*   **ProseMirror** 提供了**能力**（它是强大的）。
*   **Tiptap** 提供了**易用性**（它是现代的）。
*   **BlockNote** 提供了**特定形态**（它是块级的、Notion 风格的）。

你现在的选择（基于 BlockNote 结构）意味着你实际上同时拥有了这三者的力量：
- 你拥有 BlockNote 的**块结构**。
- 你可以使用 Tiptap 的**扩展生态**。
- 在遇到极端复杂的底层需求时，你依然可以直接访问 **ProseMirror 的底层 API**（BlockNote 暴露了 `editor.prosemirrorView`）。
