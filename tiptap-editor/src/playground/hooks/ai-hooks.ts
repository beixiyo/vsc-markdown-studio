import type { Editor } from '@tiptap/core'
import type { ContentContext } from 'tiptap-ai'
import { useCallback, useEffect, useState } from 'react'
import {
  AIOrchestrator,
  bindEditor,
  ConversationHistory,
  createPreviewController,
  createTiptapEditorBridge,
} from 'tiptap-ai'
import { getContentAtPos } from 'tiptap-api'

export type AiController = ReturnType<typeof createPreviewController>

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function useAiSetup() {
  const [aiOrchestrator] = useState(
    () =>
      new AIOrchestrator({
        adapters: {
          async *streamingAdapter(payload, ctx) {
            const isInsert = payload.operationMode === 'insert'

            if (isInsert) {
              for (const delta of ['这是', ' AI ', '在光标处', '插入的', '新内容。']) {
                if (ctx.abortSignal?.aborted)
                  return
                await sleep(100)
                yield { delta }
              }
            }
            else {
              const chunks = [
                '这是 **AI 增强** 后的文本，',
                '包含 *斜体* 和 **加粗**。',
              ]
              for (const chunk of chunks) {
                if (ctx.abortSignal?.aborted)
                  return
                await sleep(200)
                yield { delta: chunk, format: 'markdown' }
              }
            }
          },

          batchAdapter: async (payload, ctx) => {
            if (ctx.abortSignal?.aborted)
              return { text: '' }

            await sleep(500)

            return {
              text: '<h3>AI 生成标题</h3><p>这是 <strong>加粗</strong> 和 <em>斜体</em> 的结构化内容。</p><ul><li>列表项 1</li><li>列表项 2</li></ul>',
              format: 'html',
            }
          },
        },
        mode: 'preview',
        timeoutMs: 10000,
        enableHistory: true,
      }),
  )

  const [aiHistory] = useState(() => new ConversationHistory({ maxRounds: 10 }))

  useState(() => {
    aiOrchestrator.bindHistory(aiHistory)
  })

  const [aiController] = useState(() => createPreviewController(aiOrchestrator))

  return {
    aiOrchestrator,
    aiController,
    aiHistory,
  }
}

export function useBindAi(editor: Editor | null, aiController: AiController | null, aiOrchestrator: AIOrchestrator | null) {
  useEffect(() => {
    if (!editor || !aiController || !aiOrchestrator)
      return

    const bridge = createTiptapEditorBridge(editor, {
      onConflict: () => {
        console.warn('AI preview conflict: external edit overlaps preview range')
        aiController.reject()
      },
    })
    const integration = bindEditor(aiController, bridge, aiOrchestrator, {
      onError: (error) => {
        console.error('AI error:', error.message)
      },
    })

    return () => {
      integration.dispose()
    }
  }, [editor, aiController, aiOrchestrator])
}

/**
 * 获取当前光标/选区所在位置的编辑器上下文
 */
export function useGetContext() {
  return useCallback((editor: Editor): ContentContext => {
    const pos = editor.state.selection.from
    const content = getContentAtPos(editor, pos, {
      includeBlock: true,
      includeSection: true,
    })

    return {
      blockType: content?.blockType,
      sectionMarkdown: content?.sectionMarkdown,
      sectionHeading: content?.sectionHeading
        ? { level: content.sectionHeading.level, text: content.sectionHeading.text }
        : null,
    }
  }, [])
}
