'use client'

import type { SelectionToolbarProps } from './types'
import { Popover, type PopoverRef } from 'comps'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSelectionRect, hasSelectedText } from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'

/**
 * 选中文本工具栏组件
 * 当用户选中文本时，在选中文本上方显示工具栏
 */
export function SelectionToolbar({
  editor: providedEditor,
  enabled = true,
  children,
  offsetDistance = 8,
  placement = 'top-start',
  className = '',
}: SelectionToolbarProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [hasSelection, setHasSelection] = useState(false)
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const updateTimeoutRef = useRef<number | undefined>(undefined)
  const popoverRef = useRef<PopoverRef>(null)
  const isInteractingRef = useRef(false)
  const isMouseDownRef = useRef(false)

  /** 统一更新工具栏显示状态 */
  const updateToolbarState = useCallback((force = false) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    /**
     * 如果鼠标正按着且不是强制更新，则不处理显示逻辑
     * 这是为了防止用户在滑动选择过程中，工具栏频繁渲染导致选区中断
     */
    if (isMouseDownRef.current && !force) {
      return
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      if (!editor || editor.isDestroyed) {
        setHasSelection(false)
        setSelectionRect(null)
        return
      }

      const has = hasSelectedText(editor)

      /**
       * 如果当前没有选区，但用户正在与工具栏的子菜单（如颜色面板、链接输入框）交互，
       * 我们应该保持工具栏开启状态，避免闪烁或非预期关闭。
       */
      if (!has && isInteractingRef.current) {
        return
      }

      /** 如果选区消失，立即关闭，不需要等待 */
      if (!has) {
        setHasSelection(false)
        setSelectionRect(null)
        return
      }

      /**
       * 当子菜单打开时，锁定工具栏位置，防止因编辑器内容微调（如应用颜色导致的 DOM 变化）
       * 引起工具栏位置跳动。
       */
      if (isInteractingRef.current && selectionRect) {
        setHasSelection(true)
        return
      }

      const rect = getSelectionRect(editor)
      setHasSelection(true)
      setSelectionRect(rect)
    }, 0)
  }, [editor, selectionRect])

  /** 监听选区变化 */
  useEffect(() => {
    if (hasSelection && enabled && selectionRect) {
      popoverRef.current?.open()
    }
    else {
      popoverRef.current?.close()
    }
  }, [hasSelection, enabled, selectionRect])

  /** 监听事件 */
  useEffect(() => {
    if (!enabled || !editor) {
      setHasSelection(false)
      return
    }

    let editorElement: HTMLElement | null = null
    try {
      editorElement = editor.view.dom as HTMLElement
    }
    catch (e) {
      return
    }

    if (!editorElement) {
      return
    }

    const currentEditorElement = editorElement

    /** 监听焦点进入事件 */
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

    /** 监听鼠标按下事件 */
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
        /** 点击编辑器内部时，如果之前有选区，先隐约关闭或不处理，等待 mouseup */
      }
    }

    /** 监听鼠标抬起事件 */
    const handleMouseUp = () => {
      isMouseDownRef.current = false
      /** 鼠标抬起时，强制更新一次状态以显示工具栏 */
      updateToolbarState(true)
    }

    /** 监听 Tiptap 选区更新事件 */
    const handleSelectionUpdate = () => {
      /**
       * 如果鼠标没按着（比如键盘操作），直接更新
       * 如果鼠标按着，updateToolbarState 内部会拦截
       */
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

  /** 如果没有选中或未启用，不显示工具栏 */
  if (!enabled || (!selectionRect && !isInteractingRef.current)) {
    return null
  }

  /** 如果没有 children，不渲染任何内容 */
  if (!children) {
    return null
  }

  return (
    <Popover
      ref={ popoverRef }
      trigger="command"
      position={ (placement?.split('-')[0] as any) || 'top' }
      offset={ offsetDistance }
      virtualReferenceRect={ selectionRect }
      clickOutsideIgnoreSelector={ `[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]` }
      content={
        <div
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
          className={ cn(
            'bn-toolbar flex items-center gap-1 px-1.5 py-1 max-w-[100vw] bg-background text-textSecondary rounded-lg shadow-lg z-50',
            className,
          ) }
        >
          { children }
        </div>
      }
      contentClassName="p-0"
    >
      <div className="hidden" />
    </Popover>
  )
}
