# tiptap-comps

编辑器 UI 组件库：工具栏、浮动菜单、格式按钮、图标集。

## 组件

| 组件 | 说明 |
|------|------|
| `SelectToolbar` | 选中文本浮动工具栏，包含 `ToolbarContent` 和 `MoreContentItem` 子组件 |
| `BlockActionMenu` | 块级操作菜单（hover 时显示在行左侧的拖拽 / 选择图标） |
| `TableControls` | 表格行列操作浮动按钮 |
| `MarkButton` | 通用 mark 切换按钮（bold / italic / strike / code / underline / superscript / subscript） |
| `TextFormatDropdownMenu` | 文本格式下拉（标题、段落、列表、引用） |
| `TextAlignDropdownMenu` | 文本对齐下拉 |
| `ColorHighlightPopover` | 文字颜色 / 高亮选择器 |
| `EditorLink` / `EditorLinkHover` | 链接编辑和 hover 预览 |
| `CodeBlockButton` | 代码块切换 |
| `ImageUploadButton` | 图片上传 |
| `UndoRedoButton` | 撤销 / 重做 |
| `OutlineButton` | 大纲面板 |
| `Toolbar` | 工具栏容器（含 `Group` / `Separator`） |

## 图标

```ts
import { BoldIcon, ItalicIcon, HeadingIcon, ... } from 'tiptap-comps/icons'
```

40+ 编辑器图标组件。

## 依赖

`tiptap-api` `tiptap-hover` `tiptap-utils`
