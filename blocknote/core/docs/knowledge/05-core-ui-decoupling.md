# 核心逻辑与 UI 解耦架构

## 核心思想

BlockNote 采用了 **Core-UI 分离** 的架构，确保核心编辑器逻辑（`packages/core`）不依赖于任何特定的 UI 框架（如 React/Vue）。UI 框架层（`packages/react`）仅作为视图层，通过标准接口与 Core 交互。

这种架构允许：
1.  核心逻辑复用：同一套 Core 可以支持 React, Vue, Svelte, Vanilla JS 等。
2.  性能优化：Core 专注于数据和状态，UI 专注于渲染。
3.  清晰的边界：通过明确的 API 契约（Interface）进行通信。

## 架构组件

### 1. Core 层 (`@blocknote/core`)

- **BlockNoteEditor 类**：核心控制器，封装了 Tiptap/ProseMirror 实例。
- **状态管理**：
  - 维护文档模型（ProseMirror Doc）。
  - 提供 `onChange`, `onSelectionChange` 等订阅方法。
  - 通过 `editor.document` 等 Getter 暴露当前状态。
- **渲染接口 (`NodeView`)**：
  - Core 不直接渲染 React 组件。
  - 它遵循 ProseMirror 的 `NodeView` 协议：每个 Block 类型必须提供一个 `render` 函数，该函数返回标准的 `HTMLElement` (DOM)。

### 2. UI 桥接层 (`@blocknote/react`)

这一层负责将 React 组件"注入"到 Core 的渲染流程中。

#### 关键机制：`ElementRenderer`

Core 定义了一个插槽（Slot），允许 UI 层接管组件的挂载：

```typescript
// packages/core/src/editor/BlockNoteEditor.ts
public elementRenderer: ((node: any, container: HTMLElement) => void) | null = null;
```

React 层在初始化时，会注入一个 `elementRenderer` 实现：

```typescript
// 伪代码逻辑
editor.elementRenderer = (reactComponent, container) => {
  // 使用 React Portal 或 createRoot 将 component 挂载到 container
  renderToDOM(reactComponent, container);
}
```

#### 渲染流程

1.  **ProseMirror 需要渲染一个 Block**：调用该 Block Spec 中定义的 `render` 函数。
2.  **Block Spec (在 React 层定义)**：
    - 创建一个空的 `div` 容器。
    - 调用 `editor.elementRenderer(<MyReactBlock />, div)`。
    - 返回 `div` 给 ProseMirror。
3.  **Core**：将 `div` 插入到编辑器 DOM 树中。
4.  **React**：异步地将组件渲染到那个 `div` 中。

## 实现细节

### 自定义 Block 的定义

在 Core 中，Block 定义要求返回 DOM：

```typescript
// Core 中的定义接口
type BlockImplementation = {
  render: (block, editor) => { dom: HTMLElement, contentDOM?: HTMLElement }
}
```

在 React 中，通过辅助函数（如 `createReactBlockSpec`）包装这个过程：

```typescript
// React 层
function createReactBlockSpec(Config, ReactComponent) {
  return {
    ...Config,
    render: (block, editor) => {
      const dom = document.createElement("div");
      // 委托给 elementRenderer
      if (editor.elementRenderer) {
        editor.elementRenderer(<ReactComponent block={block} />, dom);
      }
      return { dom };
    }
  };
}
```

## 状态同步

UI 层通过 **Hooks** 订阅 Core 的变化：

1.  **`useCreateBlockNote`**：创建 Editor 实例，注入 `elementRenderer`。
2.  **`useEditorChange`**：
    - 监听 `editor.onChange`。
    - 当 Core 数据变更时，触发 React `setState`，导致组件重渲染。
    - 实现了 **Core 推送 -> UI 更新** 的单向数据流。

## 总结

这种 **Core-Delegate-UI** 模式（核心委托 UI 渲染）是实现富文本编辑器跨框架支持的最佳实践。核心只负责 "What to render" (Schema/Model) 和 "Where to render" (DOM container)，而由具体框架层负责 "How to render" (Components)。