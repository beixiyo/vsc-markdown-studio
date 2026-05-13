# tiptap-ai

Tiptap 编辑器的 AI 集成层，提供选区替换、光标插入、结构化输出三种模式。

## 核心能力

| 能力 | 说明 |
|------|------|
| **选区替换** | 选中文本 → AI 改写 → 预览/接受/拒绝 |
| **光标插入** | 无需选中，在光标位置直接插入 AI 生成内容 |
| **上下文传递** | 自动将 section/block 上下文传给 AI adapter |
| **结构化输出** | AI 返回 HTML/Markdown 时正确解析为富文本节点 |
| **流式预览** | 支持 stream/batch 两种 adapter 模式 |
| **冲突检测** | 预览期间外部编辑自动取消预览 |
| **可撤销** | accept 后支持 Ctrl+Z 撤销 |

## 架构

```
AIOrchestrator ──事件──→ PreviewController ──状态──→ EditorBridge
      ↑                        ↑                        ↓
   Adapter              PreviewStateMachine       ProseMirror Decoration
  (stream/batch)        (idle→processing→        (预览装饰层)
                         preview→accepted)
```

## 快速使用

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

## 关键类型

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

## useAI Hook

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
