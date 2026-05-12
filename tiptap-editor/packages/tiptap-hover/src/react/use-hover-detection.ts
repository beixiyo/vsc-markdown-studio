import type { Editor } from '@tiptap/react'
import type { ContentAtPos } from 'tiptap-api'
import { useLatestCallback, useThrottleFn } from 'hooks'
import { useEffect, useRef, useState } from 'react'
import { getContentFromCoords } from 'tiptap-api'
import { getEditorElement } from 'tiptap-utils'

import { pointerExitedDocument } from '../pointer-exited-document'

export type UseHoverDetectionConfig = {
  /** Tiptap 编辑器实例 */
  editor: Editor | null
  /** 是否启用 hover 检测 */
  enabled?: boolean
  /** 节流延迟（毫秒），默认 100ms */
  throttleDelay?: number
  /** hover 内容变化时的回调 */
  onHoverChange?: (content: ContentAtPos | null) => void
  /** 是否在拖拽时禁用 hover 检测 */
  disableOnDrag?: boolean
  /** 是否在选择文本时禁用 hover 检测 */
  disableOnSelection?: boolean
}

export type UseHoverDetectionReturn = {
  /** 当前 hover 的内容信息 */
  posContent: ContentAtPos | null
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 手动触发 hover 检测（用于测试） */
  triggerHover: (coords: { left: number, top: number }) => void
}

/**
 * 在 Tiptap 编辑器上根据指针坐标探测 hover 内容
 */
export function useHoverDetection(
  config: UseHoverDetectionConfig,
): UseHoverDetectionReturn {
  const {
    editor,
    enabled = true,
    throttleDelay = 100,
    onHoverChange,
    disableOnDrag = true,
    disableOnSelection = false,
  } = config

  const [posContent, setPosContent] = useState<ContentAtPos | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const editorElementRef = useRef<HTMLElement | null>(null)

  const handleContent = useLatestCallback((content: ContentAtPos | null) => {
    setPosContent(content)
    onHoverChange?.(content)
  })

  const handleMouseMove = useThrottleFn(
    (event: MouseEvent) => {
      if (!enabled || !editor) {
        return
      }

      try {
        if (!editor.view) {
          return
        }
      }
      catch {
        return
      }

      if (isDragging && disableOnDrag) {
        return
      }

      if (disableOnSelection && editor.state.selection.from !== editor.state.selection.to) {
        return
      }

      const editorElement = editorElementRef.current
      if (!editorElement) {
        return
      }

      const rect = editorElement.getBoundingClientRect()
      const isInsideEditor
        = event.clientX >= rect.left
          && event.clientX <= rect.right
          && event.clientY >= rect.top
          && event.clientY <= rect.bottom

      if (!isInsideEditor) {
        handleContent(null)
        return
      }

      const content = getContentFromCoords(editor, {
        left: event.clientX,
        top: event.clientY,
      })

      handleContent(content)
    },
    {
      delay: throttleDelay,
    },
  )

  const handleMouseLeave = useLatestCallback(() => {
    if (!enabled) {
      return
    }
    handleContent(null)
  })

  const handleDragStart = useLatestCallback(() => {
    setIsDragging(true)
    if (disableOnDrag) {
      handleContent(null)
    }
  })

  const handleDragEnd = useLatestCallback(() => {
    setIsDragging(false)
  })

  const triggerHover = useLatestCallback(
    (coords: { left: number, top: number }) => {
      if (!enabled || !editor) {
        return
      }
      const content = getContentFromCoords(editor, coords)
      handleContent(content)
    },
  )

  useEffect(() => {
    if (!enabled || !editor) {
      return
    }

    const editorElement = getEditorElement(editor)
    if (!editorElement) {
      return
    }

    const currentEditorElement = editorElement
    editorElementRef.current = currentEditorElement

    const handleDocumentMouseOut = (event: MouseEvent) => {
      if (!pointerExitedDocument(event))
        return
      handleContent(null)
    }

    currentEditorElement.addEventListener('mousemove', handleMouseMove)
    currentEditorElement.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseout', handleDocumentMouseOut)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('dragend', handleDragEnd)

    return () => {
      currentEditorElement.removeEventListener('mousemove', handleMouseMove)
      currentEditorElement.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseout', handleDocumentMouseOut)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('dragend', handleDragEnd)
    }
  }, [
    enabled,
    editor,
    handleMouseMove,
    handleMouseLeave,
    handleDragStart,
    handleDragEnd,
  ])

  return {
    posContent,
    isDragging,
    triggerHover,
  }
}
