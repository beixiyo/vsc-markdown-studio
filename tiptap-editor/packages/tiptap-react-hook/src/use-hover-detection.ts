import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getHoverContentFromCoords, type HoverContent } from 'tiptap-api'
import { useThrottledCallback } from './use-throttled-callback'

export interface UseHoverDetectionConfig {
  /** Tiptap 编辑器实例 */
  editor: Editor | null
  /** 是否启用 hover 检测 */
  enabled?: boolean
  /** 节流延迟（毫秒），默认 100ms */
  throttleDelay?: number
  /** hover 内容变化时的回调 */
  onHoverChange?: (content: HoverContent | null) => void
  /** 是否在拖拽时禁用 hover 检测 */
  disableOnDrag?: boolean
  /** 是否在选择文本时禁用 hover 检测 */
  disableOnSelection?: boolean
}

export interface UseHoverDetectionReturn {
  /** 当前 hover 的内容信息 */
  hoverContent: HoverContent | null
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 手动触发 hover 检测（用于测试） */
  triggerHover: (coords: { left: number, top: number }) => void
}

/**
 * Hook for detecting hover content in Tiptap editor
 *
 * @example
 * ```tsx
 * function MyEditor() {
 *   const editor = useEditor({ ... })
 *
 *   const { hoverContent } = useHoverDetection({
 *     editor,
 *     onHoverChange: (content) => {
 *       console.log('Hover content:', content)
 *     }
 *   })
 *
 *   return <EditorContent editor={editor} />
 * }
 * ```
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

  const [hoverContent, setHoverContent] = useState<HoverContent | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const editorElementRef = useRef<HTMLElement | null>(null)

  /** 处理 hover 内容更新 */
  const handleHoverContent = useCallback(
    (content: HoverContent | null) => {
      setHoverContent(content)
      onHoverChange?.(content)
    },
    [onHoverChange],
  )

  /** 节流处理鼠标移动 */
  const handleMouseMove = useThrottledCallback(
    (event: MouseEvent) => {
      if (!enabled || !editor || !editor.view) {
        return
      }

      /** 如果正在拖拽且启用了拖拽禁用，则跳过 */
      if (isDragging && disableOnDrag) {
        return
      }

      /** 如果正在选择文本且启用了选择禁用，则跳过 */
      if (disableOnSelection && editor.state.selection.from !== editor.state.selection.to) {
        return
      }

      /** 检查鼠标是否在编辑器内 */
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
        handleHoverContent(null)
        return
      }

      /** 获取 hover 内容 */
      const content = getHoverContentFromCoords(editor, {
        left: event.clientX,
        top: event.clientY,
      })

      handleHoverContent(content)
    },
    throttleDelay,
    [enabled, editor, isDragging, disableOnDrag, disableOnSelection, handleHoverContent],
  )

  /** 处理鼠标离开编辑器 */
  const handleMouseLeave = useCallback(() => {
    if (!enabled) {
      return
    }
    handleHoverContent(null)
  }, [enabled, handleHoverContent])

  /** 处理拖拽开始 */
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    if (disableOnDrag) {
      handleHoverContent(null)
    }
  }, [disableOnDrag, handleHoverContent])

  /** 处理拖拽结束 */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  /** 手动触发 hover 检测 */
  const triggerHover = useCallback(
    (coords: { left: number, top: number }) => {
      if (!enabled || !editor) {
        return
      }
      const content = getHoverContentFromCoords(editor, coords)
      handleHoverContent(content)
    },
    [enabled, editor, handleHoverContent],
  )

  /** 设置事件监听 */
  useEffect(() => {
    if (!enabled || !editor || !editor.view) {
      return
    }

    const editorElement = editor.view.dom as HTMLElement
    if (!editorElement) {
      return
    }

    editorElementRef.current = editorElement

    /** 添加事件监听 */
    editorElement.addEventListener('mousemove', handleMouseMove)
    editorElement.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('dragend', handleDragEnd)

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove)
      editorElement.removeEventListener('mouseleave', handleMouseLeave)
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
    hoverContent,
    isDragging,
    triggerHover,
  }
}
