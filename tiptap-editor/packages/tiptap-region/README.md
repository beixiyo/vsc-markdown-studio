# tiptap-region

Tiptap 区域编辑插件。它提供一套 **Hash 锚点协议**，让外部系统（AI、移动端原生、协同服务或自动化脚本）可以按块读取、替换、插入、删除和流式预览编辑器内容

## 一分钟模型

```
readBlocks()                    读文档，每个顶层块一个 hash 锚点
applyOperations({ operations }) 按 hash 批量编辑，可选择 preview 预览态
beginStream / pushChunk / endStream + accept / reject   流式渲染三件套
```

hash 语义：

- **运行时计算，不写入文档**：Markdown、JSON、HTML 里都不会持久化 hash
- **快照票据**：块被修改后旧 hash 失效，返回 `TARGET_NOT_FOUND`
- **重复块消歧**：相同内容按文档顺序追加 `#2`、`#3`
- **不透明令牌**：调用方只原样透传，不自行计算或拼接

## 注册

```ts
import { Editor } from '@tiptap/core'
import { createRegionEdit, RegionEdit } from 'tiptap-region'

const editor = new Editor({
  extensions: [
    RegionEdit,
  ],
})

const regionEdit = createRegionEdit(editor, {
  onStateChange: state => {
    // idle | streaming | preview
  },
  onConflict: info => {
    // 用户编辑了目标区域，会话已自动回滚
  },
})
```

编辑器需要注册 `RegionEdit` 扩展，并接入 `@tiptap/markdown`。移动端入口由 `packages/markdown-mobile/src/hooks/useSetupMDBridge.ts` 挂到 `window.MDBridge.aiEdit`

样式由 `tiptap-region` 包维护：根入口已导入 `index.css`，包也导出了 `tiptap-region/index.css` 供宿主显式引入。宿主侧不应复制 loading 外框 CSS

## 读取块

`readBlocks(options?)` 读取文档顶层块列表。任何文档，包括没有历史标记的旧文档，都可以立即读取并获得锚点

```ts
type ReadBlocksResult = {
  protocolVersion: number
  docVersion: number
  blocks: RegionBlock[]
}

type RegionBlock = {
  hash: string
  type: string
  markdown: string
  lossy?: boolean
  html?: string
}

type ReadBlocksOptions = {
  detectLossy?: boolean
}
```

- `markdown` 始终返回，是算法侧主要阅读格式
- `lossy: true` 表示该块含 Markdown 无法表达的内容，会同时返回 `html`
- `detectLossy` 默认开启，关闭后可省去逐块 roundtrip 开销

## 应用操作

`applyOperations(payload)` 批量编辑，同步返回，逐条独立结算。单条失败不影响其他操作

```ts
type ApplyPayload = {
  operations: RegionOperation[]
  options?: {
    preview?: boolean
  }
}

type RegionOperation = {
  target: string
  op: RegionOpType
  content?: RegionContent
  search?: string
  replace?: string
}

type RegionOpType =
  | 'replace'
  | 'insertBefore'
  | 'insertAfter'
  | 'delete'
  | 'searchReplace'
  | 'append'
  | 'prepend'
  | 'replaceAll'

type ApplyResult = {
  results: RegionOperationResult[]
}

type RegionOperationResult = {
  target: string
  success: boolean
  error?: RegionErrorCode
  newHash?: string | string[]
}
```

操作语义：

| op | target | 必填 | 语义 |
|----|--------|------|------|
| `replace` | 块 hash | `content` | 整块替换，`content` 可含多个块 |
| `insertBefore` / `insertAfter` | 块 hash | `content` | 插到目标块前 / 后 |
| `delete` | 块 hash | - | 删除整块 |
| `searchReplace` | 块 hash | `search`、`replace` | 块内唯一字符串替换 |
| `append` / `prepend` | `doc` | `content` | 文档末尾 / 开头插入 |
| `replaceAll` | `doc` | `content` | 整篇替换 |

批内顺序注意：

- 操作按数组顺序执行
- `replace`、`delete`、`searchReplace` 会让目标块自身 hash 失效，同批内不要对同一块改两次
- `insertBefore`、`insertAfter` 不影响目标块，可与修改共存，但应排在修改之前

## 内容通道

```ts
type RegionContent = {
  format: 'markdown' | 'html' | 'json'
  value: string | Record<string, any> | Record<string, any>[]
}
```

| 通道 | 适用 | 说明 |
|------|------|------|
| `markdown` | 文字、标题、列表、图片、高亮 | 默认通道，图片富属性走 `<img />`，带色高亮走 `<mark data-color>` |
| `html` | 实现 `parseHTML` 的自定义节点 | 用于 Markdown 无法无损表达的内容 |
| `json` | ProseMirror JSON | 无损首选，单节点、节点数组、整篇 doc、JSON 字符串均接受 |

## 流式编辑

打字机效果用于 **单个操作的 content 渐进渲染**，常见场景是 LLM 流式改写或新增一个区域。调用方先声明目标和操作类型，再持续推送 delta，结束后进入 preview 态等待 `accept()` / `reject()`

```ts
const { streamId } = regionEdit.beginStream({
  target: 'doc',
  op: 'append',
  format: 'markdown',
})

regionEdit.pushChunk(streamId, '改写后')
regionEdit.pushChunk(streamId, ' 的整段')
regionEdit.pushChunk(streamId, '内容...')
regionEdit.endStream(streamId)

regionEdit.accept()
// 或 regionEdit.reject()
```

移动端桥接调用同名方法：

```ts
const { streamId } = MDBridge.aiEdit.beginStream({
  target: 'doc',
  op: 'append',
})

MDBridge.aiEdit.pushChunk(streamId, delta)
MDBridge.aiEdit.endStream(streamId)
MDBridge.aiEdit.accept()
```

接口类型：

```ts
type RegionEditController = {
  beginStream: (payload: BeginStreamPayload) => { streamId: string, loadingFrameId?: string }
  pushChunk: (streamId: string, delta: string) => void
  endStream: (streamId: string) => void
  showLoadingFrame: (payload: RegionLoadingFramePayload) => void
  hideLoadingFrame: (id: string, options?: RegionLoadingFrameHideOptions) => boolean
  accept: (options?: RegionAcceptOptions) => void
  reject: () => void
}

type BeginStreamPayload = {
  target: string
  op: 'replace' | 'insertBefore' | 'insertAfter' | 'append' | 'prepend'
  format?: RegionContentFormat
  loadingFrame?: string | {
    id: string
    selectOnAccept?: boolean
  }
}
```

同时只允许一个流式会话。新会话开启前，未决的旧会话会自动回滚

### loading 外框

流式加载态可以绑定一个临时 UI 外框。外框只存在于 Decoration，不进入 Markdown / HTML / JSON 内容

```ts
const { streamId } = MDBridge.aiEdit.beginStream({
  target: 'doc',
  op: 'append',
  loadingFrame: {
    id: 'follow-up-loading',
    selectOnAccept: true,
  },
})

MDBridge.aiEdit.pushChunk(streamId, '生成中的文本')
MDBridge.aiEdit.endStream(streamId)
MDBridge.aiEdit.accept()
```

也可以手动控制：

```ts
MDBridge.aiEdit.showLoadingFrame({
  id: 'follow-up-loading',
  target: 'doc',
  op: 'append',
})

MDBridge.aiEdit.hideLoadingFrame('follow-up-loading', { select: true })
```

- `id` 是外部控制句柄，用来隐藏对应 loading 外框
- 空 range 会渲染一个只有三点 loading 的占位框；流式内容出现后，外框自动 remap 到生成内容
- `selectOnAccept: true` 会在 `accept()` 后选中本次生成文本，并滚动到可见区域

性能约定：

- 原生 `evaluateJavascript` 单次调用有开销，原生侧建议至少 32ms 合批一次
- web 端内部会再做 rAF 合批，避免每个 chunk 都触发过密重排
- 流式期间用户手动编辑目标区域会触发 `STREAM_CONFLICT`，会话终止并通过 `aiEditConflict` 通知原生

### 模拟流式打字机

项目里有两个已经接好的模拟入口：

| 场景 | 文件 | 模拟方式 |
|------|------|----------|
| 桌面 playground 测试面板 | `tiptap-editor/src/components/my-ui/region-edit-panel/use-region-edit-panel.ts` | `FAKE_STREAM_CHUNKS` + `sleep(150)`，模拟算法侧 LLM 分片输出 |
| 移动端 DevPanel | `packages/markdown-mobile/src/__dev__/DevPanel.tsx` | `setInterval(..., 60)` 每次截取 8 个字符，经 `MDBridge.aiEdit.pushChunk` 推送 |

桌面测试面板调用链：

```
readBlocks → beginStream → pushChunk... → endStream → accept / reject
```

移动端 DevPanel 的 “AI edit / stream append” 按钮会直接走 `window.MDBridge.aiEdit`，用于验证原生桥接路径下的追加、预览和采纳

状态机：

```
idle ──beginStream──▶ streaming ──endStream──▶ preview ──accept/reject──▶ idle
idle ──applyOperations({ preview: true })──────▶ preview
```

移动端对应事件定义在 `packages/notify`：

- `aiEditStateChanged`：`{ state: 'idle' | 'streaming' | 'preview' }`
- `aiEditConflict`：流式 / 预览期间用户编辑目标区域，会话已自动回滚

## 错误码

```ts
type RegionErrorCode =
  | 'TARGET_NOT_FOUND'
  | 'SEARCH_NOT_FOUND'
  | 'SEARCH_NOT_UNIQUE'
  | 'INVALID_CONTENT'
  | 'INVALID_OPERATION'
  | 'STREAM_CONFLICT'
  | 'STREAM_NOT_FOUND'
```

| 错误码 | 含义 | 调用方策略 |
|--------|------|------------|
| `TARGET_NOT_FOUND` | hash 在当前文档中不存在 | 重新 `readBlocks` 取新锚点 |
| `SEARCH_NOT_FOUND` | `searchReplace` 无匹配 | 检查 search 串或改用 `replace` |
| `SEARCH_NOT_UNIQUE` | search 串命中多处 | 扩大 search 上下文 |
| `INVALID_CONTENT` | content 解析失败 | 修正内容格式 |
| `INVALID_OPERATION` | op 与 target 组合非法 | 修正操作类型 |
| `STREAM_CONFLICT` | 流式期间用户编辑了目标区域 | 终止并重新 read + retry |
| `STREAM_NOT_FOUND` | streamId 不存在或已结束 | 检查调用顺序 |

## Hash 设计

region-edit 对 `doc` 的每个直接子节点生成 hash：

```
doc
├── heading        → hash
├── paragraph      → hash
├── bulletList     → hash
├── codeBlock      → hash
└── table          → hash
```

只给顶层块编址，不给 `listItem`、`tableCell` 等嵌套节点独立 hash。块内细粒度修改使用 `searchReplace`

hash 输入使用 ProseMirror JSON，而不是 Markdown 或纯文本：

```
hash = fnv1a64(nodeType + '\x00' + JSON.stringify(node.toJSON())).toString(16)
```

这样可以覆盖 attrs、marks 和仅样式变化，避免 Markdown 有损序列化导致的误判。hash 是运行时快照锚点，不持久化，不适合当长期书签

## 测试与示例

- 协议行为：`tiptap-editor/packages/tiptap-region/src/__tests__/ai-edit.test.ts`
- 能力边界：`tiptap-editor/packages/tiptap-region/src/__tests__/region-edit-capability.test.ts`
- 桌面模拟流式：`tiptap-editor/src/components/my-ui/region-edit-panel/use-region-edit-panel.ts`
- 移动端肉眼演示：`packages/markdown-mobile/src/__dev__/DevPanel.tsx` 的 “AI edit” 区

## 关联模块

- `packages/markdown-mobile/src/hooks/useSetupMDBridge.ts`：把本包控制器暴露到 `window.MDBridge.aiEdit`
- `packages/markdown-mobile/src/types/MDBridge.ts`：移动端桥接类型
- `tiptap-editor/packages/tiptap-utils/src/utils/block-serialize.ts`：顶层块序列化 / lossy 检测
- `tiptap-editor/packages/tiptap-utils/src/utils/hash.ts`：块 hash 基元
