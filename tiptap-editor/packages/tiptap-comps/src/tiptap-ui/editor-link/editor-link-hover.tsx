'use client'

import type { Editor } from '@tiptap/react'
import type { PopoverRef } from 'comps'
import { Popover } from 'comps'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { getEditorElement, normalizeLinkUrl, sanitizeUrl } from 'tiptap-utils'
import { EditorLinkPanel } from './editor-link-panel'

export const EditorLinkHover = memo<EditorLinkHoverProps>(({
  editor: providedEditor,
  enabled = true,
  closeDelay = 500,
  offsetDistance = 8,
  placement = 'top',
  onOpenChange,
}) => {
  const { editor } = useTiptapEditor(providedEditor)
  const popoverRef = useRef<PopoverRef>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hoverLinkRef = useRef<HTMLAnchorElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const [url, setUrl] = useState('')
  const [referenceRect, setReferenceRect] = useState<DOMRect | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const linkMarkType = useMemo(() => {
    if (!editor) {
      return null
    }
    return editor.state.schema.marks.link ?? null
  }, [editor])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closePopover = useCallback(() => {
    clearCloseTimer()
    popoverRef.current?.close()
    setIsOpen(false)
    hoverLinkRef.current = null
    setReferenceRect(null)
    onOpenChange?.(false)
  }, [clearCloseTimer, onOpenChange])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      closePopover()
    }, closeDelay)
  }, [clearCloseTimer, closeDelay, closePopover])

  const openPopover = useCallback(() => {
    clearCloseTimer()
    popoverRef.current?.open()
    setIsOpen(true)
    onOpenChange?.(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [clearCloseTimer, onOpenChange])

  const updateReferenceRect = useCallback(() => {
    const linkEl = hoverLinkRef.current
    if (!linkEl) {
      return
    }
    const rect = linkEl.getBoundingClientRect()
    setReferenceRect(rect)
  }, [])

  const getTextNodes = useCallback((node: Node) => {
    const nodes: Text[] = []
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    let current = walker.nextNode()
    while (current) {
      nodes.push(current as Text)
      current = walker.nextNode()
    }
    return nodes
  }, [])

  const getLinkRange = useCallback(() => {
    if (!editor) {
      return null
    }
    const linkEl = hoverLinkRef.current
    if (!linkEl) {
      return null
    }

    const textNodes = getTextNodes(linkEl)
    if (!textNodes.length) {
      try {
        const from = editor.view.posAtDOM(linkEl, 0)
        const to = editor.view.posAtDOM(linkEl, linkEl.childNodes.length)
        return { from, to }
      }
      catch {
        return null
      }
    }

    try {
      const from = editor.view.posAtDOM(textNodes[0], 0)
      const last = textNodes[textNodes.length - 1]
      const to = editor.view.posAtDOM(last, last.textContent?.length ?? 0)
      return { from, to }
    }
    catch {
      return null
    }
  }, [editor, getTextNodes])

  const applyLink = useCallback(() => {
    if (!editor || !linkMarkType) {
      return
    }
    if (!url) {
      return
    }
    const range = getLinkRange()
    if (!range) {
      return
    }

    const hrefToStore = normalizeLinkUrl(url) || url
    const tr = editor.state.tr
      .addMark(range.from, range.to, linkMarkType.create({ href: hrefToStore }))
    editor.view.dispatch(tr)
  }, [editor, getLinkRange, linkMarkType, url])

  const removeLink = useCallback(() => {
    if (!editor || !linkMarkType) {
      return
    }
    const range = getLinkRange()
    if (!range) {
      return
    }
    const tr = editor.state.tr.removeMark(range.from, range.to, linkMarkType)
    editor.view.dispatch(tr)
    setUrl('')
  }, [editor, getLinkRange, linkMarkType])

  const openLink = useCallback(() => {
    if (!url) {
      return
    }
    const safeUrl = sanitizeUrl(url, window.location.href)
    if (safeUrl !== '#') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer')
    }
  }, [url])

  const handleMouseOver = useCallback((event: MouseEvent) => {
    if (!editor || !enabled || !linkMarkType) {
      return
    }
    const target = event.target as HTMLElement | null
    if (!target) {
      return
    }
    const linkEl = target.closest('a') as HTMLAnchorElement | null
    if (!linkEl) {
      return
    }
    const editorElement = getEditorElement(editor)
    if (!editorElement) {
      return
    }
    if (!editorElement.contains(linkEl)) {
      return
    }
    if (hoverLinkRef.current === linkEl) {
      return
    }

    hoverLinkRef.current = linkEl
    setUrl(linkEl.getAttribute('href') ?? '')
    updateReferenceRect()
    openPopover()
  }, [editor, enabled, linkMarkType, openPopover, updateReferenceRect])

  const handleMouseOut = useCallback((event: MouseEvent) => {
    if (!enabled) {
      return
    }
    const target = event.target as HTMLElement | null
    if (!target) {
      return
    }
    const related = event.relatedTarget as HTMLElement | null
    const linkEl = hoverLinkRef.current
    if (!linkEl) {
      return
    }
    if (related && (linkEl.contains(related) || contentRef.current?.contains(related))) {
      return
    }
    scheduleClose()
  }, [enabled, scheduleClose])

  useEffect(() => {
    if (!editor || !enabled) {
      return
    }
    const editorElement = getEditorElement(editor)
    if (!editorElement) {
      return
    }
    editorElement.addEventListener('mouseover', handleMouseOver)
    editorElement.addEventListener('mouseout', handleMouseOut)

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver)
      editorElement.removeEventListener('mouseout', handleMouseOut)
    }
  }, [editor, enabled, handleMouseOut, handleMouseOver])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleScroll = () => {
      updateReferenceRect()
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen, updateReferenceRect])

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  if (!enabled) {
    return null
  }

  return (
    <Popover
      ref={ popoverRef }
      trigger="command"
      exitSetMode
      restoreFocusOnOpen={ false }
      position={ placement }
      offset={ offsetDistance }
      virtualReferenceRect={ referenceRect }
      contentClassName="p-0"
      content={
        <EditorLinkPanel
          ref={ contentRef }
          onMouseEnter={ clearCloseTimer }
          onMouseLeave={ scheduleClose }
          url={ url }
          setUrl={ setUrl }
          applyLink={ applyLink }
          removeLink={ removeLink }
          openLink={ openLink }
          isActive
          inputRef={ inputRef }
        />
      }
    >
      <div className="hidden" />
    </Popover>
  )
})

EditorLinkHover.displayName = 'EditorLinkHover'

export interface EditorLinkHoverProps {
  /** Tiptap 编辑器实例 */
  editor?: Editor | null
  /**
   * 是否启用 hover 交互
   * @default true
   */
  enabled?: boolean
  /**
   * 延迟关闭时间（毫秒）
   * @default 500
   */
  closeDelay?: number
  /**
   * Popover 偏移距离
   * @default 8
   */
  offsetDistance?: number
  /**
   * Popover 方向
   * @default 'top'
   */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Popover 打开/关闭状态变化回调 */
  onOpenChange?: (isOpen: boolean) => void
}
