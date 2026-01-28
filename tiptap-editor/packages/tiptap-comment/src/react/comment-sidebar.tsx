'use client'

import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../comment-store'
import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import {
  Button,
  Popover,
  type PopoverRef,
} from 'comps'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
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
  const popoverRef = useRef<PopoverRef>(null)

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
    const isOpen = isControlled ? open : internalOpen
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
      trigger={ isControlled ? 'command' : 'click' }
      onOpen={ () => handleOpenChange(true) }
      onClose={ () => handleOpenChange(false) }
      content={
        <div
          className={ cn(
            'w-[380px] max-w-[calc(100vw-32px)] flex flex-col gap-4 p-4',
            className,
          ) }
          { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
        >
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

            <Button
              type="button"
              onClick={ () => popoverRef.current?.close() }
              variant="ghost"
              size="sm"
              className="size-6"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={ () => setStatusFilter('all') }
                variant={ statusFilter === 'all' ? 'primary' : 'default' }
                size="sm"
                className="rounded-full px-3"
              >
                { labels.all }
              </Button>
              <Button
                type="button"
                onClick={ () => setStatusFilter('active') }
                variant={ statusFilter === 'active' ? 'primary' : 'default' }
                size="sm"
                className="rounded-full px-3"
              >
                { labels.active }
              </Button>
              <Button
                type="button"
                onClick={ () => setStatusFilter('resolved') }
                variant={ statusFilter === 'resolved' ? 'primary' : 'default' }
                size="sm"
                className="rounded-full px-3"
              >
                { labels.resolved }
              </Button>
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
      }
      position="bottom"
    >
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
    </Popover>
  )
})

CommentSidebar.displayName = 'CommentSidebar'
