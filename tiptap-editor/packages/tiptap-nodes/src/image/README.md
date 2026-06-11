# ImageNode 图片节点

自定义图片节点，schema 固定为 `inline`，视觉 block 模式通过 `display` attr + CSS 模拟

## 序列化支持

| 格式 | 支持 | 说明 |
|------|------|------|
| JSON | ✅ 无损 | 所有 attrs 可序列化 |
| HTML | ✅ 无损 | 富属性走 `data-*`，详见下方 attrs 表 |
| Markdown | ✅ 无损 | 纯净图片标准语法，富属性降级内联 HTML，见下 |

### Markdown 协议

- **纯净图片**（仅 src / alt / title，其余为默认值）：`![alt](src "title")`
- **富属性图片**：自闭合 `<img ... />`，width / height 输出标准 HTML 属性（GitHub / VS Code 预览可识别尺寸），其余走 `data-*`

```markdown
![风景](https://e.com/a.png "标题")

<img src="https://e.com/a.png" alt="风景" width="300" height="200" data-align="center" data-border-radius="8px" />
```

导入侧无需特殊处理：`setContent(md, { contentType: 'markdown' })` 时由 *@tiptap/markdown* 的内联 HTML 解析路径自动还原全部属性，多轮往返逐字符幂等（见 `__tests__/markdown-roundtrip.test.ts`）

默认值不输出：`display: 'inline-block'`、`loading: 'lazy'`、`decoding: 'async'` 等于默认值时不触发 HTML 降级

## Attrs

| 分组 | 属性 | 说明 |
|------|------|------|
| 核心 | `src` `alt` `title` | 标准 img 属性 |
| 标识 | `id` | 稳定 id，**只活在 ProseMirror 状态**，不序列化；为空时由内置 plugin 自动补 `img_xxx` |
| 尺寸 | `width` `height` `aspectRatio` | 数字（px）或任意 CSS 长度 |
| 布局 | `display` `align` `verticalAlign` `float` `margin` `padding` | block 对齐 / 行内对齐 / 图文环绕 |
| 样式 | `objectFit` `borderRadius` `border` `boxShadow` `opacity` `filter` `rotate` `className` `style` | `style` 为 JSON 对象兜底 |
| 加载 | `loading` `decoding` `placeholder` `fallbackSrc` `thumbnailSrc` | 懒加载 / 占位 / 失败兜底 / LQIP |
| 跨域 | `crossOrigin` `referrerPolicy` | |

完整类型与默认值见 `types.ts` 的 `ImageAttrs`（含 JSDoc）

## Options（`configure()` 注入）

事件回调放 options 不放 attrs（attrs 必须可序列化），payload 统一为 `{ node, attrs, pos, event, editor }`

| 分组 | 选项 |
|------|------|
| 透传 | `HTMLAttributes` |
| 鼠标 | `onClick` `onDoubleClick` `onContextMenu` `onMouseEnter` `onMouseLeave` |
| 加载 | `onLoad` `onError` |
| 选中 | `onSelect` `onDeselect` |
| 拖拽 | `onDragStart` `onDrop` |
| 生命周期 | `onRemove` `onUpdateAttrs` |

## Commands

```ts
editor.commands.setImage({ src: 'https://e.com/a.png', width: 300, align: 'center' })
editor.commands.updateImage({ borderRadius: '8px' })
```
