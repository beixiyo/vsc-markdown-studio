'use client'

import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../comment-store'
import { memo, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'tiptap-styles/ui'
import { cn } from 'tiptap-styles/utils'
import { CommentItem } from './components/comment-item'

/**
 * 评论侧边栏属性
 */
export interface CommentSidebarProps {
  commentStore: CommentStore
  editor?: Editor | null
  className?: string
}

/**
 * 评论侧边栏组件
 */
export const CommentSidebar = memo(({
  commentStore,
  editor: providedEditor,
  className,
}: CommentSidebarProps) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')

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

  return (
    <Popover open={ isOpen } onOpenChange={ setIsOpen }>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="查看评论"
          className="flex items-center gap-2 rounded-full border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] py-1 px-2 text-sm font-semibold text-[var(--tt-color-text-blue)] shadow-[var(--tt-shadow-elevated-md)] transition duration-[var(--tt-transition-duration-default)] hover:border-[var(--tt-brand-color-400)] hover:shadow-[var(--tt-shadow-elevated-md)]"
        >
          <span className="text-base">💬</span>
          <span className="rounded-full text-xs font-semibold">
            { comments.length }
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        aria-label="评论列表"
        align="end"
        className={ cn(
          'w-[380px] max-w-[calc(100vw-32px)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] p-0 shadow-[var(--tt-shadow-elevated-md)]',
          className,
        ) }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[var(--tt-color-text-blue)]">
                评论面板
              </span>
              <span className="rounded-full bg-[var(--tt-brand-color-50)] px-2.5 py-1 text-xs font-semibold text-[var(--tt-brand-color-700)]">
                { comments.length }
                {' '}
                条
              </span>
            </div>
            <button
              type="button"
              onClick={ () => setIsOpen(false) }
              className="text-xs font-semibold text-[var(--tt-color-text-gray)] transition hover:text-[var(--tt-color-text-blue)]"
            >
              关闭
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
                    ? 'bg-[var(--tt-brand-color-500)] text-white shadow-[var(--tt-shadow-elevated-md)]'
                    : 'border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)]',
                ) }
                aria-label="显示所有评论"
              >
                全部
              </button>
              <button
                type="button"
                onClick={ () => setStatusFilter('active') }
                className={ cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === 'active'
                    ? 'bg-[var(--tt-brand-color-500)] text-white shadow-[var(--tt-shadow-elevated-md)]'
                    : 'border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)]',
                ) }
                aria-label="仅显示活跃评论"
              >
                活跃
              </button>
              <button
                type="button"
                onClick={ () => setStatusFilter('resolved') }
                className={ cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  statusFilter === 'resolved'
                    ? 'bg-[var(--tt-brand-color-500)] text-white shadow-[var(--tt-shadow-elevated-md)]'
                    : 'border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)]',
                ) }
                aria-label="仅显示已解决评论"
              >
                已解决
              </button>
            </div>
            <span className="text-xs text-[var(--tt-color-text-gray)]">
              共
              {' '}
              { comments.length }
              {' '}
              条
            </span>
          </div>

          <div className="h-px w-full bg-[var(--tt-border-color)]" />

          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            { comments.length === 0
              ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--tt-border-color)] bg-[var(--tt-sidebar-bg-color)] px-3 py-6 text-sm text-[var(--tt-color-text-gray)]">
                    暂无评论，开始第一条讨论吧
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
