import type { EditorHoverTooltipProps } from './types'
import { useLatestCallback, useThrottleFn } from 'hooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type ContentAtPos,
  getContentFromCoords,
} from 'tiptap-api'
import { getEditorElement } from 'tiptap-utils'
import { pointerExitedDocument } from '../pointer-exited-document'

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
  const [posContent, setPosContent] = useState<ContentAtPos | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const editorElementRef = useRef<HTMLElement | null>(null)

  const handleContentUpdate = useThrottleFn(
    (coords: { x: number, y: number }) => {
      if (
        coords == null
        || !Number.isFinite(coords.x)
        || !Number.isFinite(coords.y)
      ) {
        return
      }

      if (!enabled || !editor || !editor.view) {
        setPosContent(null)
        return
      }

      if (isDragging && disableOnDrag) {
        setPosContent(null)
        return
      }

      if (disableOnSelection && editor.state.selection.from !== editor.state.selection.to) {
        setPosContent(null)
        return
      }

      const content = getContentFromCoords(editor, {
        left: coords.x,
        top: coords.y,
      }, { includeSection: true })

      setPosContent(content)
    },
    {
      delay: throttleDelay,
    },
  )

  const handleMouseMove = useLatestCallback((event: MouseEvent) => {
    if (!enabled || !editor?.view) {
      setMousePosition(null)
      setPosContent(null)
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
      setPosContent(null)
      return
    }

    const newPosition = { x: event.clientX, y: event.clientY }
    setMousePosition(newPosition)
    handleContentUpdate(newPosition)
  })

  const handleMouseLeave = useLatestCallback(() => {
    if (!enabled)
      return
    setMousePosition(null)
    setPosContent(null)
  })

  const handleDragStart = useLatestCallback(() => {
    setIsDragging(true)
    if (disableOnDrag) {
      setMousePosition(null)
      setPosContent(null)
    }
  })

  const handleDragEnd = useLatestCallback(() => {
    setIsDragging(false)
  })

  useEffect(() => {
    if (!enabled || !editor?.view) {
      setMousePosition(null)
      setPosContent(null)
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
      setPosContent(null)
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
      setPosContent(null)
    }
  }, [enabled, editor, handleMouseMove, handleMouseLeave, handleDragStart, handleDragEnd])

  const formattedContent = useMemo(() => {
    if (!posContent)
      return ''

    if (formatContent)
      return formatContent(posContent)

    const parts: string[] = []
    if (posContent.blockType)
      parts.push(`块: ${posContent.blockType}`)

    if (posContent.marks?.length > 0) {
      const markNames = posContent.marks.map(m => m.type).join(', ')
      parts.push(`标记: ${markNames}`)
    }

    if (posContent.lineInBlockText?.trim()) {
      const line = posContent.lineInBlockText.trim()
      const truncated = line.length > 120
        ? `${line.slice(0, 120)}...`
        : line
      parts.push(`行: ${truncated}`)
    }
    else if (posContent.textContent) {
      const text = posContent.textContent.trim()
      if (text) {
        const truncated = text.length > 50
          ? `${text.slice(0, 50)}...`
          : text
        parts.push(`叶子: ${truncated}`)
      }
    }

    if (posContent.contextText?.trim()) {
      const ctx = posContent.contextText.trim()
      const truncated = ctx.length > 100
        ? `${ctx.slice(0, 100)}...`
        : ctx
      parts.push(`上下文: ${truncated}`)
    }

    if (posContent.pos !== undefined)
      parts.push(`位置: ${posContent.pos}`)

    if (posContent.sectionHeading) {
      parts.push(`段落: [H${posContent.sectionHeading.level}] ${posContent.sectionHeading.text}`)
    }
    else if (posContent.sectionText) {
      parts.push(`段落: （文档开头，无标题）`)
    }

    if (posContent.sectionRange) {
      const headingLabel = posContent.sectionHeading
        ? `[H${posContent.sectionHeading.level}] ${posContent.sectionHeading.text}`
        : '(none)'
      const body = posContent.sectionMarkdown || posContent.sectionText

      console.log(
        `[HoverSection] pos=${posContent.pos}`,
        `heading=${headingLabel}`,
        `range=[${posContent.sectionRange.from},${posContent.sectionRange.to}]`,
        `\n---\n${body}\n---`,
      )
    }

    return parts.join(' | ')
  }, [posContent, formatContent])

  return {
    formattedContent,
    mousePosition,
  }
}
