import type React from 'react'
import { memo } from 'react'
import { useCommentLabels } from 'tiptap-api/react'
import { CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'

/**
 * 评论编辑弹窗属性
 */
export type CommentEditDialogProps = {
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
  onSave: () => void
  onCancel: () => void
  canSave: boolean
}

export const CommentEditDialog = memo(({
  content,
  setContent,
  onSave,
  onCancel,
  canSave,
}: CommentEditDialogProps) => {
  const labels = useCommentLabels()
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      if (canSave && content.trim()) {
        onSave()
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
        'flex flex-col gap-4 bg-background',
      ) }
    >
      <textarea
        className="min-h-[96px] w-full rounded-xl bg-backgroundSecondary px-4 py-3 text-sm text-textPrimary outline-none ring-0 transition-all"
        placeholder={ labels.placeholder }
        value={ content }
        onChange={ e => setContent(e.target.value) }
        onKeyDown={ handleKeyDown }
        autoFocus
        rows={ 3 }
      />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={ onCancel }
          title={ labels.cancelTooltip }
          className="flex h-9 items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-textSecondary transition-all hover:bg-backgroundSecondary"
        >
          <CloseIcon className="h-4 w-4" />
          { labels.cancel }
        </button>
        <button
          type="button"
          onClick={ onSave }
          title={ labels.saveTooltip }
          disabled={ !canSave || !content.trim() }
          className="flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CornerDownLeftIcon className="h-4 w-4" />
          { labels.save }
        </button>
      </div>
    </div>
  )
})

CommentEditDialog.displayName = 'CommentEditDialog'
