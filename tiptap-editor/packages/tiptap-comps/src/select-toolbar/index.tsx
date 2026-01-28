'use client'

import type { SelectionToolbarProps } from './types'
import { Popover, type PopoverRef } from 'comps'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSelectionRect as getApiSelectionRect, hasSelectedText } from 'tiptap-api'
import { useTiptapEditor } from 'tiptap-api/react'
import { cn } from 'utils'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'

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
  editorSelector = '.tiptap',
}: SelectionToolbarProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [hasSelection, setHasSelection] = useState(false)
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const updateTimeoutRef = useRef<number | undefined>(undefined)
  const popoverRef = useRef<PopoverRef>(null)
  const isInteractingRef = useRef(false)

  /** 获取选中文本的 DOM 位置（实时计算，不缓存） */
  const getSelectionRect = useCallback(() => {
    return getApiSelectionRect(editor)
  }, [editor])

  /** 统一更新工具栏显示状态 */
  const updateToolbarState = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    /** 使用 setTimeout 确保 DOM 已更新 */
    updateTimeoutRef.current = window.setTimeout(() => {
      if (!editor) {
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

      setHasSelection(has)

      if (has) {
        /**
         * 当子菜单打开时，锁定工具栏位置，防止因编辑器内容微调（如应用颜色导致的 DOM 变化）
         * 引起工具栏位置跳动。
         */
        if (isInteractingRef.current && selectionRect) {
          return
        }

        const rect = getSelectionRect()
        setSelectionRect(rect)
      }
      else {
        setSelectionRect(null)
      }
    }, 0)
  }, [editor, getSelectionRect, selectionRect])

  useEffect(() => {
    if (hasSelection && enabled && selectionRect) {
      popoverRef.current?.open()
    }
    else if (!isInteractingRef.current) {
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
      // 视图不可用，暂不绑定事件
      return
    }

    if (!editorElement) {
      return
    }

    const currentEditorElement = editorElement

    /** 监听鼠标按下事件 */
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      /** 检查是否点击在“保持打开”的元素上 */
      const keepOpenElement = target.closest(`[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]`)
      if (keepOpenElement) {
        isInteractingRef.current = true
        return
      }

      /** 检查点击是否在编辑器外，且不是在交互区域 */
      if (!currentEditorElement.contains(target)) {
        isInteractingRef.current = false
      }
    }

    /** 监听鼠标松开事件（在编辑器内完成选择时显示） */
    const handleMouseUp = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      /** 如果点击在交互区域，记录状态 */
      const keepOpenElement = target.closest(`[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]`)
      if (keepOpenElement) {
        isInteractingRef.current = true
      }

      /** 检查事件是否发生在编辑器内 */
      if (currentEditorElement.contains(target)) {
        updateToolbarState()
      }
    }

    /** 监听键盘事件（支持键盘选择文本） */
    const handleKeyUp = (event: KeyboardEvent) => {
      /** 检查编辑器是否获得焦点 */
      const isEditorFocused = currentEditorElement === document.activeElement
        || currentEditorElement.contains(document.activeElement)

      if (!isEditorFocused) {
        return
      }

      /** 检查是否是选择相关的按键（Shift + 方向键、Ctrl/Cmd + A 等） */
      const isSelectionKey = event.shiftKey
        || (event.ctrlKey || event.metaKey) && event.key === 'a'
        || event.key === 'ArrowLeft'
        || event.key === 'ArrowRight'
        || event.key === 'ArrowUp'
        || event.key === 'ArrowDown'

      if (isSelectionKey) {
        updateToolbarState()
      }
    }

    /** 添加事件监听器 */
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keyup', handleKeyUp)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [enabled, editor, editorSelector, updateToolbarState])

  /** 如果没有选中或未启用，不显示工具栏 */
  if (!enabled || !selectionRect) {
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
      position={ (placement as any) || 'top' }
      offset={ offsetDistance }
      virtualReferenceRect={ selectionRect }
      clickOutsideIgnoreSelector={ `[${SELECTION_TOOLBAR_KEEP_OPEN_ATTR}="true"]` }
      content={
        <div
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
