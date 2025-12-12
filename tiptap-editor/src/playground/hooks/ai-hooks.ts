import type { Editor } from '@tiptap/core'
import { useEffect, useState } from 'react'
import { AIOrchestrator, bindEditor, createMockBatchAdapter, createMockStreamingAdapter, createPreviewController, createTiptapEditorBridge } from 'tiptap-ai'

export type AiController = ReturnType<typeof createPreviewController>

export function useAiSetup() {
  const [aiOrchestrator] = useState(
    () =>
      new AIOrchestrator({
        adapters: {
          streamingAdapter: createMockStreamingAdapter({
            deltas: ['AI', ' 增强', ' 文本', ' 内容'],
            finalText: '接受更改',
            delayMs: 100,
          }),
          batchAdapter: createMockBatchAdapter({
            text: 'AI 批量处理结果',
            delayMs: 500,
          }),
        },
        mode: 'preview',
        timeoutMs: 5000,
      }),
  )

  const [aiController] = useState(() => createPreviewController(aiOrchestrator))

  return {
    aiOrchestrator,
    aiController,
  }
}

export function useBindAi(editor: Editor | null, aiController: AiController | null, aiOrchestrator: AIOrchestrator | null) {
  useEffect(() => {
    if (!editor || !aiController || !aiOrchestrator) {
      return
    }

    const bridge = createTiptapEditorBridge(editor)
    const integration = bindEditor(aiController, bridge, aiOrchestrator, {
      onError: (error) => {
        console.error('AI 错误:', error.message)
      },
    })

    return () => {
      integration.dispose()
    }
  }, [editor, aiController, aiOrchestrator])
}
