import type React from 'react'
import { memo } from 'react'
import { Button } from 'tiptap-comps'
import { useCommentLabels } from 'tiptap-api/react'
import { CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'

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
  const labels = useCommentLabels()
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
        'flex flex-col gap-3 rounded-2xl bg-background',
      ) }
    >
      { replyToPreview && (
        <div className="flex items-start gap-2 rounded-xl bg-toningYellowBgColor px-3 py-2 text-sm text-textSecondary shadow-inner">
          <span className="text-textTertiary">↩︎</span>
          <span className="leading-6">{ replyToPreview }</span>
        </div>
      ) }

      <textarea
        className="min-h-[84px] w-full rounded-xl bg-backgroundSecondary px-3 py-2 text-sm text-textPrimary outline-none ring-0 transition-all"
        placeholder={ labels.replyPlaceholder }
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
          aria-label={ labels.cancelTooltip }
          showTooltip={ false }
          className="flex h-9 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-textSecondary transition-all hover:bg-backgroundSecondary"
        >
          <CloseIcon className="h-4 w-4" />
          { labels.cancel }
        </Button>
        <Button
          type="button"
          onClick={ onCreate }
          aria-label={ labels.replyTooltip }
          showTooltip={ false }
          disabled={ !canCreate || !content.trim() }
          className="flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CornerDownLeftIcon className="h-4 w-4" />
          { labels.reply }
        </Button>
      </div>
    </div>
  )
})

ReplyDialog.displayName = 'ReplyDialog'
