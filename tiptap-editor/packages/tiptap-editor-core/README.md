# tiptap-editor-core

编辑器核心配置：预设扩展组合、编辑器初始化、React 入口组件。

## 导出

| 导出 | 说明 |
|------|------|
| `createExtensions` | 工厂函数，返回预配置的扩展列表（StarterKit + Markdown + CodeBlock + Table + Image + TaskList 等） |
| `useDefaultEditor` | 创建预配置的 tiptap editor 实例 |
| `useMobileView` | 移动端视图状态管理 |
| `TiptapEditorComponent` | 编辑器 React 入口组件 |
| `ClickHandlerRegistry` | 点击事件注册表 |

## 预设扩展

StarterKit / CodeBlock / Markdown / TextAlign / TaskList / TaskItem / GradientHighlight / ImageNode / TableKit / Typography / Superscript / Subscript / Selection / HoverContextHighlight / Placeholder

## 依赖

`tiptap-hover`
