import type { Editor } from '@tiptap/core'
import { useState, useEffect, useCallback } from 'react'
import type { PreviewController } from '../../PreviewController'
import type { AIRequestMode } from '../../types'
import { getTiptapSelectionPayload } from '../../TiptapEditorBridge'


/**
 * AI 功能 Hook，用于管理 AI 按钮的状态和操作
 */
export function useAI(config: UseAIConfig): UseAIReturn {
  const { editor, controller, mode = 'stream', } = config

  const [isProcessing, setIsProcessing] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  // 订阅控制器状态变化
  useEffect(() => {
    if (!controller) return

    const unsubscribe = controller.subscribe((state) => {
      setIsProcessing(state.status === 'processing')
      setIsPreview(state.status === 'preview')
    })

    return unsubscribe
  }, [controller])

  // 检查是否可以触发 AI（需要选中文本）
  const canTrigger = useCallback(() => {
    if (!editor || editor.isDestroyed) return false
    const { selection } = editor.state
    return !selection.empty
  }, [editor])

  // 触发 AI 处理
  const handleTrigger = useCallback(
    (prompt?: string) => {
      if (!editor || !controller || !canTrigger()) return

      const payload = getTiptapSelectionPayload(editor)
      if (!payload) return

      // 如果有 prompt，添加到 meta 中
      if (prompt) {
        payload.meta = {
          ...payload.meta,
          prompt,
        }
      }

      controller.sendSelection(payload, mode).catch((err) => {
        console.error('AI 处理失败:', err)
      })
    },
    [editor, controller, mode, canTrigger]
  )

  // 接受预览
  const handleAccept = useCallback(() => {
    if (!controller) return
    controller.accept()
  }, [controller])

  // 拒绝预览
  const handleReject = useCallback(() => {
    if (!controller) return
    controller.reject()
  }, [controller])

  const label = isProcessing
    ? 'AI 处理中...'
    : isPreview
      ? 'AI 预览中'
      : 'AI 增强'

  return {
    canTrigger: canTrigger(),
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