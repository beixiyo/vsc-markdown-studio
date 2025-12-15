import type React from 'react'
import { memo } from 'react'
import { Button } from 'tiptap-comps'
import { CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'
import { cn } from 'tiptap-config'

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
      className={ cn(
        'flex flex-col gap-3 rounded-2xl bg-[var(--tt-card-bg-color)]',
      ) }
    >
      { replyToPreview && (
        <div className="flex items-start gap-2 rounded-xl bg-[var(--tt-color-highlight-yellow)] px-3 py-2 text-sm text-[var(--tt-color-text-gray)] shadow-inner">
          <span className="text-[var(--tt-color-text-gray)]">↩︎</span>
          <span className="leading-6">{ replyToPreview }</span>
        </div>
      ) }

      <textarea
        className="min-h-[84px] w-full rounded-xl bg-[var(--tt-sidebar-bg-color)] px-3 py-2 text-sm text-[var(--tt-color-text-gray)] outline-none ring-0 transition duration-[var(--tt-transition-duration-default)]"
        placeholder="输入回复内容..."
        value={ content }
        onChange={ e => setContent(e.target.value) }
        onKeyDown={ handleKeyDown }
        autoFocus
        rows={ 3 }
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          onClick={ onCancel }
          aria-label="取消 (Esc)"
          showTooltip={ false }
          className="flex h-9 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:bg-[var(--tt-border-color-tint)]"
        >
          <CloseIcon className="h-4 w-4" />
          取消
        </Button>
        <Button
          type="button"
          onClick={ onCreate }
          aria-label="创建回复 (Ctrl/Cmd + Enter)"
          showTooltip={ false }
          disabled={ !canCreate || !content.trim() }
          className="flex h-9 items-center gap-2 rounded-lg bg-[var(--tt-brand-color-600)] px-3 text-sm font-semibold text-white shadow-sm transition duration-[var(--tt-transition-duration-default)] hover:bg-[var(--tt-brand-color-500)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CornerDownLeftIcon className="h-4 w-4" />
          回复
        </Button>
      </div>
    </div>
  )
})

ReplyDialog.displayName = 'ReplyDialog'
