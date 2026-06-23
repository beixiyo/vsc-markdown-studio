# tiptap-ai

Tiptap 编辑器的选区 AI 集成层，负责“选中文本 → AI 改写 → 预览 / 接受 / 拒绝”这条交互链路

区域编辑已经独立为 `tiptap-region` 插件包：

- 文档：`tiptap-editor/packages/tiptap-region/README.md`
- 类型：`tiptap-editor/packages/tiptap-region/src/types.ts`

---

## 选区 AI

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
  range?: Record<string, any>      // 位置信息，格式留给上层决定
  operationMode?: AIOperationMode  // 'replace' | 'insert'
  context?: ContentContext         // section/block 上下文
  meta?: Record<string, any>       // 自由扩展（useAI 会塞入用户 prompt 等）
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
