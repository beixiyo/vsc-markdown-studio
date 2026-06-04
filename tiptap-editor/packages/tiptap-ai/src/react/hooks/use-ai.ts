import type { Editor } from '@tiptap/core'
import type { PreviewController } from '../../PreviewController'
import type { AIRequestMode, ContentContext } from '../../types'
import { useT } from 'i18n/react'
import { useCallback, useEffect, useState } from 'react'
import { AI_LABELS } from '../../constants'
import { getTiptapCursorPayload, getTiptapSelectionPayload } from '../../TiptapEditorBridge'

/**
 * AI 功能 Hook，用于管理 AI 按钮的状态 and 操作
 */
export function useAI(config: UseAIConfig): UseAIReturn {
  const { editor, controller, mode = 'stream', allowInsert = false, getContext } = config
  const t = useT('tiptap')

  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const computeCanTrigger = useCallback(() => {
    if (!editor || editor.isDestroyed)
      return false
    const { selection } = editor.state
    return allowInsert || !selection.empty
  }, [editor, allowInsert])

  const [canTriggerState, setCanTriggerState] = useState(() => computeCanTrigger())

  useEffect(() => {
    if (!controller)
      return

    const unsubscribe = controller.subscribe((state) => {
      setIsProcessing(state.status === 'processing')
      setIsPreview(state.status === 'preview')
    })

    return unsubscribe
  }, [controller])

  useEffect(() => {
    if (!editor)
      return

    setCanTriggerState(computeCanTrigger())

    const handleUpdate = () => {
      setCanTriggerState(computeCanTrigger())
    }

    editor.on('selectionUpdate', handleUpdate)
    editor.on('destroy', () => setCanTriggerState(false))

    return () => {
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor, computeCanTrigger])

  const handleTrigger = useCallback(
    (prompt?: string) => {
      if (!editor || !controller || !computeCanTrigger())
        return

      const payload = getTiptapSelectionPayload(editor)
        ?? (allowInsert
          ? getTiptapCursorPayload(editor)
          : undefined)
      if (!payload)
        return

      if (prompt) {
        payload.meta = { ...payload.meta, prompt }
      }

      if (getContext) {
        payload.context = getContext(editor)
      }

      controller.sendSelection(payload, mode).catch((err) => {
        console.error('AI 处理失败:', err)
      })
    },
    [editor, controller, mode, computeCanTrigger, allowInsert, getContext],
  )

  /** 接受预览 */
  const handleAccept = useCallback(() => {
    if (!controller)
      return
    controller.accept()
  }, [controller])

  /** 拒绝预览 */
  const handleReject = useCallback(() => {
    if (!controller)
      return
    controller.reject()
  }, [controller])

  const labelKey = isProcessing
    ? AI_LABELS.PROCESSING
    : isPreview
      ? AI_LABELS.PREVIEW
      : AI_LABELS.IDLE

  const label = t(labelKey)

  return {
    canTrigger: canTriggerState,
    isProcessing,
    isPreview,
    handleTrigger,
    handleAccept,
    handleReject,
    label,
  }
}

/**
 * AI Hook 配置
 */
export type UseAIConfig = {
  editor: Editor | null
  controller: PreviewController | null
  mode?: AIRequestMode
  /** 允许无选区时以插入模式触发 @default false */
  allowInsert?: boolean
  /** 获取编辑器上下文，传给 adapter */
  getContext?: (editor: Editor) => ContentContext
}

/**
 * AI Hook 返回值
 */
export type UseAIReturn = {
  /** 是否可以触发 AI */
  canTrigger: boolean
  /** 是否正在处理中 */
  isProcessing: boolean
  /** 是否处于预览状态 */
  isPreview: boolean
  /** 触发 AI 处理（带 prompt） */
  handleTrigger: (prompt?: string) => void
  /** 接受预览 */
  handleAccept: () => void
  /** 拒绝预览 */
  handleReject: () => void
  /** 标签文本 */
  label: string
}
