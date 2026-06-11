# tiptap-hover

Hover 探测系统：追踪鼠标在编辑器中的位置，提供上下文高亮和 tooltip。

## 能力

| 能力 | 说明 |
|------|------|
| **上下文高亮** | 鼠标悬停时高亮当前 block / context / line 区域（ProseMirror Decoration） |
| **Tooltip** | 跟随鼠标的浮动提示（显示位置、block 类型、section 等信息） |
| **位置探测** | 通过视口坐标获取 ProseMirror 位置和内容上下文 |

> 纯装饰扩展：状态只活在 Decoration / PluginState，不写入文档，不参与 markdown / html / json 序列化

## 导出

### Extension

```ts
import { HoverContextHighlight, hoverContextHighlightKey } from 'tiptap-hover'
```

- `HoverContextHighlight` — Tiptap 扩展，自动根据鼠标位置添加高亮 Decoration
- 支持 `autoSyncOnPointer` / `throttleMs` / `disableOnDrag` / `disableOnSelection` 配置
- `layerClassNames` 自定义各层高亮样式（block / context / line）

### React

```ts
import { HoverTooltip, useHoverDetection } from 'tiptap-hover/react'
```

| 导出 | 说明 |
|------|------|
| `HoverTooltip` | 编辑器 hover tooltip 组件 |
| `useHoverDetection` | 获取当前 hover 位置的内容（`posContent`） |
| `useHoverTooltip` | tooltip 定位和显隐控制 |

## 依赖

`tiptap-api` `tiptap-utils`
