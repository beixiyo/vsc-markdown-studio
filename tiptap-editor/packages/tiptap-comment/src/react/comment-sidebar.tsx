'use client'

import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../comment-store'
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'tiptap-comps'
import { useCommentLabels } from 'tiptap-api/react'
import { CloseIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'
import { CommentItem } from './components/comment-item'

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
  const isOpen = isControlled
    ? open as boolean
    : internalOpen
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const listRef = useRef<HTMLDivElement>(null)

  const commentsSource = useSyncExternalStore(
    listener => commentStore.subscribe(listener),
    () => commentStore.getSnapshot(),
    () => commentStore.getSnapshot(),
  )

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
  }, [activeCommentId, isOpen, comments.length])

  return (
    <Popover open={ isOpen } onOpenChange={ handleOpenChange }>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ labels.viewComments }
          className="flex items-center gap-2 rounded-full border border-border bg-background py-1 px-2 text-sm font-semibold text-systemBlue shadow-card transition-all hover:border-brand/50 hover:shadow-md"
        >
          <span className="text-base">💬</span>
          <span className="rounded-full text-xs font-semibold">
            { comments.length }
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        aria-label={ labels.commentPanel }
        align="end"
        className={ cn(
          'w-[380px] max-w-[calc(100vw-32px)] border border-border bg-background p-0 shadow-card',
          className,
        ) }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-systemBlue">
                { labels.commentPanel }
              </span>
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                { comments.length }
                {' '}
                { labels.items }
              </span>
            </div>

            <button
              type="button"
              onClick={ () => handleOpenChange(false) }
              aria-label={ labels.closePanel }
              className="flex size-6 items-center justify-center text-textSecondary transition-colors hover:bg-backgroundSecondary rounded-xl"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={ () => setStatusFilter('all') }
                className={ cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === 'all'
                    ? 'bg-brand text-white shadow-card'
                    : 'border border-border text-textSecondary hover:border-borderSecondary hover:bg-backgroundSecondary hover:text-brand',
                ) }
                aria-label={ labels.showAll }
              >
                { labels.all }
              </button>
              <button
                type="button"
                onClick={ () => setStatusFilter('active') }
                className={ cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === 'active'
                    ? 'bg-brand text-white shadow-card'
                    : 'border border-border text-textSecondary hover:border-borderSecondary hover:bg-backgroundSecondary hover:text-brand',
                ) }
                aria-label={ labels.showActive }
              >
                { labels.active }
              </button>
              <button
                type="button"
                onClick={ () => setStatusFilter('resolved') }
                className={ cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === 'resolved'
                    ? 'bg-brand text-white shadow-card'
                    : 'border border-border text-textSecondary hover:border-borderSecondary hover:bg-backgroundSecondary hover:text-brand',
                ) }
                aria-label={ labels.showResolved }
              >
                { labels.resolved }
              </button>
            </div>
            <span className="text-xs text-textSecondary">
              { labels.total(comments.length) }
            </span>
          </div>

          <div className="h-px w-full bg-border" />

          <div
            ref={ listRef }
            className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
          >
            { comments.length === 0
              ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-backgroundSecondary px-3 py-6 text-sm text-textSecondary">
                    { labels.empty }
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
      </PopoverContent>
    </Popover>
  )
})

CommentSidebar.displayName = 'CommentSidebar'
