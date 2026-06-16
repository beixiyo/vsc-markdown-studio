# ctx-ref：注释 marker 兼容层

> 背景：编辑器底层（ProseMirror）不解析 HTML 注释，不做这层兼容时所有 marker 会在保存时被静默清除

## ⚠️ 核心边界：marker 对用户是可删的（设计如此，不做禁删）

marker 在编辑器里是真实节点，用户编辑（范围删除、剪切）**可以把它删掉**。安全模型是「删不残缺 + 自动重建」，而不是「不可删除」

「禁删保护」经调研后**主动否决**：`filterTransaction` 否决事务与移动端 IME 合成冲突（同机制公开实锤：Tiptap CharacterCount [#5928](https://github.com/ueberdosis/tiptap/issues/5928)，中文输入法丢字/截断，Android WebView 几乎永远处于合成态）；且键盘退格本来就删不掉不可见 atom（光标跳过），唯一删除路径只有框选范围删除，保护收益远小于损坏文字输入的风险：

| 保证 | 说明 |
|------|------|
| 删不残缺 | 节点要么完整存在、要么干净消失，**不可能**出现 `<!--ctx-ref:no` 这种删一半的脏文本 |
| 删了不丢源数据 | 行内 marker 随句子被删只是「引用消失」，Note / Image 原始数据在原生侧不受影响 |
| 并发有保护 | AI 写入期间用户编辑目标区域 → 自动放弃会话并发 `aiEditConflict` 事件；hash 过期 → 显式 `TARGET_NOT_FOUND`，重跑即可 |

已知的优雅降级（不崩，但产品需知晓）：复制粘贴含 marker 的句子 → 同一 refId 出现两个图标（需要禁止可加 paste 过滤，目前未做）

---

## 1. 当前支持的全部注释节点

| Markdown 原文 | 解析为 | 节点类型 | 属性 |
|---------------|--------|----------|------|
| `<!--ctx-ref:mark:{id}-->` | 行内数据锚点（默认渲染图标，见 §3.1） | `ctxRef` | `refType: 'mark'`, `refId` |
| `<!--ctx-ref:note:{id}-->` | 行内数据锚点（默认渲染图标，见 §3.1） | `ctxRef` | `refType: 'note'`, `refId` |
| `<!--ctx-ref:image:{id}-->` | 行内数据锚点（默认渲染图标，见 §3.1） | `ctxRef` | `refType: 'image'`, `refId` |

**格式为严格匹配**，正则如下，任何变体（多空格、换行、大小写）都不识别、会被当普通注释丢弃：

```
ctx-ref:    /^<!--ctx-ref:(mark|note|image):([\w-]+)-->/
```

序列化（保存 / `getMarkdown`）时按上表原样还原为注释文本

⚠️ **词表外的注释仍会被丢弃**：如未来新增 `<!--ctx-ref:todo:1-->` 这类新类型，需要先在本模块扩词表（`types.ts` 的 `CtxRefType` 联合 + `extension.ts` 的正则），否则不解析

## 2. 类型定义（严格字面量，非 string）

```ts
import type { CtxRefAttributes, CtxRefClickPayload, CtxRefType } from 'tiptap-nodes/ctx-ref'

type CtxRefType = 'mark' | 'note' | 'image'          // 字面量联合
type CtxRefAttributes = { refType: CtxRefType, refId: string }
type CtxRefClickPayload = CtxRefAttributes & { sentence: string }
```

配套的区域编辑协议同样全程字面量类型（`tiptap-ai`）：

```ts
type RegionOpType = 'replace' | 'insertBefore' | 'insertAfter' | 'delete'
  | 'searchReplace' | 'append' | 'prepend' | 'replaceAll'
type RegionContentFormat = 'markdown' | 'html' | 'json'
```

传错 op / refType 在编译期即报错

## 3. 注册（web 端，移动端无需关心）

```ts
import { CtxRefNode } from 'tiptap-nodes/ctx-ref'

const extensions = [
  CtxRefNode,          // 已在 markdown-mobile-tiptap App.tsx 注册
]
```

业务侧要接交互时，`CtxRefNode.configure({ onClick })` 可拿到点击载荷（含 marker 前紧邻的加粗斜体句，Note 详情展示用）：

```ts
CtxRefNode.configure({
  onClick: ({ refType, refId, sentence }) => { /* mark / note / image 三类都会触发，按 refType 分流 */ },
})
```

DOM 钩子：锚点渲染为 `<span data-ctx-ref="note" data-ctx-id="1" class="tiptap-ctx-ref tiptap-ctx-ref--note">`（流式态额外带 `data-streaming` + `tiptap-ctx-ref--streaming`），可按 `data-ctx-ref` / 类名挂额外样式；图标内容由 §3.1 的 `icons` 定制

### 3.1 渲染图标（内置默认，可覆盖 / 关闭）

**默认开箱即用**：不配置 `icons` 时，三种 refType 都渲染内置图标（Mark 旗帜、Note、图片，均可点击）。内置图标用 inline 样式 + WAAPI，不依赖任何外部 CSS。

每个类型在 `icons` 里有三种取值：

| 取值 | 行为 |
|------|------|
| 不传 / `undefined` | 用内置默认图标 |
| 工厂函数 | 自定义图标 |
| `false` / `null` | 该类型不渲染图标（零宽不可见） |

```ts
import { builtinCtxRefIcons, CtxRefNode } from 'tiptap-nodes/ctx-ref'

CtxRefNode.configure({
  icons: {
    /** ctx 含 refType / refId / streaming / editor / getPos，按需返回 HTMLElement | null */
    note: ({ refId }) => makeNoteIcon(refId),   // 覆盖 note
    image: false,                               // 关闭 image
    // mark 不传 → 用内置旗帜
  },
  onClick: ({ refType, refId, sentence }) => openSheet(refType, refId, sentence),
})

// 也可直接复用内置工厂：builtinCtxRefIcons.mark / .note / .image
```

**二次加工内置图标**：自定义工厂的 `ctx.defaultIcon()` 返回当前类型 / 状态（含 streaming）的内置图标元素，可在其上包一层 DOM、加 class / 内联样式、绑事件，而不必从头画 SVG：

```ts
CtxRefNode.configure({
  icons: {
    note: (ctx) => {
      const wrap = document.createElement('span')
      wrap.className = 'my-badge'
      const icon = ctx.defaultIcon()   // 内置笔记图标（streaming 时为动效）
      if (icon)
        wrap.appendChild(icon)
      return wrap
    },
  },
})
```

> ⚠️ 渲染图标不等于禁删：按文首核心边界，**任何角标用户都能删**。图标渲染不引入任何禁删/只读保护

工厂返回的元素挂在 `span[data-ctx-ref][data-ctx-id]` 内，点击由 `onClick` 统一分发（三类均触发）。`renderHTML` 只产出纯 data 属性 span（供 getHTML / 复制 / HTML 通道往返），**图标只在编辑器内实时渲染，不写入序列化结果**

### 3.2 流式动效（被流式替换时把图标切成动画）

AI 流式生成/替换某处时，该处角标应显示书写 / 三点循环动画。用 `setCtxRefStreaming` 命令切换节点的 `streaming` 态，工厂会带着 `streaming: true` 被重新调用：

```ts
/** 开始流式：图标切到动效；同 refId 的节点一并切换，可选 refType 收窄 */
editor.commands.setCtxRefStreaming('note_1', true)
editor.commands.setCtxRefStreaming({ refId: 'image_101', refType: 'image' }, true)

/** 结束：切回静态图标 */
editor.commands.setCtxRefStreaming('note_1', false)
```

```ts
CtxRefNode.configure({
  icons: {
    note: ({ streaming }) => streaming
      ? makeWritingAnimation()   // 流式动效（如三点循环）
      : makeNoteIcon(),
  },
})
```

约束：

- `streaming` 是**纯运行时 UI 态**——不进 HTML / Markdown（`rendered: false`），marker 往返完全不受影响
- 命令走 `addToHistory: false`，不污染 undo 栈
- DOM 上额外挂 `data-streaming` 属性 + `tiptap-ctx-ref--streaming` 类名，也可纯用 CSS 做动画
- 无匹配 refId 时命令返回 `false`

## 4. 移动端使用方式（native 只需读本章）

> §1–§3 是 web 端内部实现（ProseMirror / NodeView / 图标配置），**原生不涉及**。原生侧**不需要解析任何 marker**，全部透传——所有能力挂在 WebView 内的 `window.MDBridge` 上，用 `evaluateJavaScript` / `callAsyncJavaScript` 执行下面这些 JS 即可。

> **完整 API 参考**（全部方法签名、类型、操作语义表、状态机）：`tiptap-editor/packages/tiptap-ai/README.md`，类型源文件 `tiptap-editor/packages/tiptap-ai/src/region-edit/types.ts`。

### 4.1 下发 / 读回 summary（marker 自动保活）

```ts
/** 下发：带 marker 的 markdown 原样传入，web 端自动解析保活 */
MDBridge.setMarkdown(summaryMarkdown)

/** 带说话人一起下发（转写 / 总结常用） */
MDBridge.setContentWithSpeakers({ content: summaryMarkdown, speakers })

/** 读回：用户编辑后保存，marker 逐字符原样在返回的 markdown 里 */
const md: string = MDBridge.getMarkdown()
```

用户编辑期间 web 端自动把 marker 保活成隐形节点、保存时原样还原——**原生不要在 markdown 里手动清理 `<!--ctx-ref:...-->`**。

### 4.2 ctx-ref marker 与点击事件（原生拉详情的入口）

summary 正文里有三类引用 marker，web 端渲染成图标；原生只需处理**点击**：三类图标被点击都会抛 **`ctxRefTapped`** 事件，原生按载荷里的 `refType` 自行决定做什么（要不要响应、弹什么，都由原生定）。

| marker | 图标 | 点击事件 |
|--------|------|----------|
| `<!--ctx-ref:mark:{id}-->` | 旗子 | 发 `ctxRefTapped`（`refType: 'mark'`），原生自行决定行为 |
| `<!--ctx-ref:note:{id}-->` | Note 图标 | 发 `ctxRefTapped`（`refType: 'note'`）→ 原生拉 Note 详情 bottom sheet |
| `<!--ctx-ref:image:{id}-->` | 图片图标 | 发 `ctxRefTapped`（`refType: 'image'`）→ 原生展开对应大图 |

> 角标可被用户随正文删除（删除只是「引用消失」，原始 Note / 图片数据在原生侧不受影响）。原生无需为删除做任何事，也**不要**试图禁止删除。

`ctxRefTapped` 事件载荷：

```ts
{
  refType: 'mark' | 'note' | 'image',  // 点击的引用类型，原生据此分流
  refId: string,                       // mark_id / note_id / image_id（稳定 ID，按它查详情；image_id 是数字）
  sentence: string,                    // marker 前紧邻的加粗斜体句 = 总结里与该引用对应的那句话
}
```

原生据此：note → 用 `refId` 查 Note 原文，并展示 `sentence`（总结里这句话）；image → 用 `refId`（数字 `image_id`）找图展开，**不要用图片 URL 匹配**；mark → 按产品需要处理（可只读取 `sentence` 做高亮定位，也可忽略）。

### 4.3 假流式渲染（会后图片 / 打字机效果）

`beginStream` 的 `target` 可传**块 hash**（`op: 'replace' / 'insertBefore' / 'insertAfter'`）或 **`'doc'`**（`op: 'append' / 'prepend'`）。

**会后图片（V2）= 固定追加到文末**：不定位、不复用已有章节，直接 `target: 'doc', op: 'append'` 假流式追加（这也是 `summary-added-images` 哨兵被取消的原因——不再需要定位区块）：

```ts
/** ① 开始：拿流式会话票据（追加到文末） */
const { streamId } = MDBridge.aiEdit.beginStream({ target: 'doc', op: 'append' })

/** ② 把完整内容切片推送（原生侧建议 ≥ 32ms 间隔；web 端 rAF 自动合帧渲染） */
const content = '## Related images\n\n- 这张图补充了白板内容。<!--ctx-ref:image:202-->'
let pos = 0
const timer = setInterval(() => {
  if (pos >= content.length) {
    clearInterval(timer)
    MDBridge.aiEdit.endStream(streamId)   // ③ 结束，进入预览态
    MDBridge.aiEdit.accept()              // ④ 落盘（整次变更 = 一条 undo 记录）
    return
  }
  MDBridge.aiEdit.pushChunk(streamId, content.slice(pos, pos + 8))
  pos += 8
}, 48)
```

任务失败时**不要** `endStream` / `accept`，直接 `MDBridge.aiEdit.reject()` 丢弃本次流式即可。

### 4.4 遍历 + 增删改（原生自己定位 / 自己 diff 时用）

原生若要自己决定改哪里：`readBlocks()` 遍历顶层块（每块带**稳定 hash**）→ 自己 find → 调增删改（非流式）或 §4.3 的 beginStream（流式）：

```ts
const { blocks } = MDBridge.aiEdit.readBlocks()          // 每块: { hash, type, markdown }
const target = blocks.find(b => b.markdown.includes('Related images'))
MDBridge.aiEdit.applyOperations({
  operations: [{ target: target.hash, op: 'insertAfter', content: { format: 'markdown', value } }],
})
```

- op 全集：`replace / insertBefore / insertAfter / delete / append / prepend / searchReplace / replaceAll`；`target` 用块 hash 或 `'doc'`（append / prepend）。
- **粒度是块级**：定位 / 插入到「顶层块」，**定位不到段落内部的 inline marker**（要文本级时用 `searchReplace` 在块内按**唯一字符串**替换，marker 是精确文本可匹配）。
- 同内容的块 hash 自动带 `#2 / #3` 后缀消歧；操作返回 `newHash` 可链式继续改、无需重新 `readBlocks`。

### 4.5 需要监听的 web → 原生事件

事件由 web 侧用「事件名」作为通道名投递，原生按各平台约定订阅（与已有的 `imageInserted` / `speakerTapped` 等事件同一套机制）：

- **iOS**：注册名为**事件名**的 `WKScriptMessageHandler`（如 `ctxRefTapped`），载荷在 `message.body`
  ```swift
  webView.configuration.userContentController.add(self, name: "ctxRefTapped")
  ```
- **Android**：注入 `window.Android` 对象，web 调用 `window.Android.postMessage(JSON.stringify({ name, payload }))`，按 `name` 分发
  ```kotlin
  webView.addJavascriptInterface(bridge, "Android")  // bridge 暴露 postMessage(json)
  ```

非 WebView（浏览器调试）环境下事件静默忽略。下表是 ctx-ref / AI 编辑相关事件：

| 事件名 | 载荷 | 处理 |
|--------|------|------|
| `ctxRefTapped` | `{ refType: 'mark' \| 'note' \| 'image', refId, sentence }` | 角标被点击，按 refType 分流（见 §4.2） |
| `aiEditStateChanged` | `{ state: 'idle' \| 'streaming' \| 'preview' }` | 同步 UI 状态 |
| `aiEditConflict` | `{ streamId?: string }` | 用户编辑了流式 / 预览区域，会话已自动回滚——**中断推送循环即可**，内容无需补救 |

### 4.6 错误处理

`applyOperations` 按条返回，单条失败不影响其余：

| `error` | 含义 | 建议处理 |
|---------|------|----------|
| `TARGET_NOT_FOUND` | hash 已失效（块被用户改过 / 同批前序操作改过） | 重新 `readBlocks` 取新 hash 重试 |
| `SEARCH_NOT_FOUND` / `SEARCH_NOT_UNIQUE` | `searchReplace` 的搜索串无匹配 / 多匹配 | 改用 `replace` 整块替换 |
| `STREAM_NOT_FOUND` | streamId 失效（会话已结束 / 冲突终止） | 放弃本次流式 |

完整错误码联合类型见 `tiptap-editor/packages/tiptap-ai/README.md` §3

### 4.7 内容通道选择

| 通道 | 适用内容 | 说明 |
|------|----------|------|
| `format: 'markdown'`（默认） | 文字、标题、列表、speaker、ctx-ref marker、图片 `![alt](src)` | 图片仅保留 src / alt / title，布局属性丢弃 |
| `format: 'html'` | 渐变高亮 `<mark data-color>`、`<img>`（自动生成 id） | 任何实现了 `parseHTML` 的自定义节点都可写入 |
| `format: 'json'` | **无损首选**：ProseMirror JSON 直达节点 | 单节点、节点数组、整个 doc、JSON 字符串均接受；width 等富属性完整保留；非法结构被 schema 校验拒绝，不会污染文档 |

## 5. 已知边界

- marker 必须紧跟正文同一行、不能在代码块内（marker 的输出约定见 `tiptap-editor/docs/ctx-ref-marker-assessment.md` §5）
- ctx-ref 锚点默认渲染图标，仅当对应 refType 配 `false` / `null` 关闭时才零宽不可见
- 要求 `@tiptap/markdown >= 3.23.5`（行内 atom 节点的 mark 序列化修复，[tiptap#7830](https://github.com/ueberdosis/tiptap/pull/7830)；当前仓库为 3.26.0）

## 6. 测试

- 本包：`src/ctx-ref/__tests__/markdown-roundtrip.test.ts`（存活 / 幂等 / 内置图标 / 自定义覆盖 / `false` 关闭 / `defaultIcon` 二次加工 / 流式 / 点击）
- 集成：`packages/markdown-mobile-tiptap/src/__tests__/ctx-ref.test.ts`（全扩展栈共存、region-edit 假流式）
- 能力边界：`packages/markdown-mobile-tiptap/src/__tests__/region-edit-capability.test.ts`（自定义节点写入、老文档自举、精确落点）
- 肉眼验证：mobile dev 页（`pnpm dev`）右下角 DevPanel「ctx-ref marker」区
