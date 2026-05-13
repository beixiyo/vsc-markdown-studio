# tiptap-api

编辑器操作 API 层，提供内容读写、选区操作、hover 探测、大纲构建等能力。

## 核心模块

| 模块 | 导出 | 说明 |
|------|------|------|
| **content** | `getEditorContent` `setEditorContent` `getEditorMarkdown` `setEditorMarkdown` `getEditorHTML` | 内容读写，支持 JSON / HTML / Markdown |
| **selection** | `getSelectedText` `hasSelectedText` `getSelectionRange` `setSelectionRange` `getSelectionSection` | 选区查询与操作，`getSelectionSection` 返回选区所属章节上下文 |
| **hover/content** | `getContentAtPos` `getContentFromCoords` | 按位置提取上下文：block / line / section / marks |
| **hover/position** | `getHoverHighlightSpecs` `getContentFromViewCoords` | hover 高亮区间计算 |
| **cursor** | `getTextCursorPosition` `setTextCursorPosition` | 光标位置读写 |
| **command** | `setHeading` `setParagraph` `setBold` `setItalic` ... | 格式化命令 |
| **scroll** | `scrollToRange` `scrollToMark` `scrollToText` | 滚动定位 |
| **state** | `focusEditor` `isEditable` `setEditableState` `isEmptyDoc` | 编辑器状态查询 |
| **data** | `buildOutline` | 标题树结构 |
| **storage** | `StorageEngine` `LocalStorageEngine` | 内容持久化 |
| **i18n** | `useT` `createI18n` | 国际化 |

## React Hooks

```ts
import { useSelection, useTiptapEditor, useMarkdownOutline } from 'tiptap-api/react'
```

| Hook | 说明 |
|------|------|
| `useTiptapEditor` | 从 context 或 props 获取 editor |
| `useSelection` | 响应式选区文本 |
| `useMarkdownOutline` | 文档大纲 |
| `useCursorVisibility` | 光标是否可见 |
| `useScrolling` | 滚动状态 |

## 依赖

`tiptap-utils`
