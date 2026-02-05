/**
 * 选中文本工具栏逻辑 Hook
 * 管理选区状态、Popover 开关、滚动与事件监听
 */

import type { PopoverRef } from 'comps'
import type { UseSelectToolbarOptions } from '../types'
import { getScrollParents } from 'hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSelectionRect, hasSelectedText, isSelectionOnlyLinkText } from 'tiptap-api'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'

export function useSelectToolbar({
  editor,
  enabled,
}: UseSelectToolbarOptions) {
  const [hasSelection, setHasSelection] = useState(false)
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const updateTimeoutRef = useRef<number | undefined>(undefined)
  const popoverRef = useRef<PopoverRef>(null)
  const isInteractingRef = useRef(false)
  const isMouseDownRef = useRef(false)

  const updateToolbarState = useCallback((force = false) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    if (isMouseDownRef.current && !force) {
      return
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      if (!editor || editor.isDestroyed) {
        setHasSelection(false)
        setSelectionRect(null)
        return
      }

      const has = hasSelectedText(editor) && !isSelectionOnlyLinkText(editor)

      if (!has && isInteractingRef.current) {
        return
      }

      if (!has) {
        setHasSelection(false)
        setSelectionRect(null)
        return
      }

      if (isInteractingRef.current && selectionRect) {
        setHasSelection(true)
        return
      }

      const rect = getSelectionRect(editor)
      setHasSelection(true)
      setSelectionRect(rect)
    }, 0)
  }, [editor, selectionRect])

  /** 选区变化时同步 Popover 开关 */
  useEffect(() => {
    if (hasSelection && enabled && selectionRect) {
      popoverRef.current?.open()
    }
    else {
      popoverRef.current?.close()
    }
  }, [hasSelection, enabled, selectionRect])

  /** 工具栏显示时监听滚动，更新选区矩形 */
  useEffect(() => {
    if (!hasSelection || !selectionRect || !editor || editor.isDestroyed) {
      return
    }

    let editorElement: HTMLElement | null = null
    try {
      editorElement = editor.view.dom as HTMLElement
    }
    catch {
      return
    }

    const updateRectOnScroll = () => {
      if (!editor || editor.isDestroyed || !hasSelectedText(editor) || isSelectionOnlyLinkText(editor)) {
        return
      }
      const rect = getSelectionRect(editor)
      if (rect) {
        setSelectionRect(rect)
      }
    }

    const scrollContainers = getScrollParents(editorElement)
    window.addEventListener('scroll', updateRectOnScroll, { capture: true, passive: true })
    scrollContainers.forEach((el) => {
      el.addEventListener('scroll', updateRectOnScroll, { passive: true })
    })

    return () => {
      window.removeEventListener('scroll', updateRectOnScroll, { capture: true } as EventListenerOptions)
      scrollContainers.forEach((el) => {
        el.removeEventListener('scroll', updateRectOnScroll)
      })
    }
  }, [hasSelection, editor])

  /** 监听选区与交互事件 */
  useEffect(() => {
    if (!enabled || !editor) {
      setHasSelection(false)
      return
    }

    let editorElement: HTMLElement | null = null
    try {
      editorElement = editor.view.dom as HTMLElement
    }
    catch {
      return
    }

    if (!editorElement) {
      return
    }

    const currentEditorElement = editorElement

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      const keepOpenElement = target.closest(`[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]`)
      if (keepOpenElement) {
        isInteractingRef.current = true
      }
      else if (currentEditorElement.contains(target)) {
        isInteractingRef.current = false
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true
      const target = event.target as HTMLElement
      const keepOpenElement = target.closest(`[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]`)
      if (keepOpenElement) {
        isInteractingRef.current = true
        return
      }
      if (currentEditorElement.contains(target)) {
        isInteractingRef.current = false
      }
    }

    const handleMouseUp = () => {
      isMouseDownRef.current = false
      updateToolbarState(true)
    }

    const handleSelectionUpdate = () => {
      updateToolbarState()
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('focusin', handleFocusIn)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [enabled, editor, updateToolbarState])

  return {
    hasSelection,
    selectionRect,
    isInteractingRef,
    popoverRef,
  }
}
