import type React from 'react'
import { Button, Textarea } from 'comps'
import { memo, useEffect, useRef } from 'react'
import { useCommentLabels } from 'tiptap-api/react'
import { CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'

/**
 * 回复弹窗属性
 */
export type ReplyDialogProps = {
  content: string
  setContent: (content: string) => void
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

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
        <div className="flex items-start gap-2 rounded-xl bg-toningYellowBgColor px-3 py-2 text-sm text-text2 shadow-inner">
          <span className="text-text3">↩︎</span>
          <span className="leading-6">{ replyToPreview }</span>
        </div>
      ) }

      <Textarea
        ref={ textareaRef }
        containerClassName="min-h-[84px] w-full"
        placeholder={ labels.replyPlaceholder }
        value={ content }
        onChange={ setContent }
        onKeyDown={ handleKeyDown }
        autoFocus
        rows={ 3 }
        size="sm"
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          onClick={ onCancel }
          variant="ghost"
          size="sm"
          leftIcon={ <CloseIcon className="h-4 w-4" /> }
        >
          { labels.cancel }
        </Button>
        <Button
          type="button"
          onClick={ onCreate }
          variant="primary"
          size="sm"
          disabled={ !canCreate || !content.trim() }
          leftIcon={ <CornerDownLeftIcon className="h-4 w-4" /> }
        >
          { labels.reply }
        </Button>
      </div>
    </div>
  )
})

ReplyDialog.displayName = 'ReplyDialog'
