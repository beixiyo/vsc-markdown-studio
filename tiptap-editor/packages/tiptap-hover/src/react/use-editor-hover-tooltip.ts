import { useLatestCallback, useThrottleFn } from 'hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getHoverContentFromCoords,
  type HoverContent,
} from 'tiptap-api'
import { getEditorElement } from 'tiptap-utils'

import { pointerExitedDocument } from '../pointer-exited-document'
import type { EditorHoverTooltipProps } from './types'

export function useEditorHoverTooltip(props: EditorHoverTooltipProps) {
  const {
    editor,
    enabled = true,
    throttleDelay = 100,
    disableOnDrag = true,
    disableOnSelection = false,
    formatContent,
  } = props

  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)
  const [hoverContent, setHoverContent] = useState<HoverContent | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const editorElementRef = useRef<HTMLElement | null>(null)

  const handleHoverContentUpdate = useThrottleFn(
    (coords: { x: number, y: number }) => {
      if (
        coords == null
        || !Number.isFinite(coords.x)
        || !Number.isFinite(coords.y)
      ) {
        return
      }

      if (!enabled || !editor || !editor.view) {
        setHoverContent(null)
        return
      }

      if (isDragging && disableOnDrag) {
        setHoverContent(null)
        return
      }

      if (disableOnSelection && editor.state.selection.from !== editor.state.selection.to) {
        setHoverContent(null)
        return
      }

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

  const handleMouseMove = useLatestCallback((event: MouseEvent) => {
    if (!enabled || !editor?.view) {
      setMousePosition(null)
      setHoverContent(null)
      return
    }

    const editorElement = editorElementRef.current
    if (!editorElement)
      return

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

    const newPosition = { x: event.clientX, y: event.clientY }
    setMousePosition(newPosition)
    handleHoverContentUpdate(newPosition)
  })

  const handleMouseLeave = useLatestCallback(() => {
    if (!enabled)
      return
    setMousePosition(null)
    setHoverContent(null)
  })

  const handleDragStart = useLatestCallback(() => {
    setIsDragging(true)
    if (disableOnDrag) {
      setMousePosition(null)
      setHoverContent(null)
    }
  })

  const handleDragEnd = useLatestCallback(() => {
    setIsDragging(false)
  })

  useEffect(() => {
    if (!enabled || !editor?.view) {
      setMousePosition(null)
      setHoverContent(null)
      return
    }

    const editorElement = getEditorElement(editor)
    if (!editorElement)
      return

    editorElementRef.current = editorElement

    const handleDocumentMouseOut = (event: MouseEvent) => {
      if (!pointerExitedDocument(event))
        return
      setMousePosition(null)
      setHoverContent(null)
    }

    editorElement.addEventListener('mousemove', handleMouseMove)
    editorElement.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseout', handleDocumentMouseOut)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('dragend', handleDragEnd)

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove)
      editorElement.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseout', handleDocumentMouseOut)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('dragend', handleDragEnd)
      setMousePosition(null)
      setHoverContent(null)
    }
  }, [enabled, editor, handleMouseMove, handleMouseLeave, handleDragStart, handleDragEnd])

  const formattedContent = useMemo(() => {
    if (!hoverContent)
      return ''

    if (formatContent)
      return formatContent(hoverContent)

    const parts: string[] = []
    if (hoverContent.blockType)
      parts.push(`块: ${hoverContent.blockType}`)

    if (hoverContent.marks?.length > 0) {
      const markNames = hoverContent.marks.map(m => m.type).join(', ')
      parts.push(`标记: ${markNames}`)
    }

    if (hoverContent.lineInBlockText?.trim()) {
      const line = hoverContent.lineInBlockText.trim()
      const truncated = line.length > 120
        ? `${line.slice(0, 120)}...`
        : line
      parts.push(`行: ${truncated}`)
    }
    else if (hoverContent.textContent) {
      const text = hoverContent.textContent.trim()
      if (text) {
        const truncated = text.length > 50
          ? `${text.slice(0, 50)}...`
          : text
        parts.push(`叶子: ${truncated}`)
      }
    }

    if (hoverContent.contextText?.trim()) {
      const ctx = hoverContent.contextText.trim()
      const truncated = ctx.length > 100
        ? `${ctx.slice(0, 100)}...`
        : ctx
      parts.push(`上下文: ${truncated}`)
    }

    if (hoverContent.pos !== undefined)
      parts.push(`位置: ${hoverContent.pos}`)

    return parts.join(' | ')
  }, [hoverContent, formatContent])

  return {
    formattedContent,
    mousePosition,
  }
}
