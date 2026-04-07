'use client'

import type { BlockActionMenuProps } from './types'
import { TextSelection } from '@tiptap/pm/state'
import { SafePortal } from 'comps'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getEditorElement } from 'tiptap-utils'
import { DragHandleIcon } from '../../icons'

export const BlockActionMenu = memo<BlockActionMenuProps>(({ editor, enabled = true }) => {
  const [hoverNodePos, setHoverNodePos] = useState<number | null>(null)
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideMenu = useCallback(() => {
    if (hideTimerRef.current)
      return
    hideTimerRef.current = setTimeout(() => {
      setPosition(null)
      setHoverNodePos(null)
      hideTimerRef.current = null
    }, 500) // 延迟 500ms 隐藏，给用户移动鼠标的时间
  }, [])

  const showMenu = useCallback((top: number, left: number, pos: number) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setPosition({ top, left })
    setHoverNodePos(pos)
  }, [])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!editor || !editor.view || !enabled) {
      hideMenu()
      return
    }

    const view = editor.view
    const coords = { left: event.clientX, top: event.clientY }
    const pos = view.posAtCoords(coords)

    if (!pos) {
      hideMenu()
      return
    }

    const $pos = view.state.doc.resolve(pos.pos)
    let blockPos = -1

    /** 查找最近的块级节点 */
    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth)
      if (node.isBlock) {
        blockPos = $pos.before(depth)
        break
      }
    }

    if (blockPos !== -1) {
      const dom = view.nodeDOM(blockPos) as HTMLElement
      if (dom && dom.getBoundingClientRect) {
        const rect = dom.getBoundingClientRect()
        const editorRect = getEditorElement(editor)?.getBoundingClientRect()

        if (editorRect) {
          /** 定位在块的左侧 */
          showMenu(
            rect.top,
            editorRect.left - 24, // 编辑器左边缘向外偏移 24px
            blockPos,
          )
        }
      }
    }
    else {
      hideMenu()
    }
  }, [editor, enabled, hideMenu, showMenu])

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    /** 如果移动到了拖拽手柄本身，不隐藏 */
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('[data-block-action-menu]')) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      return
    }
    hideMenu()
  }, [hideMenu])

  useEffect(() => {
    if (!editor || !enabled)
      return
    const element = getEditorElement(editor)
    if (!element)
      return

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, enabled, handleMouseMove, handleMouseLeave])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  if (!enabled || !position || hoverNodePos === null || !editor) {
    return null
  }

  return (
    <SafePortal>
      <div
        data-block-action-menu="true"
        className="fixed z-50 flex items-center justify-center w-5 h-6 cursor-pointer text-text2 hover:bg-background2 hover:text-text rounded transition-colors"
        style={ {
          top: position.top,
          left: position.left,
        } }
        onClick={ () => {
          /** 选中该块的文本内容 */
          const node = editor.state.doc.nodeAt(hoverNodePos)

          if (node) {
            const selection = TextSelection.create(editor.state.doc, hoverNodePos, hoverNodePos + node.nodeSize)
            editor.view.dispatch(editor.state.tr.setSelection(selection))
            editor.view.focus()
          }
        } }
        onMouseEnter={ () => {
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
          }
        } }
        onMouseLeave={ (e) => {
          /** 如果移动回编辑器，不立即隐藏，由编辑器的 mousemove/mouseleave 处理 */
          const relatedTarget = e.relatedTarget as HTMLElement
          if (relatedTarget && relatedTarget.closest('.tiptap')) {
            return
          }
          hideMenu()
        } }
      >
        <DragHandleIcon />
      </div>
    </SafePortal>
  )
})

BlockActionMenu.displayName = 'BlockActionMenu'
