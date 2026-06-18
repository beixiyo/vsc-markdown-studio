# ImageNode 图片节点

自定义图片节点，schema 固定为 `inline`，视觉 block 模式通过 `display` attr + CSS 模拟

本文同时说明 Web 节点能力、Markdown / HTML 序列化，以及移动端 WebView 通过 `MDBridge` 调用图片能力的方式

## 移动端 `MDBridge` 调用

### TL;DR

- **新增 `id` 语义**：每张图都有稳定身份标识，Native 传入，Web 记住，事件回传同一个 id。基于 id 可以 `updateImage` / `removeImage` / `getImageAttrs`
- **新增视觉预设**：`'block'`（老观感，每张独占一行）和 `'inline'`（图片和文字一样大，适合表情 / 小图标）
- **事件 payload 最小化**：只回 `id`，不回 `src` / `attrs`。Native 想要详情走 `getImageAttrs(id)` 主动拉

### 调用方式

```js
MDBridge.setImage({
  at: 'cursor',
  images: [{ src: 'a.png', id: 'local-uuid-1' }, { src: 'b.png', id: 'local-uuid-2' }],
})

MDBridge.setImage({
  at: 'top',
  images: [{ src: 'a.png', id: 'local-uuid-3' }],
})

MDBridge.setImage({
  at: 'bottom',
  images: [{ src: 'a.png', id: 'local-uuid-4' }],
})
```

| 老调用 | 新调用 |
|---|---|
| `setImagesWithURL(urls)` | `setImage({ at: 'cursor', images: urls.map(src => ({ src, id: nativeId(src) })) })` |
| `setHeaderImagesWithURL(urls)` | `setImage({ at: 'top', images: ... })` |
| `setFooterImagesWithURL(urls)` | `setImage({ at: 'bottom', images: ... })` |

顶部 / 底部插入的**替换首尾图片块**行为不变

### 关于 `id`

事件回传时 Native 需要知道"**是哪张图**"。`src` 不够用（同一张图可以插两次，src 相同），`pos` 每次编辑都会漂移。只有 id 是稳定的

- **强烈建议 Native 传入**：通常可复用本地资源 id、照片库 asset id、上传响应里的后端 id
- 如果没传，Web 侧兜底生成 id，并通过 `imageInserted` 事件返回；Native 需要保存这些 id，否则后续无法定位
- 插入时 Native 传入的 id 会跟随这张图
- 复制粘贴、撤销重做可能生成新 id，Native 以事件回传为准
- 导出 Markdown / HTML 时不会保留 id，避免污染外部数据；用 `getJSON()` 持久化文档可以保留 id

### 视觉预设

`preset` 决定图片怎么显示。不传默认 `'block'`

```js
MDBridge.setImage({
  at: 'cursor',
  preset: 'block',
  images: [{ src: 'photo.jpg', id: 'photo-1' }],
})

MDBridge.setImage({
  at: 'cursor',
  preset: 'inline',
  images: [{ src: 'smile.png', id: 'emoji-1' }],
})
```

| | `'block'`（默认） | `'inline'` |
|---|---|---|
| 排布 | 独占一行 | 与文字同一行 |
| 高度 | 原图比例 | 跟随字体大小 |
| 上下间距 | 有 | 无 |
| 适用 | 内容图、头图 | 表情、行内图标 |

### 单张图覆盖预设

`images` 数组里每项除了 `src` 和 `id`，还可以传任意 `ImageAttrs` 字段覆盖预设：

| 字段 | 含义 | 例子 |
|---|---|---|
| `src` | 图片地址，必填，支持 base64 / http / blob | `'data:image/png;base64,...'` |
| `id` | 稳定身份标识 | `'asset-abc123'` |
| `alt` | 无障碍文本 | `'封面图'` |
| `width` | 宽度 | `320` / `'100%'` |
| `height` | 高度 | `200` / `'1em'` |
| `aspectRatio` | 宽高比，防加载抖动 | `'16/9'` |
| `borderRadius` | 圆角 | `'12px'` |
| `align` | 对齐，仅 block 模式 | `'left'` / `'center'` / `'right'` |

完整字段见下方 `ImageAttrs` 表

```js
MDBridge.setImage({
  at: 'cursor',
  images: [{
    src: 'hero.jpg',
    id: 'hero-001',
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: '12px',
  }],
})
```

### 基于 id 操作图片

```js
await MDBridge.updateImage({ id: 'hero-001', attrs: { width: 480 } })
// true = 命中并修改 | false = 找不到该 id

await MDBridge.removeImage({ id: 'hero-001' })
// true = 删除成功 | false = 找不到

const attrs = MDBridge.getImageAttrs('hero-001')
// { id, src, width, align, ... } 或 null
```

### 事件回调

Native 通过现有 `notifyNative` 通道接收。事件不带 `src` / `attrs`，避免 base64 图片在每次事件里被整串搬运过桥接

| 事件名 | 触发时机 | payload |
|---|---|---|
| `imageInserted` | `setImage` 成功 | `{ at, preset, ids }` |
| `imageInsertError` | `setImage` 失败 | `{ at, preset, error }` |
| `imageTapped` | 用户点了图 | `{ id, pos }` |
| `imageLoaded` | 加载成功 | `{ id }` |
| `imageLoadError` | 加载失败 | `{ id }` |
| `imageRemoved` | 图被删除（用户直接删或 `removeImage` 调用） | `{ id }` |
| `imageAttrsChanged` | 属性变化 | `{ id, changed }` |

`changed` 是字段级 diff：

```js
{ id: 'hero-001', changed: { width: { prev: null, next: 320 } } }
```

需要 Web 侧的完整属性时，调用 `getImageAttrs(id)` 主动拉

## 解析与序列化支持

ImageNode 支持从 JSON / Markdown / HTML 三种内容格式解析，也支持再序列化回这些格式

| 格式 | 解析 | 序列化 | 说明 |
|------|------|--------|------|
| JSON | ✅ 无损 | ✅ 无损 | ProseMirror JSON 直达 `image` 节点，所有 attrs 可保留 |
| HTML | ✅ 无损 | ✅ 无损 | 解析 `<img src="...">`；富属性走 `data-*` / 标准 HTML 属性 |
| Markdown | ✅ 无损 | ✅ 无损 | 标准图片语法解析 `src` / `alt` / `title`；富属性用自闭合 `<img ... />` |

移动端普通插图优先用 `MDBridge.setImage`。如果是 AI 区域编辑、批量替换或直接设置内容，则可按场景使用 `format: 'json' | 'markdown' | 'html'`

### JSON 协议

JSON 是无损首选，适合需要完整控制图片属性的场景

```js
MDBridge.aiEdit.applyOperations({
  operations: [{
    target: blockHash,
    op: 'insertAfter',
    content: {
      format: 'json',
      value: {
        type: 'paragraph',
        content: [{
          type: 'image',
          attrs: {
            src: 'https://e.com/a.png',
            id: 'image-001',
            width: '100%',
            borderRadius: '8px',
            display: 'block',
          },
        }],
      },
    },
  }],
})
```

### HTML 协议

HTML 会解析 `<img src="...">`。尺寸可用标准属性，扩展属性用 `data-*`

```html
<p>
  <img
    src="https://e.com/a.png"
    alt="白板图"
    width="320"
    height="180"
    data-display="block"
    data-align="center"
    data-border-radius="8px"
  />
</p>
```

在区域编辑里可这样传：

```js
MDBridge.aiEdit.applyOperations({
  operations: [{
    target: blockHash,
    op: 'insertAfter',
    content: {
      format: 'html',
      value: '<p><img src="https://e.com/a.png" data-display="block" data-border-radius="8px" /></p>',
    },
  }],
})
```

### Markdown 协议

- **纯净图片**（仅 src / alt / title，其余为默认值）：`![alt](src "title")`
- **富属性图片**：自闭合 `<img ... />`，width / height 输出标准 HTML 属性（GitHub / VS Code 预览可识别尺寸），其余走 `data-*`

```markdown
![风景](https://e.com/a.png "标题")

<img src="https://e.com/a.png" alt="风景" width="300" height="200" data-align="center" data-border-radius="8px" />
```

导入侧无需特殊处理：`setContent(md, { contentType: 'markdown' })` 或 `MDBridge.aiEdit` 的 `format: 'markdown'` 会自动解析。富属性图片经 *@tiptap/markdown* 的内联 HTML 路径还原，多轮往返逐字符幂等（见 `__tests__/markdown-roundtrip.test.ts`）

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
