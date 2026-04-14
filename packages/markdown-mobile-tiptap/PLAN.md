# markdown-mobile-tiptap 迁移计划

## 背景

老版 `packages/markdown-mobile` 基于 BlockNote 实现，通过全局 `window.MDBridge` 与 iOS `WKWebView` / Android `WebView` 交互。

现决定迁移到原生 Tiptap（ProseMirror）栈，复用仓库内已有的 `tiptap-editor-core`、`tiptap-nodes` 能力。本文档整理**所有要点**、**Native 事件**、**可实现 / 搁置** 的 API 明细。

## 与 Native WebView 的交互总览

### 1. Native → Web

Native 侧将 `window.MDBridge` 视为编辑器的**远程控制器**。WebView 加载完成后，会等待 `mdBridgeReady` 事件，再通过 `MDBridge.xxx(...)` 调用 JS 函数。所有方法挂在 `window.MDBridge` 上（见 `src/types/MDBridge.ts`）。

### 2. Web → Native

通过 `notify` 包的 `notifyNative(event, payload)`：

- iOS: `window.webkit.messageHandlers[event].postMessage(payload)`
- Android: `window.Android.postMessage(JSON.stringify({ name, payload }))`
- 浏览器：静默忽略

### 3. 已定义的 NativeEvent（`packages/notify/src/types.ts`）

| 事件 | 触发时机 | payload |
|------|---------|---------|
| `mdBridgeReady` | `MDBridge` 注入完成 | 无 |
| `contentChanged` | 内容变化（防抖） | `markdown: string` |
| `blockTypeChanged` | 选区所在块类型变化 | `typeString: string` |
| `heightChanged` | 编辑器容器高度变化 | `height: number` |
| `labelClicked` | 自定义标签点击 | `{ blockId, label }` |
| `speakerTapped` | Speaker 节点点击 | `{ label, originalLabel, id, name, speakerName }` |
| `imagesSet` | 光标位置插图成功 | `{ imageCount, totalBlocks, removedEmptyBlock }` |
| `setImagesError` | 光标位置插图失败 | `{ error, imageCount }` |
| `imagesWithURLSet` | 底部插图成功 | `{ imageCount, totalBlocks, imageUrls, removedEmptyBlock }` |
| `headerImagesWithURLSet` | 顶部插图成功 | `{ imageCount, totalBlocks, imageUrls, removedEmptyBlock }` |
| `setImagesWithURLError` | 底部插图失败 | `{ error, imageCount }` |
| `setHeaderImagesWithURLError` | 顶部插图失败 | `{ error, imageCount }` |

> `notify` 包已是通用实现，本次迁移**直接复用**，无需修改。

## API 迁移明细

### ✅ 可实现（直接映射）

| MDBridge API | BlockNote 实现 | Tiptap 对应 |
|--------------|---------------|-------------|
| `getHTML()` | `editor.blocksToHTMLLossy()` | `editor.getHTML()` |
| `setHTML(html)` | `tryParseHTMLToBlocks + replaceBlocks` | `editor.commands.setContent(html, { emitUpdate: true })` |
| `getMarkdown()` | `getMarkdownWithEmptyLines(editor)` | `editor.storage.markdown.getMarkdown()`（`@tiptap/markdown`） |
| `setMarkdown(md)` | `tryParseMarkdownToBlocks + replaceBlocks` | `editor.commands.setContent(md)` + markdown 扩展 |
| `getSelectedText()` | `editor.getSelectedText()` | 从 `state.selection` 切片中取 text |
| `insertText(text)` | `editor.insertInlineContent` | `editor.commands.insertContent(text)` |
| `createLink(url, text?)` | `editor.createLink` | `editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()` |
| `getSelectedLinkUrl()` | `editor.getSelectedLinkUrl()` | 读取选区内 `link` mark 的 `href` |
| `focus()` / `isEditable` / `setEditable` / `isEmpty` | — | Tiptap 原生 API |
| `undo()` / `redo()` | — | `editor.commands.undo/redo` |
| `command.setHeading(1\|2\|3)` | `updateBlock → heading` | `editor.chain().focus().toggleHeading({ level }).run()` |
| `command.setParagraph` | `updateBlock → paragraph` | `setParagraph()` |
| `command.setOrderedList` / `setUnorderedList` / `setCheckList` | `updateBlock → numbered/bullet/check` | `toggleOrderedList/BulletList/TaskList` |
| `command.setBold/unsetBold` 等 | `toggleStyles({ bold })` | `toggleBold` / `unsetMark('bold')` |
| `addStyles({ italic })` 等 | 直接映射 | `toggleMark`/`setMark` |
| `getActiveStyles()` | — | 遍历 marks，按 `editor.isActive(markName)` 聚合 |
| `notifyBlockTypeChanged` | `getTextCursorPosition().block` | `editor.state.selection.$from.parent`（level 从 attrs 读） |
| Speaker 节点 | `createSpeaker` inline content | **复用** `tiptap-nodes/speaker` |
| Speaker 点击事件 | `onClick` 回调 | 已支持 `onClick` 选项 |
| 图片块顶部 / 底部 / 光标位置插入 | `replaceBlocks` + ID 识别 | 通过 doc 遍历定位首尾连续 `image` 节点，删旧插新 |
| 内容变化监听 | `editor.onChange` | `editor.on('update', ...)` |
| 选区变化监听 | `editor.onSelectionChange` | `editor.on('selectionUpdate', ...)` |
| 高度变化监听 | `ResizeObserver` | 完全一致 |

### ⚠️ 可实现（语义/行为存在差异，需重新定义）

| API | 差异说明 |
|-----|----------|
| `getDocument()` | BlockNote 返回结构化 `Block[]`，Tiptap 仅有 `editor.getJSON()`（ProseMirror JSON）。已决定返回 `getJSON()`，接口类型相应变化 |
| `setContent(blocks)` | BlockNote 以 `PartialBlock[]` 为输入，Tiptap 接受 HTML / Markdown / JSON。迁移后签名改为 `setContent(input: string \| object)` |
| `insertBlocks / updateBlock / removeBlocks / replaceBlocks` | BlockNote 以 **稳定 block id** 作参数，Tiptap 无默认 block id。改为基于**ProseMirror 位置**的插入/删除 API，或用 `UniqueID` 扩展补齐 id（后续决定） |
| `getTextCursorPosition()` / `setTextCursorPosition(blockId, ...)` | Tiptap 用 ProseMirror 位置（数字），无 blockId。改为 `getCursor() => { pos, node, typeName }` 与 `setCursor(pos)` |
| `getSelection() / setSelection(startId, endId)` | 同上，改为基于位置 |
| `canNestBlock / nestBlock / canUnnestBlock / unnestBlock` | 仅在 **列表项** 语义下成立（`sinkListItem / liftListItem`）。其它块不支持 |
| 渐变样式 (`setGradient / unsetGradient`) | **直接复用** `@tiptap/extension-highlight`（`multicolor: true` 已在 `tiptap-editor-core` 默认开启）。把渐变 key 当作 `color` 值传入：`editor.chain().setHighlight({ color: 'mysticPurpleBlue' }).run()` / `unsetHighlight()`，再用 `mark[data-color="mysticPurpleBlue"]` 的 CSS 画出渐变背景或文字 |
| `moveBlocksUp / moveBlocksDown` | Tiptap 无内置命令。需自定义命令通过交换 doc 节点实现，成本较高 |

### ⛔ 搁置（API 差异过大，需后续决定）

| API | 搁置原因 |
|-----|----------|
| BlockNote 风格的 block tree 增删改（稳定 blockId） | Tiptap 需引入额外 `UniqueID` 扩展 + 大量包装代码；等使用方（Native 侧）明确是否需要 |
| `setContentWithSpeakers(data)` | 需确认 Native 是否仍需要**合并调用**；现阶段 `setMarkdown + setSpeakers` 可组合替代 |
| `setSpeakers(speakers[])` 的"对已有文档重新解析"语义 | Tiptap 已有 speaker 节点解析 markdown 的能力，但"把已有文本中的 `[speaker:X]` 原地替换"在 Tiptap 下更自然的做法是"整篇重新 set"，与旧实现等价，但仍需和 Native 侧对齐 |
| BlockNote 自定义 checklist（`custom-blocknote/checklist`） | 老版 App 未直接启用，暂不迁移 |
| `blocksToMarkdownLossy` 对"多个连续空段落保留为多空行"的行为 | Tiptap `@tiptap/markdown` 默认会合并空行，若需保留多空行需自定义序列化器 |
| `MDBridge.getDocument()` 的结构化返回 | Native 侧是否依赖 Block 结构？未确认，改用 JSON + 额外辅助函数 |

## 实现任务拆解

### Phase 1 — 骨架
1. `package.json`、`tsconfig.*`、`vite.config.ts`、`vitest.config.ts`、`index.html`
2. 复用 alias：`tiptap-editor-core`、`tiptap-nodes`、`i18n`、`hooks`、`notify`、`styles`

### Phase 2 — 核心
1. `src/operate/create.ts` — `createTiptapOperate(editor)`，实现**可实现**集合
2. `src/operate/image.ts` — 顶部 / 底部 / 光标插入图片
3. `src/types/MDBridge.ts` — 新的桥接接口（不兼容老版本的差异 API）

### Phase 3 — 应用层
1. `src/App.tsx` — 基于 `useDefaultEditor` + Speaker 节点（`onClick` 通知 Native）
2. `src/hooks/useSetupMDBridge.ts` — 注入 `window.MDBridge`，派发 `mdBridgeReady`
3. `src/hooks/useNotify.ts` — 内容 / 选区 / 高度监听

### Phase 4 — 测试
1. `vitest` + `jsdom`
2. 覆盖：`createTiptapOperate` 的 markdown / html / 选区 / mark 命令
3. 覆盖：image 插入（header / footer / cursor）对连续空段落的清理
4. 覆盖：`blockTypeChanged` 对不同块类型的映射

### Phase 5 — 后续（不在本次范围）
- 渐变 Mark 实现（如需要）
- `UniqueID` + block 级增删改（如需要）
- 多空行保留的自定义 markdown 序列化
