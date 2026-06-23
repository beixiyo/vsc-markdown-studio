# Markdown Mobile Tiptap 接入说明

给 iOS / Android 开发看的。本文是移动端 WebView 接入总入口，具体插件能力以插件文档为准

## Bridge 能力总览

Native 在 `mdBridgeReady` 之后通过 `window.MDBridge` 调用 WebView 能力。完整类型以 [MDBridge.ts](src/types/MDBridge.ts) 为准

| 能力 | 方法 | 说明 |
|------|------|------|
| 内容读写 | `getMarkdown` / `setMarkdown` / `getHTML` / `setHTML` / `getJSON` / `setContent` | 正文内容读写 |
| 只读控制 | `isEditable` / `setEditable` | `setEditable(false)` 进入只读，`setEditable(true)` 恢复编辑 |
| 光标与选区 | `getTextCursorPosition` / `setTextCursorPosition` / `getSelection` / `setSelection` / `getSelectedText` / `focus` | 读取和设置光标、选区 |
| 滚动定位 | `scrollToRange` / `scrollToRangeSelection` / `scrollToText` / `selectAndScrollToText` / `scrollToMark` | 滚到文档位置、文本或 mark；底层实现见 [scroll.ts](../../tiptap-editor/packages/tiptap-api/src/operate/scroll.ts) |
| 图片 | `setImage` / `updateImage` / `removeImage` / `getImageAttrs` | 图片插入、更新、删除和按 id 读取 |
| 排版与方向 | `setTypography` / `setTextDirection` / `setBottomMargin` | 字号行高、RTL/LTR、键盘底部留白 |
| AI 区域编辑 | `aiEdit.readBlocks` / `aiEdit.applyOperations` / `aiEdit.beginStream` / `aiEdit.pushChunk` / `aiEdit.endStream` / `aiEdit.accept` / `aiEdit.reject` | Hash 锚点区域编辑，协议见 [tiptap-region](../../tiptap-editor/packages/tiptap-region/README.md) |
| 块级增量同步 | `sync.flush` / `sync.pushFull` / `sync.ack` / `sync.requestResync` / `sync.pause` / `sync.resume` | 编辑器到后端的块级 id-diff 同步回执能力 |

滚动示例：

```js
// 滚到 ProseMirror 文档位置
MDBridge.scrollToRange(12, { behavior: 'smooth', block: 'center' })

// 查找文本并滚动，不改变选区
MDBridge.scrollToText('待办事项', { behavior: 'auto', block: 'nearest' })

// 查找文本、选中并滚动
MDBridge.selectAndScrollToText('会议结论')
```

只读示例：

```js
MDBridge.setEditable(false)
MDBridge.isEditable()
MDBridge.setEditable(true)
```

## 图片能力

图片插入、样式控制、id 生命周期和事件回调见 [ImageNode 图片插件文档](../../tiptap-editor/packages/tiptap-nodes/src/image/README.md)

## 内容变更事件

`contentChanged` 只表示 Markdown 正文发生变化。payload 是结构化对象，Native 可以根据 `context` 判断是否需要保存或转发接口

```ts
type ContentChangedPayload = {
  content: string
  format: 'markdown'
  context: {
    source: 'user' | 'native' | 'internal'
    reason:
      | 'typing'
      | 'set-content'
      | 'set-markdown'
      | 'set-html'
      | 'set-image'
      | 'update-image'
      | 'remove-image'
      | 'ai-edit-apply'
      | 'ai-edit-stream'
      | 'ai-edit-accept'
      | 'ai-edit-reject'
      | 'unknown'
    shouldPersist: boolean
    requestId?: string
  }
}
```

常见判断：

| 场景 | `context` | Native 建议 |
|---|---|---|
| 用户手动输入 | `{ source: 'user', reason: 'typing', shouldPersist: true }` | 保存 / 同步 |
| Native 下发整篇内容 | `{ source: 'native', reason: 'set-content' / 'set-markdown' / 'set-html', shouldPersist: false }` | 不要反向保存 |
| 插入 / 更新 / 删除正文图片 | `{ source: 'native', reason: 'set-image' / 'update-image' / 'remove-image', shouldPersist: true }` | 保存 / 同步 |
| AI 预览或流式中间态 | `{ source: 'native', reason: 'ai-edit-apply' / 'ai-edit-stream', shouldPersist: false }` | 等最终采纳 |
| AI 采纳 | `{ source: 'native', reason: 'ai-edit-accept', shouldPersist: true }` | 保存 / 同步 |
| AI 放弃 | `{ source: 'native', reason: 'ai-edit-reject', shouldPersist: false }` | 不保存 |

非正文变化不会触发 `contentChanged`，例如光标选择、容器高度、`setEditable` 等编辑器状态切换

## 文本方向（RTL / LTR）

新增 `setTextDirection` 方法，支持阿拉伯语、希伯来语等从右往左书写的语言

### `setTextDirection(direction)`

| 参数 | 类型 | 说明 |
|---|---|---|
| `direction` | `'ltr' \| 'rtl' \| 'auto'` | `'ltr'` 左到右（默认）、`'rtl'` 右到左、`'auto'` 按内容自动检测 |

```js
// 切换为阿拉伯语 RTL 排版
MDBridge.setTextDirection('rtl')

// 切回默认
MDBridge.setTextDirection('ltr')

// 自动检测：每个段落按首字符语言判定方向，适合中阿混排
MDBridge.setTextDirection('auto')
```

### 效果

- **`'rtl'`**：全局右对齐，列表符号 / 引用竖线出现在右侧，光标从右侧开始
- **`'ltr'`**：默认行为，无变化
- **`'auto'`**：逐段落检测——阿拉伯语段落自动 RTL，英文 / 中文段落保持 LTR

### 建议接入方式

Native 侧根据用户语言设置或文档语言，在 `mdBridgeReady` 之后调一次即可。切换语言时再次调用，实时生效
