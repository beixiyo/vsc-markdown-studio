# Markdown Mobile Tiptap 接入说明

给 iOS / Android 开发看的。本文是移动端 WebView 接入总入口，具体插件能力以插件文档为准

## 图片能力

图片插入、样式控制、id 生命周期、事件回调、老接口迁移方式见 [ImageNode 图片插件文档](../../tiptap-editor/packages/tiptap-nodes/src/image/README.md)

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

---

## 迁移检查清单

- [ ] `setImagesWithURL` / `setHeaderImagesWithURL` / `setFooterImagesWithURL` 三个调用点全部改为 `setImage({ at, images })`
- [ ] `images` 里每项都传入 `{ src, id }`（id 用你们本地已有的资源标识）
- [ ] 监听 `imageInserted` 事件，保存回传的 `ids`（尤其是没传 id 的场景）
- [ ] 视觉要和以前一致 → 显式加 `preset: 'block'`（或不传，默认就是）
- [ ] 新的表情 / 行内图场景 → 用 `preset: 'inline'`
- [ ] 图片事件（点击、加载、删除、属性变化）→ 按 id 匹配你们本地状态
- [ ] 需要编辑图片 → 调 `updateImage` / `removeImage`，传 id
- [ ] 需要 RTL 支持 → 在 `mdBridgeReady` 后调 `setTextDirection('rtl')` 或 `'auto'`
- [ ] 监听 `contentChanged` 时按 `context.shouldPersist` 判断是否保存，避免把 Native 自己下发的内容反向写回
