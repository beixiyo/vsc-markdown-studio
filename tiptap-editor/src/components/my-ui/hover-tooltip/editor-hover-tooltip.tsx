import type { Placement } from '@floating-ui/react'
import { useThrottleFn } from 'hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getHoverContentFromCoords, type HoverContent } from 'tiptap-api'
import { HoverTooltip } from './hover-tooltip'

/**
 * 编辑器专用的 Hover Tooltip 包装器
 * 保持向后兼容性
 */
export function EditorHoverTooltip({
  editor,
  enabled = true,
  throttleDelay = 100,
  disableOnDrag = true,
  disableOnSelection = false,
  formatContent,
  offsetDistance = 8,
  placement = 'top-start',
}: {
  editor: any
  enabled?: boolean
  throttleDelay?: number
  disableOnDrag?: boolean
  disableOnSelection?: boolean
  formatContent?: (content: HoverContent | null) => string | React.ReactNode
  offsetDistance?: number
  placement?: Placement
}) {
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)
  const [hoverContent, setHoverContent] = useState<HoverContent | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const editorElementRef = useRef<HTMLElement | null>(null)

  /** 节流更新 hover 内容 */
  const handleHoverContentUpdate = useThrottleFn(
    (coords: { x: number, y: number }) => {
      if (!enabled || !editor || !editor.view) {
        setHoverContent(null)
        return
      }

      /** 如果正在拖拽且启用了拖拽禁用，则跳过 */
      if (isDragging && disableOnDrag) {
        setHoverContent(null)
        return
      }

      /** 如果正在选择文本且启用了选择禁用，则跳过 */
      if (disableOnSelection && editor.state.selection.from !== editor.state.selection.to) {
        setHoverContent(null)
        return
      }

      /** 获取 hover 内容 */
      const content = getHoverContentFromCoords(editor, {
        left: coords.x,
        top: coords.y,
      })

      setHoverContent(content)
    },
    {
      delay: throttleDelay,
      deps: [enabled, editor, isDragging, disableOnDrag, disableOnSelection],
    },
  )

  /** 实时处理鼠标移动（不节流，只更新位置） */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !editor?.view) {
        setMousePosition(null)
        setHoverContent(null)
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
        setMousePosition(null)
        setHoverContent(null)
        return
      }

      /** 实时更新鼠标位置（不节流） */
      const newPosition = { x: event.clientX, y: event.clientY }
      setMousePosition(newPosition)

      /** 节流更新内容 */
      handleHoverContentUpdate()
    },
    [enabled, editor, handleHoverContentUpdate],
  )

  /** 处理鼠标离开编辑器 */
  const handleMouseLeave = useCallback(() => {
    if (!enabled) {
      return
    }
    setMousePosition(null)
    setHoverContent(null)
  }, [enabled])

  /** 处理拖拽开始 */
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    if (disableOnDrag) {
      setMousePosition(null)
      setHoverContent(null)
    }
  }, [disableOnDrag])

  /** 处理拖拽结束 */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  /** 监听鼠标移动和移出 */
  useEffect(() => {
    if (!enabled || !editor?.view) {
      setMousePosition(null)
      setHoverContent(null)
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
      setMousePosition(null)
      setHoverContent(null)
    }
  }, [enabled, editor, handleMouseMove, handleMouseLeave, handleDragStart, handleDragEnd])

  /** 格式化内容 */
  const formattedContent = useMemo(() => {
    if (!hoverContent) {
      return ''
    }

    if (formatContent) {
      return formatContent(hoverContent)
    }

    const parts: string[] = []
    if (hoverContent.blockType) {
      parts.push(`块: ${hoverContent.blockType}`)
    }
    if (hoverContent.marks?.length > 0) {
      const markNames = hoverContent.marks.map(m => m.type).join(', ')
      parts.push(`标记: ${markNames}`)
    }
    if (hoverContent.textContent) {
      const text = hoverContent.textContent.trim()
      if (text) {
        const truncated = text.length > 50
          ? `${text.slice(0, 50)}...`
          : text
        parts.push(`文本: ${truncated}`)
      }
    }
    if (hoverContent.pos !== undefined) {
      parts.push(`位置: ${hoverContent.pos}`)
    }

    return parts.join(' | ')
  }, [hoverContent, formatContent])

  return (
    <HoverTooltip
      enabled={ enabled }
      content={ formattedContent }
      mousePosition={ mousePosition }
      offsetDistance={ offsetDistance }
      placement={ placement }
    />
  )
}
