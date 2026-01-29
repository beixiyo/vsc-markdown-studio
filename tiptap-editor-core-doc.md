# Tiptap Editor Core (`tiptap-editor-core`) DONE

`tiptap-editor-core` 是 Markdown Studio 的核心编辑器封装包，旨在提供一个高度预配置且易于扩展的 Tiptap 编辑器基础。它整合了常用的扩展、自定义点击处理逻辑以及 React 上下文支持。

## 核心特性

- **React 集成**：提供 `TiptapEditor` 组件和 `useDefaultEditor` 钩子，深度适配 React 生命周期。
- **性能优化**：通过 `useMemo` 记忆化配置和扩展，结合 `memo` 和 `forwardRef` 优化重渲染性能。
- **预配置扩展**：内置 `StarterKit`、`Markdown`、`TextAlign`、`TaskList`、`Image` 等常用功能。
- **增强的交互**：优化了链接点击（Cmd/Ctrl + 点击打开）和选区取消逻辑。
- **Markdown 支持**：通过 `@tiptap/markdown` 实现高效的 Markdown 输入与输出转换。

## 安装与使用

由于项目采用 Monorepo 结构，可以通过以下方式引用：

```tsx
import { TiptapEditor, useDefaultEditor } from 'tiptap-editor-core'

const MyEditor = () => {
  const editor = useDefaultEditor({
    content: '<p>Hello World</p>',
  })

  return (
    <TiptapEditor editor={editor}>
      {/* 这里可以放置自定义的 Toolbar 等组件 */}
    </TiptapEditor>
  )
}
```

## 核心 API

### `TiptapEditor` 组件

包装了 Tiptap 的 `EditorContent` 和 `EditorContext`，确保编辑器实例在组件树中可用。使用 `forwardRef` 支持外部获取 `Editor` 实例。

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `editor` | `Editor \| null` | Tiptap 编辑器实例 |
| `children` | `ReactNode` | 可选，通常用于插入 Toolbar 或 Floating Menu |
| `className` | `string` | 应用于编辑器容器的类名 |
| `style` | `CSSProperties` | 应用于编辑器容器的样式 |

### `useDefaultEditor` 钩子

这是一个封装了 `useEditor` 的自定义钩子，自动注入了 Markdown Studio 的默认配置并进行了性能优化。

```tsx
const editor = useDefaultEditor(options: UseEditorOptions)
```

**默认配置包含：**
- `immediatelyRender: false`：防止 SSR 或初始化时的闪烁。
- **属性优化**: 禁用了浏览器的自动纠错、首字母大写等干扰输入的行为。
- **点击处理**: 注入了自定义的点击处理器，支持链接跳转和选区优化。
- **记忆化**: 自动记忆化 `extensions` 和 `editorProps`，避免不必要的编辑器重初始化。

### `createExtensions` 函数

返回编辑器默认使用的扩展列表。

**包含的主要扩展：**
- **StarterKit**: 基础包（加粗、斜体、列表等），禁用了默认水平线。
- **Markdown**: 核心扩展，支持 2 空格缩进和 GFM 语法。`pedantic` 模式已禁用以兼容现代 Markdown 习惯。
- **TextAlign**: 支持标题和段落的对齐。
- **TaskList & TaskItem**: 支持任务列表及嵌套。
- **Highlight**: 多色高亮支持。
- **Placeholder**: 针对不同节点（标题、引用、代码块）提供定制化的占位符。

## 交互逻辑

### 链接处理
- 普通点击：在编辑模式下，点击链接不会跳转，以便进行文本编辑。
- **Cmd/Ctrl + 点击**：安全地在新标签页中打开链接。

### 选区优化
- 解决了从外部输入框切回编辑器时，点击无法正确取消现有选区的问题。
- 点击现有选区内部时，会自动将光标移动到点击位置，从而自然地取消选区。

## 最近的改进 (基于代码审查)

- **Ref 处理**：`TiptapEditor` 现在使用 `forwardRef` 和 `useImperativeHandle`，遵循 React 的副作用管理最佳实践。
- **稳定性增强**：`useDefaultEditor` 内部对 `extensions` 和 `editorProps` 进行了记忆化处理，显著提升了大型文档下的性能和稳定性。
- **Markdown 兼容性**：调整了 `Markdown` 扩展配置，禁用了 `pedantic` 模式，使其更符合 GitHub 风格 Markdown (GFM) 的用户预期。
