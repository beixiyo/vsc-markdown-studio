'use client'

import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../comment-store'
import {
  Button,
  Popover,
  type PopoverRef,
} from 'comps'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCommentLabels, useTiptapEditor } from 'tiptap-api/react'
import { CloseIcon } from 'tiptap-comps/icons'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { CommentItem } from './components/comment-item'
import { useComments } from './hooks'

/**
 * 评论侧边栏属性
 */
export interface CommentSidebarProps {
  commentStore: CommentStore
  editor?: Editor | null
  className?: string
  /**
   * 是否展示评论面板（受控）
   */
  open?: boolean
  /**
   * 默认展开状态（非受控）
   */
  defaultOpen?: boolean
  /**
   * 展开状态变更回调
   */
  onOpenChange?: (open: boolean) => void
  /**
   * 需要在列表中定位的评论 ID
   */
  activeCommentId?: string
}

/**
 * 评论侧边栏组件
 */
export const CommentSidebar = memo(({
  commentStore,
  editor: providedEditor,
  className,
  open,
  defaultOpen,
  onOpenChange,
  activeCommentId,
}: CommentSidebarProps) => {
  const { editor } = useTiptapEditor(providedEditor)
  const labels = useCommentLabels()
  const isControlled = typeof open === 'boolean'
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const popoverRef = useRef<PopoverRef>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const listRef = useRef<HTMLDivElement>(null)

  const commentsSource = useComments(commentStore)

  const comments = useMemo(() => {
    let allComments = commentsSource

    if (statusFilter === 'active') {
      allComments = commentStore.getCommentsByStatus('active')
    }
    else if (statusFilter === 'resolved') {
      allComments = commentStore.getCommentsByStatus('resolved')
    }

    return allComments.sort((a, b) => b.createdAt - a.createdAt)
  }, [commentStore, commentsSource, statusFilter])

  const handleUpdate = useCallback(() => {
    /** 由 Store 订阅触发重新渲染 */
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }, [isControlled, onOpenChange])

  useEffect(() => {
    if (isControlled) {
      if (open) {
        popoverRef.current?.open()
      }
      else {
        popoverRef.current?.close()
      }
    }
  }, [isControlled, open])

  useEffect(() => {
    const isOpen = isControlled
      ? open
      : internalOpen
    if (!isOpen || !activeCommentId) {
      return
    }

    const container = listRef.current
    if (!container) {
      return
    }

    const target = container.querySelector<HTMLElement>(`[data-comment-id="${activeCommentId}"]`)
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeCommentId, isControlled, open, internalOpen, comments.length])

  return (
    <Popover
      ref={ popoverRef }
      trigger={ isControlled
        ? 'command'
        : 'click' }
      onOpen={ () => handleOpenChange(true) }
      onClose={ () => handleOpenChange(false) }
      content={
        <div
          className={ cn(
            'w-[340px] max-w-[calc(100vw-32px)] flex flex-col gap-0 p-0',
            className,
          ) }
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-text">
                { labels.commentPanel }
              </span>
              <span className="rounded bg-background2 px-1.5 py-0.5 text-[11px] font-medium text-text2">
                { comments.length }
              </span>
            </div>

            <button
              type="button"
              onClick={ () => popoverRef.current?.close() }
              className="flex size-6 items-center justify-center rounded-md text-text3 transition-colors hover:bg-background2 hover:text-text"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-background2/30">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={ () => setStatusFilter('all') }
                variant={ statusFilter === 'all'
                  ? 'primary'
                  : 'ghost' }
                size="sm"
                className={ cn('h-7 px-2.5 text-[12px] font-medium rounded-md', statusFilter !== 'all' && 'text-text2 hover:text-text') }
              >
                { labels.all }
              </Button>
              <Button
                type="button"
                onClick={ () => setStatusFilter('active') }
                variant={ statusFilter === 'active'
                  ? 'primary'
                  : 'ghost' }
                size="sm"
                className={ cn('h-7 px-2.5 text-[12px] font-medium rounded-md', statusFilter !== 'active' && 'text-text2 hover:text-text') }
              >
                { labels.active }
              </Button>
              <Button
                type="button"
                onClick={ () => setStatusFilter('resolved') }
                variant={ statusFilter === 'resolved'
                  ? 'primary'
                  : 'ghost' }
                size="sm"
                className={ cn('h-7 px-2.5 text-[12px] font-medium rounded-md', statusFilter !== 'resolved' && 'text-text2 hover:text-text') }
              >
                { labels.resolved }
              </Button>
            </div>
          </div>

          <div
            ref={ listRef }
            className="max-h-[60vh] overflow-y-auto p-3 space-y-2"
          >
            { comments.length === 0
              ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text3">
                    <span className="text-[13px]">{ labels.empty }</span>
                  </div>
                )
              : (
                  comments.map(comment => (
                    <CommentItem
                      key={ comment.id }
                      comment={ comment }
                      editor={ editor }
                      commentStore={ commentStore }
                      onUpdate={ handleUpdate }
                      isActive={ activeCommentId === comment.id }
                    />
                  ))
                ) }
          </div>
        </div>
      }
      position="bottom"
    >
      <button
        type="button"
        onClick={ () => {
          if (isControlled) {
            handleOpenChange(!open)
          }
        } }
        aria-label={ labels.viewComments }
        className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-[13px] font-medium text-text2 hover:text-text hover:bg-background2 transition-colors border border-transparent"
      >
        <span className="opacity-80">💬</span>
        <span>
          { comments.length }
        </span>
      </button>
    </Popover>
  )
})

CommentSidebar.displayName = 'CommentSidebar'
