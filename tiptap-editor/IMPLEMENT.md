# Tiptap / ProseMirror 二次开发与 AI 集成架构指南

这份文档专为本项目的 Tiptap Monorepo 架构（`tiptap-editor/packages/`）量身定制，深度剖析如何实现 AI 辅助、上下文感知、自定义节点等进阶功能，并明确 Tiptap / ProseMirror 的能力边界

## 📚 官方文档必读参考

在进行二次开发前，强烈建议查阅以下核心官方文档：

*   **Tiptap 核心概念**
    *   [自定义扩展 (Custom Extensions)](https://tiptap.dev/docs/editor/guide/custom-extensions)
    *   [React 节点视图 (React Node Views)](https://tiptap.dev/docs/editor/guide/node-views/react) - 用于将 React 组件挂载到编辑器节点
    *   [命令系统 (Commands)](https://tiptap.dev/docs/editor/api/commands) - 操纵编辑器内容的顶层 API
*   **ProseMirror 底层原理 (Tiptap 的引擎)**
    *   [文档结构 (Document / AST)](https://prosemirror.net/docs/guide/#doc) - 理解 Node 与 Mark
    *   [状态与事务 (State & Transactions)](https://prosemirror.net/docs/guide/#state) - 编辑器不可变状态机原理
    *   [装饰器 (Decorations)](https://prosemirror.net/docs/guide/#view.decorations) - **开发 AI 临时状态/Hover 的核心！**

---

## 🛑 核心认知：Tiptap 的能力边界

Tiptap 是基于 **ProseMirror** 的无头（Headless）包装器。要理解它的边界，必须先理解它的底层原则：

1. **绝对的数据驱动（Schema 强校验）**：你**不能**直接通过原生 JS（如 `innerHTML` 或 `appendChild`）向编辑器强塞 HTML。任何不在 `Schema`（Nodes 或 Marks）中定义的标签，在粘贴或输入时都会被立刻过滤或抹除掉
2. **状态不可变（State & Transaction）**：文档的内容改变（加字、删字、加粗），必须通过派发 `Transaction`（事务）完成，而不能直接修改 DOM
3. **DOM 与数据的分离**：你在屏幕上看到的 DOM 只是 State 的映射。任何临时性、不该存入数据库的 UI（比如 AI 正在生成的 loading 状态、悬浮高亮框）**绝对不能**作为 Node 插入文档，而必须使用 **Decorations（装饰器）**

---

## 🗺️ 核心需求实现地图（How-To）

根据具体需求，以下是技术落地方案及在当前架构下的修改位置：

### 1. 临时 UI 状态反馈（Decorations 装饰器）

**场景**：AI 正在逐字输出时的特殊文字颜色；用户 Hover 某段文字时出现的选中边框背景（不需要保存到后端的临时样式）
**边界**：Decorations 仅存在于内存，不改变文档 State，不会触发历史记录（Undo/Redo），不会被保存为 Markdown

**实现方式**：
你需要编写一个 ProseMirror Plugin 来计算并渲染 `Decoration`
*   `Decoration.inline(from, to, { class: 'bg-systemOrange/10' })`：行内样式
*   `Decoration.node(from, to, { class: 'border border-systemOrange' })`：包裹整个块级节点
*   `Decoration.widget(pos, domNode)`：在文字中间强行插入一个不可编辑的 DOM 元素（比如光标跟随的闪烁 AI Sparkles 图标）

**在项目中的修改位置**：
*   目前在 `packages/tiptap-hover/src/hover-context-highlight.ts` 中已有基于 Hover 的高亮实现
*   如果要为 AI 增加生成状态，建议在 `packages/tiptap-ai/` 中新建一个 `ai-decoration-plugin.ts`，然后将其作为扩展注册到 `packages/tiptap-editor-core/src/extensions.ts` 中

### 2. 添加自定义标签、元素（Custom Nodes / Marks）

**场景**：插入一个 Notion 风格的 “AI 摘要块”，或者特定业务属性的标签（如提及 `@某人`、自定义图片卡片）
**边界**：这些属于持久化数据，会被解析保存。行内元素使用 `Mark`，块级元素使用 `Node`

**实现方式**：
使用 Tiptap 的 `Node.create()`。由于本项目是 React 栈，极度推荐使用 `ReactNodeViewRenderer`，这样就能用 React 组件来写复杂的节点交互了

```typescript
// 伪代码示例：
addNodeView() {
  return ReactNodeViewRenderer(MyCustomBlockComponent)
}
```

**在项目中的修改位置**：
1.  **新增**：在 `packages/tiptap-nodes/src/` 下新建你的节点目录（比如 `packages/tiptap-nodes/src/ai-summary/`）
2.  在这里定义 Schema 并挂载 React UI（参考已有的 `speaker` 或 `image-upload` 组件）
3.  **注册**：在 `packages/tiptap-editor-core/src/extensions.ts` 的扩展数组中引入并注册新的 Node

### 3. 高亮文本（Highlight）

**需求区分**：
*   **持久化高亮**（用户手动涂黄的笔记，需要保存）：使用官方的 `@tiptap/extension-highlight`。在 `extensions.ts` 注册，然后在工具栏用 `editor.commands.toggleHighlight()` 触发
*   **临时高亮**（例如 AI 选中了某段文本准备进行重写）：必须使用上述的 **Decorations（装饰器）**！切勿用 Mark 污染文档真实数据

### 4. 插入文本 / 修改内容

**场景**：AI 接口流式返回文字，将其写入编辑器
**边界**：必须通过 Tiptap 命令或底层 Transaction，不能绕过状态机操作 DOM

**实现方式**：
*   **简单插入**：`editor.commands.insertContent('Hello AI')` 
*   **在特定位置插入**：`editor.commands.insertContentAt(pos, '...')` 
*   **底层精细控制**（替换区域且不破坏格式）：
    ```typescript
    editor.view.dispatch(
      editor.state.tr.replaceWith(startPos, endPos, editor.schema.text("AI的新内容"))
    )
    ```

**在项目中的修改位置**：
*   相关逻辑应收敛于 `packages/tiptap-ai/src/EditorIntegration.ts`，通过接收 AI 流式数据调用 `editor.commands` 更新内容

### 5. 核心难点：提取 Hover 文本 & 获取上下文区块

**场景**：鼠标放在某段文字上，需要让 AI 读取“当前悬浮处的段落”直到“上一个小标题”之间的所有文字内容作为上下文
**边界**：涉及原生 Mouse Event 到 ProseMirror Document Position 的坐标转换，以及 AST 树的向上遍历（Resolve）

**实现方式（组合拳）**：

1. **坐标转位置 (Coords to Pos)**：
   监听 `mousemove` 事件，获取 `e.clientX` 和 `e.clientY`
   调用 `const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })` 获取鼠标所指在文档中的真实绝对位置 (`pos.pos`)
2. **解析位置，找到当前块 (Resolve Node)**：
   调用 `const $pos = editor.state.doc.resolve(pos.pos)`
   `$pos.parent` 就是当前鼠标悬停的 Block（如段落 Paragraph）
   `$pos.parent.textContent` 就是**当前这段 Hover 文本**
3. **往前追溯查找小标题 (AST 遍历提取上下文)**：
   利用 `$pos.index(0)` 等方法在文档顶层节点中遍历提取
   
   ```typescript
   // 提取从当前块直到上一个 Heading 的全部文本
   const doc = editor.state.doc;
   let textContext = '';
   // 从当前悬浮的块开始往前找
   for (let i = $pos.index(0); i >= 0; i--) {
     const node = doc.child(i);
     textContext = node.textContent + '\n' + textContext;
     if (node.type.name === 'heading') {
        break; // 找到上一个标题，停止
     }
   }
   ```

**在项目中的修改位置**：
*   **基础坐标转换与触发**：位于 `packages/tiptap-api/src/react/hooks/use-hover-detection.ts` 和 `packages/tiptap-hover/src/`
*   **上下文数据组装**：建议在 `packages/tiptap-ai/` 增加专门的上下文提取工具类（如 `ContextExtractor.ts`），利用 Tiptap AST 组装 Markdown 上下文传递给大模型

---

## 🏗️ Monorepo 开发作战导航

当你要开发新功能时，请参照此路径决定代码落脚点：

1. **功能包含持久化到数据库的特殊格式或组件吗？**
   👉 去 `tiptap-nodes` 建立新的 Node/Mark
   
2. **功能是纯界面的 React 弹窗、按钮或工具栏吗？**
   👉 去 `tiptap-comps` 建立组件，通过 `use-tiptap-editor` hook 获取实例来调用 command

3. **功能涉及纯鼠标悬浮、选中、文本临时框选？**
   👉 去 `tiptap-hover` (鼠标经过高亮) 或 `tiptap-comps/src/selection-toolbar-content` (选中文本)。涉及获取坐标的 Hook 位于 `tiptap-api/src/react/hooks/`

4. **功能是和 LLM 对话、流式写入、读取上下文？**
   👉 去 `tiptap-ai` 中实现业务逻辑。在这里组装 prompt，调用 LLM，通过 `EditorIntegration.ts` 翻译成 Tiptap Command 操作 `tiptap-editor-core`

---

## 💡 AI 辅助编辑器的最佳实践建议

做 AI 集成编辑器，**千万不要在 AI 流式生成过程中频繁修改 State/DOM 结构（如每生成一个字就创建/销毁一个节点）**，这会导致光标跳动、严重卡顿和极差的输入体验

**推荐的流式生成接入方案**：
1. 请求 AI 前，用 `Transaction` 在光标处或目标位置插入一个不可见的 Widget 或预留的空文本节点标记位置
2. 监听 AI Stream 返回的块，向该位置增量 `insertText`
3. 给新生成的文本附加一个临时的 `Decoration` 渲染成特定颜色或动画背景（表示 AI 正在写）
4. 生成彻底完毕后，移除该 Decoration 装饰器，内容平滑回归原生文档状态