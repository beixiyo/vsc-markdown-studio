import { memo } from 'react'
import type React from 'react'
import { cn } from 'tiptap-styles/utils'
import { CornerDownLeftIcon, CloseIcon } from 'tiptap-styles/icons'
import { useIsBreakpoint } from '../hooks/use-is-breakpoint'

/**
 * 回复弹窗属性
 */
export type ReplyDialogProps = {
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
  onCreate: () => void
  onCancel: () => void
  canCreate: boolean
  replyToPreview?: string
}

export const ReplyDialog = memo(({
  content,
  setContent,
  onCreate,
  onCancel,
  canCreate,
  replyToPreview,
}: ReplyDialogProps) => {
  const isMobile = useIsBreakpoint()

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (canCreate && content.trim()) {
        onCreate()
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)]',
        isMobile ? 'p-0 shadow-none' : 'p-4 shadow-[var(--tt-shadow-elevated-md)]'
      )}
    >
      { replyToPreview && (
        <div className="flex items-start gap-2 rounded-xl bg-[var(--tt-color-highlight-yellow)] px-3 py-2 text-sm text-[var(--tt-color-text-gray)] shadow-inner">
          <span className="text-[var(--tt-color-text-gray)]">↩︎</span>
          <span className="leading-6">{ replyToPreview }</span>
        </div>
      ) }

      <textarea
        className="min-h-[84px] w-full rounded-xl border border-[var(--tt-border-color)] bg-[var(--tt-sidebar-bg-color)] px-3 py-2 text-sm text-[var(--tt-color-text-gray)] outline-none ring-0 transition duration-[var(--tt-transition-duration-default)] focus:border-[var(--tt-brand-color-400)] focus:ring-2 focus:ring-[var(--tt-brand-color-100)]"
        placeholder="输入回复内容..."
        value={ content }
        onChange={ (e) => setContent(e.target.value) }
        onKeyDown={ handleKeyDown }
        autoFocus
        rows={ 3 }
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={ onCancel }
          title="取消 (Esc)"
          className="flex h-9 items-center gap-2 rounded-lg border border-[var(--tt-border-color)] px-3 text-sm font-medium text-[var(--tt-color-text-gray)] transition hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)]"
        >
          <CloseIcon className="h-4 w-4" />
          取消
        </button>
        <button
          type="button"
          onClick={ onCreate }
          title="创建回复 (Ctrl/Cmd + Enter)"
          disabled={ !canCreate || !content.trim() }
          className="flex h-9 items-center gap-2 rounded-lg bg-[var(--tt-brand-color-600)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--tt-brand-color-500)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CornerDownLeftIcon className="h-4 w-4" />
          回复
        </button>
      </div>
    </div>
  )
})

ReplyDialog.displayName = 'ReplyDialog'

