# CSS 变量使用记录

本文档记录了 `tiptap-editor/packages` 项目中使用 `_keyframe-animations.scss` 和 `_variables.scss` 定义的变量的文件。

## 1. Keyframe 动画使用

定义文件: `tiptap-styles/src/styles/_keyframe-animations.scss`

动画列表:
- fadeIn
- fadeOut
- zoomIn
- zoomOut
- zoom
- slideFromTop
- slideFromRight
- slideFromLeft
- slideFromBottom
- spin

使用这些动画的文件:
- `tiptap-comps/src/ui/popover/popover.scss`
- `tiptap-comps/src/ui/dropdown-menu/dropdown-menu.scss`

## 2. 使用 CSS 变量的文件列表

### tiptap-styles 包 (11 个文件)
- `src/styles/_variables.scss` (定义文件)
- `src/styles/_editor.scss`
- `src/tiptap-node/list-node/list-node.scss`
- `src/tiptap-node/paragraph-node/paragraph-node.scss`
- `src/tiptap-node/image-upload-node/image-upload-node.scss`
- `src/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss`
- `src/tiptap-node/code-block-node/code-block-node.scss`
- `src/tiptap-node/blockquote-node/blockquote-node.scss`
- `src/tiptap-node/image-node/image-node.scss`
- `src/tiptap-node/heading-node/heading-node.scss`

### tiptap-comps 包 (16 个文件)
- `src/select-toolbar/index.tsx`
- `src/ui/button/button-colors.scss`
- `src/ui/tooltip/tooltip.scss`
- `src/ui/toolbar/toolbar.scss`
- `src/ui/separator/separator.scss`
- `src/ui/popover/popover.scss`
- `src/ui/input/input.scss`
- `src/ui/dropdown-menu/dropdown-menu.scss`
- `src/ui/card/card.scss`
- `src/ui/button/button.scss`
- `src/ui/badge/badge.scss`
- `src/ui/badge/badge-colors.scss`
- `src/tiptap-ui/color-highlight-popover/color-highlight-popover.tsx`
- `src/tiptap-ui/outline-button/outline-panel.tsx`
- `src/tiptap-ui/color-highlight-button/use-color-highlight.ts`
- `src/tiptap-ui/color-highlight-button/color-highlight-button.scss`

### tiptap-comment 包 (7 个文件)
- `src/plugin/comment-plugin.ts`
- `src/react/comment-sidebar.tsx`
- `src/react/components/comment-edit-dialog.tsx`
- `src/react/components/comment-item.tsx`
- `src/react/components/comment-main.tsx`
- `src/react/components/reply-dialog.tsx`
- `src/react/components/inline-comment-popover.tsx`

### tiptap-ai 包 (2 个文件)
- `src/react/ai-action-panel.tsx`
- `src/react/ai-input-popover.tsx`

### tiptap-trigger 包 (2 个文件)
- `src/react/ui/suggestion-menu.tsx`
- `src/react/ui/suggestion-menu-item.tsx`

### tiptap-mermaid 包 (1 个文件)
- `src/mermaid-node.tsx`

## 3. 使用的变量类型

### 灰度颜色变量
- --tt-gray-light-a-* (50-900)
- --tt-gray-light-* (50-900)
- --tt-gray-dark-a-* (50-900)
- --tt-gray-dark-* (50-900)

### 品牌颜色变量
- --tt-brand-color-* (50-950)

### 绿色/黄色/红色颜色变量
- --tt-color-green-* (inc-5 到 dec-5)
- --tt-color-yellow-* (inc-5 到 dec-5)
- --tt-color-red-* (inc-5 到 dec-5)

### 阴影/圆角/过渡变量
- --tt-shadow-*
- --tt-radius-*
- --tt-transition-*
- --tt-accent-contrast
- --tt-destructive-contrast
- --tt-foreground-contrast

### 全局颜色变量
- --tt-bg-color
- --tt-border-color
- --tt-border-color-tint
- --tt-sidebar-bg-color
- --tt-scrollbar-color
- --tt-cursor-color
- --tt-selection-color
- --tt-card-bg-color
- --tt-card-border-color

### 文本颜色和高亮颜色变量
- --tt-color-text-* (gray, brown, orange, yellow, green, blue, purple, pink, red)
- --tt-color-text-*-contrast
- --tt-color-highlight-* (yellow, green, blue, purple, red, gray, brown, orange, pink)
- --tt-color-highlight-*-contrast

### 自定义颜色变量
- --text-color-primary
- --text-color-secondary
- --text-color-disabled
- --text-color-placeholder
- --bg-color-primary
- --bg-color-secondary
- --bg-color-disabled
- --bg-color-placeholder
- --bg-color-hover
- --bg-color-active
- --bg-color-selected
- --bg-color-focus

### 基础颜色变量
- --white
- --black
- --transparent

### 基础样式变量
- overflow-wrap
- text-size-adjust
- text-rendering
- -webkit-font-smoothing
- -moz-osx-font-smoothing
- box-sizing

## 统计总结

- **Keyframe 动画**: 2 个文件使用
- **使用 CSS 变量的文件**: 39 个文件（不含定义文件）
- **定义文件**: 2 个（_variables.scss 和 _keyframe-animations.scss）

**总计**: 41 个文件涉及 CSS 变量系统

## 按包分类统计

| 包名 | 文件数量 |
|------|----------|
| tiptap-styles | 11 |
| tiptap-comps | 16 |
| tiptap-comment | 7 |
| tiptap-ai | 2 |
| tiptap-trigger | 2 |
| tiptap-mermaid | 1 |
| **总计** | **39** |
