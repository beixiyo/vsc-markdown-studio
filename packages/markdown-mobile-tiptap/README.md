# 图片接入迁移说明（移动端）

给 iOS / Android 开发看的。Web 侧会升级图片节点，Native 调用方式会变化 —— 本文只讲**怎么调**、**前后差异**，不涉及 Web 实现细节。

## TL;DR

- **接口从"只传 URL"变成"传对象"**，支持插入位置、视觉预设、单张图的完整属性、稳定 id。
- **三个老方法合并成一个 `setImage`**，用 `at: 'top' | 'bottom' | 'cursor'` 表示插入位置。
- **新增 `id` 语义**：每张图都有稳定身份标识，Native 传入，Web 记住，事件回传同一个 id。基于 id 可以 `updateImage` / `removeImage` / `getImageAttrs`。
- **新增视觉预设**：`'block'`（老观感，每张独占一行）和 `'inline'`（新，图片和文字一样大，适合表情/小图标）。
- **事件 payload 最小化**：只回 `id`，不回 `src` / `attrs` —— 避免 base64 图片在每次事件里被整串搬运过桥接。Native 想要详情走 `getImageAttrs(id)` 主动拉。

---

## 调用方式对比

### 以前（三个方法，只收 URL 数组）

```js
MDBridge.setImagesWithURL(['a.png', 'b.png'])
MDBridge.setHeaderImagesWithURL(['a.png'])
MDBridge.setFooterImagesWithURL(['a.png'])
```

### 以后（一个方法，传对象）

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

### 迁移对照表

| 老调用 | 新调用 |
|---|---|
| `setImagesWithURL(urls)` | `setImage({ at: 'cursor', images: urls.map(src => ({ src, id: nativeId(src) })) })` |
| `setHeaderImagesWithURL(urls)` | `setImage({ at: 'top', images: ... })` |
| `setFooterImagesWithURL(urls)` | `setImage({ at: 'bottom', images: ... })` |

顶部 / 底部插入的**替换首尾图片块**行为不变。

---

## 关于 `id`

### 为什么需要 id

事件回传时 Native 需要知道"**是哪张图**"。`src` 不够用（同一张图可以插两次，src 相同）、`pos`（文档内位置）每次编辑都会漂移。只有 id 是**稳定**的。

### 谁生成 id

- **强烈建议 Native 传入** —— 你们通常已经有本地资源 id（照片库 asset id、上传响应里的后端 id）
- 如果没传，Web 侧兜底用 UUID 生成 —— 但 Native 就需要通过 `imageInserted` 事件回传的 `ids` 记录它们，否则无法定位

### id 的生命周期

- 插入时 Native 传入，永远跟着这张图
- 复制粘贴、撤销重做都会**重置**成新 id（Web 自动处理）—— Native 要通过 `imageInserted` 事件知道新生成的 id
- 导出 markdown / HTML 时会**丢失**（这是刻意设计，避免 id 污染外部数据）
- 用 `getJSON()` 持久化文档可以保留 id

---

## 视觉预设

加一个 `preset` 字段，决定图片怎么显示。不传默认 `'block'`。

### `preset: 'block'`（老样子）

每张图独占一行。

```js
MDBridge.setImage({
  at: 'cursor',
  preset: 'block',
  images: [{ src: 'photo.jpg', id: 'photo-1' }],
})
```

### `preset: 'inline'`（新增：文字大小图片）

图片和当前行文字同高（`1em`），不换行。适合 emoji、表情贴图、行内小图标。

```js
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

---

## 单张图覆盖预设

`images` 数组里每项除了 `src` 和 `id` 还可以塞字段，覆盖 preset：

| 字段 | 含义 | 例子 |
|---|---|---|
| `src` | 图片地址（必填，支持 base64 / http / blob） | `'data:image/png;base64,...'` |
| `id` | 稳定身份标识 | `'asset-abc123'` |
| `alt` | 无障碍文本 | `'封面图'` |
| `width` | 宽度 | `320` / `'100%'` |
| `height` | 高度 | `200` / `'1em'` |
| `aspectRatio` | 宽高比（防加载抖动） | `'16/9'` |
| `borderRadius` | 圆角 | `'12px'` |
| `align` | 对齐（仅 block 模式） | `'left'` / `'center'` / `'right'` |

完整字段见 Web 侧 `ImageAttrs` 类型定义。

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

---

## 新的桥接方法（基于 id 操作）

### `updateImage({ id, attrs })`

按 id 局部合并属性。未传的字段保留原值。

```js
await MDBridge.updateImage({ id: 'hero-001', attrs: { width: 480 } })
// 返回 true = 命中并修改 | false = 找不到该 id
```

### `removeImage({ id })`

按 id 删除。

```js
await MDBridge.removeImage({ id: 'hero-001' })
// 返回 true = 删除成功 | false = 找不到
```

### `getImageAttrs(id)`

按需同步拉取图片完整属性（事件不再携带 attrs，需要时主动调这个）。

```js
const attrs = MDBridge.getImageAttrs('hero-001')
// { id, src, width, align, ... } 或 null
```

---

## 事件回调

Native 通过现有 `notifyNative` 通道接收。**payload 已经彻底瘦身，不再带 `src` / `attrs`**。

### 插入结果

| 事件名 | 触发时机 | payload |
|---|---|---|
| `imageInserted` | `setImage` 成功 | `{ at, preset, ids }` |
| `imageInsertError` | `setImage` 失败 | `{ at, preset, error }` |

`ids` 是**按插入顺序**的 id 数组。Native 如果没传 id，这里返回的是 Web 自动生成的 —— **务必保存**，否则后续无法定位。

### 图片交互

| 事件名 | 触发时机 | payload |
|---|---|---|
| `imageTapped` | 用户点了图 | `{ id, pos }` |
| `imageLoaded` | 加载成功 | `{ id }` |
| `imageLoadError` | 加载失败 | `{ id }` |
| `imageRemoved` | 图被删除（用户直接删 or `removeImage` 调用） | `{ id }` |
| `imageAttrsChanged` | 属性变化 | `{ id, changed }` |

`changed` 是**字段级 diff**，只包含实际变化的字段：

```js
// 例：宽度从 null 改成 320
{ id: 'hero-001', changed: { width: { prev: null, next: 320 } } }
```

### 为什么事件不带 src / attrs

- `src` 可能是**几 MB 的 base64**（用户选了张本地照片），每次事件都搬一遍会炸 bridge
- `attrs` 里嵌套着 `src`，一并排除
- Native 知道 `id → 本地资源` 的映射（是 Native 自己插入的），根本不需要 Web 回传

需要 web 侧的完整属性？调 `getImageAttrs(id)` 主动拉。

---

## 迁移检查清单

- [ ] `setImagesWithURL` / `setHeaderImagesWithURL` / `setFooterImagesWithURL` 三个调用点全部改为 `setImage({ at, images })`
- [ ] `images` 里每项都传入 `{ src, id }`（id 用你们本地已有的资源标识）
- [ ] 监听 `imageInserted` 事件，保存回传的 `ids`（尤其是没传 id 的场景）
- [ ] 视觉要和以前一致 → 显式加 `preset: 'block'`（或不传，默认就是）
- [ ] 新的表情 / 行内图场景 → 用 `preset: 'inline'`
- [ ] 图片事件（点击、加载、删除、属性变化）→ 按 id 匹配你们本地状态
- [ ] 需要编辑图片 → 调 `updateImage` / `removeImage`，传 id
