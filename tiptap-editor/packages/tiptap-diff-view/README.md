# tiptap-diff-view

Markdown 文本 Diff 的计算与 React 视图。与负责块级增量同步的 `tiptap-diff` 相互独立

## 能力

- 行级新增、删除和双栏对齐
- 字符级变化高亮
- 双栏 / 单栏切换和容器宽度阈值
- 类似 VSCode overview ruler 的点击与拖拽导航
- 浅色 / 深色调色板配置

## 使用

```tsx
import { MarkdownDiff } from 'tiptap-diff-view/react'

<MarkdownDiff
  before={ before }
  after={ after }
  splitViewMinWidth={ 960 }
  colors={ {
    light: {
      addLine: '#ebf5ec',
      addText: '#c6e4ca',
    },
  } }
/>
```

纯计算场景可以从根入口导入：

```ts
import { createDiffRows } from 'tiptap-diff-view'
```
