# Markdown Mobile Tiptap 接入说明

给 iOS / Android 开发看的。本文是移动端 WebView 接入总入口，具体插件能力以插件文档为准

## 图片能力

图片插入、样式控制、id 生命周期、事件回调、老接口迁移方式见 [ImageNode 图片插件文档](../../tiptap-editor/packages/tiptap-nodes/src/image/README.md)

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
