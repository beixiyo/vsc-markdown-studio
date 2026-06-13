# tiptap-ai

Tiptap 编辑器的 AI 集成层，两大模块：

| 模块 | 用途 | 文档位置 |
|------|------|----------|
| **区域编辑（region-edit）** | hash 锚点协议：按块精确读取 / 替换 / 插入 / 流式渲染，移动端经 `window.MDBridge.aiEdit` 调用 | 本文 §1–§4 |
| **选区 AI** | 选中文本 → AI 改写 → 预览 / 接受 / 拒绝 | 本文 §5 |

相关文档：

| 文档 | 内容 |
|------|------|
| `tiptap-editor/docs/ai-region-edit-protocol.md` | 协议设计：为什么用 hash、粒度、冲突语义 |
| `tiptap-editor/packages/tiptap-nodes/src/ctx-ref/README.md` | ctx-ref 注释节点 + 移动端调用示例 |
| `tiptap-editor/packages/tiptap-ai/src/region-edit/types.ts` | 区域编辑全部类型源文件（含 JSDoc） |

---

## 1. 区域编辑：一分钟模型

```
readBlocks()                    读文档 → 每个顶层块一个 hash 锚点
applyOperations({ operations }) 按 hash 批量编辑，一步到位（可选 preview 预览态）
beginStream / pushChunk / endStream + accept / reject   流式渲染三件套
```

hash 语义（理解协议的关键）：

- **运行时计算，不写入文档**——文档数据（markdown / JSON / HTML）里永远没有 hash
- **快照票据**：块被修改后它的旧 hash 立即失效（返回 `TARGET_NOT_FOUND`），用返回的 `newHash` 或重新 `readBlocks` 取新票据。这是防改错位置的保护，**不是「只能改一次」**——同一区域可无限轮替换
- 重复内容的块按文档顺序追加 `#2` `#3` 后缀消歧
- 对调用方是**不透明令牌**：原样复制回传即可，禁止自己计算或拼接

### 注册（web 端；移动端已接好，无需关心）

```ts
import { createRegionEdit, RegionEdit } from 'tiptap-ai'

const editor = new Editor({
  extensions: [/* ... */, RegionEdit], // 装饰插件（流式 / 预览高亮）
})

const regionEdit = createRegionEdit(editor, {
  onStateChange: state => { /* 'idle' | 'streaming' | 'preview' */ },
  onConflict: info => { /* 用户编辑了目标区域，会话已自动回滚 */ },
})
```

移动端：所有方法挂在 `window.MDBridge.aiEdit`，与下方 API 一一对应

## 2. 区域编辑 API 参考

### readBlocks(options?) → ReadBlocksResult

读取文档顶层块列表。任何文档（包括无任何标记的存量旧文档）随时可读，每个块即刻获得锚点

```ts
type ReadBlocksResult = {
  protocolVersion: number   // 当前为 1，只增不减
  docVersion: number        // 文档事务计数，仅日志关联用
  blocks: RegionBlock[]
}

type RegionBlock = {
  hash: string       // 块锚点
  type: string       // 节点类型名：paragraph / heading / bulletList / summaryBoundary ...
  markdown: string   // 块的 Markdown 文本
  lossy?: boolean    // true = 含 Markdown 无法表达的内容（如渐变高亮）
  html?: string      // lossy 时附带的无损 HTML
}

type ReadBlocksOptions = {
  detectLossy?: boolean  // 默认 true；关闭可省去逐块 roundtrip 开销
}
```

### applyOperations(payload) → ApplyResult

批量编辑，同步返回、立即生效。**逐条独立结算**：单条失败（如 hash 失效）不影响其余操作

```ts
type ApplyPayload = {
  operations: RegionOperation[]
  options?: { preview?: boolean }  // true = 进预览态，等 accept() / reject()
}

type RegionOperation = {
  target: string          // 块 hash，或保留字 'doc'
  op: RegionOpType
  content?: RegionContent
  search?: string         // searchReplace 专用：块内待匹配的唯一字符串
  replace?: string        // searchReplace 专用：替换为
}

type RegionOpType =
  | 'replace' | 'insertBefore' | 'insertAfter' | 'delete' | 'searchReplace'  // target = 块 hash
  | 'append' | 'prepend' | 'replaceAll'                                      // target = 'doc'

type ApplyResult = { results: RegionOperationResult[] }

type RegionOperationResult = {
  target: string
  success: boolean
  error?: RegionErrorCode
  newHash?: string | string[]  // 产生新块的操作返回新锚点，可链式继续修改
}
```

操作语义速查：

| op | target | 必填 | 语义 |
|----|--------|------|------|
| `replace` | 块 hash | content | 整块替换（content 可含多个块） |
| `insertBefore` / `insertAfter` | 块 hash | content | 精确插到目标块前 / 后 |
| `delete` | 块 hash | — | 删除整块 |
| `searchReplace` | 块 hash | search、replace | 块内文本替换，search 必须在块内唯一 |
| `append` / `prepend` | `'doc'` | content | 文档末尾 / 开头插入 |
| `replaceAll` | `'doc'` | content | 整篇替换 |

批内顺序注意：操作按数组顺序执行；`replace` / `delete` / `searchReplace` 会让**目标块自身**的 hash 随即失效，同批内不要对同一块修改两次（合并成一次 replace）；`insertBefore` / `insertAfter` 不影响目标块，可与修改共存但要排在修改之前

### 内容通道（RegionContent）

```ts
type RegionContent = {
  format: 'markdown' | 'html' | 'json'  // 默认 'markdown'
  value: string | Record<string, any> | Record<string, any>[]
}
```

| 通道 | 适用 | 说明 |
|------|------|------|
| `markdown` | 文字、标题、列表、`[speaker:N]`、ctx-ref 注释、图片、高亮 | 图片富属性走 `<img ... />`、带色高亮走 `<mark data-color>` 内联 HTML，均无损往返 |
| `html` | 任何实现 parseHTML 的自定义节点 | markdown 已能覆盖图片 / 高亮后，主要用于剩余 lossy 内容（如下划线） |
| `json` | **无损首选**：ProseMirror JSON 直达节点 | 单节点 / 节点数组 / 整个 doc / JSON 字符串均接受；width 等富属性完整保留；非法结构被 schema 校验拒绝 |

### 流式三件套

```ts
beginStream(payload: BeginStreamPayload): { streamId: string }
pushChunk(streamId: string, delta: string): void   // rAF 自动合批渲染
endStream(streamId: string): void                  // 进入 preview 态
accept(): void                                     // 落盘（整次变更 = 一条 undo 记录）
reject(): void                                     // 还原原内容

type BeginStreamPayload = {
  target: string   // 块 hash 或 'doc'
  op: 'replace' | 'insertBefore' | 'insertAfter' | 'append' | 'prepend'
  format?: RegionContentFormat
}
```

同时只允许一个流式会话；新会话开启前未决的旧会话自动回滚

### 状态机与事件

```ts
getState(): 'idle' | 'streaming' | 'preview'
```

```
idle ──beginStream──▶ streaming ──endStream──▶ preview ──accept/reject──▶ idle
idle ──applyOperations({ preview: true })──────▶ preview
```

移动端对应的 web → 原生事件（定义在 `packages/notify`）：

- `aiEditStateChanged`：载荷 `{ state: 'idle' | 'streaming' | 'preview' }`
- `aiEditConflict`：流式 / 预览期间用户编辑了目标区域，会话已自动回滚，原生侧只需中断推送循环

## 3. 错误码

```ts
type RegionErrorCode =
  | 'TARGET_NOT_FOUND'    // hash 失效（块被改过）→ 重新 readBlocks 或用 newHash
  | 'SEARCH_NOT_FOUND'    // searchReplace 无匹配 → 改用 replace 整块替换
  | 'SEARCH_NOT_UNIQUE'   // searchReplace 多处匹配 → 加长 search 串或改 replace
  | 'INVALID_CONTENT'     // content 解析失败（格式错 / 空 / 非法 JSON 结构）
  | 'INVALID_OPERATION'   // op 与 target 组合非法（如对块 hash 用 append）
  | 'STREAM_CONFLICT'     // 流式期间外部编辑冲突
  | 'STREAM_NOT_FOUND'    // streamId 失效（会话已结束 / 被冲突终止）
```

`applyOperations` 的错误体现在逐条 `results[i].error`；`beginStream` / `pushChunk` / `endStream` 以抛出 `RegionOpError`（`error.code` 为上述错误码）的形式报错

## 4. 测试与示例

- 协议行为：`packages/markdown-mobile-tiptap/src/__tests__/ai-edit.test.ts`（14 项）
- 能力边界（自定义节点写入 / 老文档自举 / 精确落点 / 多轮替换 / 三通道）：`packages/markdown-mobile-tiptap/src/__tests__/region-edit-capability.test.ts`
- 肉眼演示：mobile dev 页 DevPanel「ctx-ref marker」区（直接替换 / 假流式按钮）

---

## 5. 选区 AI

选中文本 → AI 改写 → 预览 / 接受 / 拒绝；支持光标插入、上下文传递、结构化输出、流式预览、冲突检测、可撤销

### 架构

```
AIOrchestrator ──事件──→ PreviewController ──状态──→ EditorBridge
      ↑                        ↑                        ↓
   Adapter              PreviewStateMachine       ProseMirror Decoration
  (stream/batch)        (idle→processing→        (预览装饰层)
                         preview→accepted)
```

### 快速使用

```tsx
import { AIOrchestrator, createPreviewController, createTiptapEditorBridge, bindEditor } from 'tiptap-ai'
import { AIButton, AIActionPanel } from 'tiptap-ai/react'

// 1. 创建 orchestrator
const orchestrator = new AIOrchestrator({
  adapters: { streamingAdapter: yourAdapter },
  mode: 'preview',
})

// 2. 创建 controller + bridge
const controller = createPreviewController(orchestrator)
const bridge = createTiptapEditorBridge(editor)

// 3. 绑定
const integration = bindEditor(controller, bridge, orchestrator)

// 4. React 组件
<AIButton controller={controller} mode="stream" />
<AIActionPanel controller={controller} />
```

### 关键类型

```typescript
// 操作模式
type AIOperationMode = 'replace' | 'insert'

// 选区载荷（传给 adapter）
type SelectionPayload = {
  text: string
  range?: { from: number, to: number }
  operationMode?: AIOperationMode  // 'replace' | 'insert'
  context?: ContentContext         // section/block 上下文
  meta?: { prompt?: string }       // 用户 prompt
}

// AI 响应
type NormalizedResponse = {
  text?: string
  delta?: string
  format?: 'text' | 'markdown' | 'html'
}

// 编辑器上下文
type ContentContext = {
  sectionMarkdown?: string
  sectionHeading?: { level: number, text: string } | null
  blockType?: string
  fullDocument?: string
}
```

### useAI Hook

```tsx
const { canTrigger, handleTrigger } = useAI({
  editor,
  controller,
  mode: 'stream',
  allowInsert: true,  // 允许无选区时以插入模式触发
  getContext: (editor) => ({
    blockType: 'paragraph',
    sectionHeading: { level: 2, text: '章节标题' },
  }),
})
```
