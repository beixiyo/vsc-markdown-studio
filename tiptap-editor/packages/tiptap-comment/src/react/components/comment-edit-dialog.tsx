import type React from 'react'
import { Button, Textarea } from 'comps'
import { memo, useEffect, useRef } from 'react'
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
      <Textarea
        ref={ textareaRef }
        containerClassName="min-h-[96px] w-full"
        placeholder={ labels.placeholder }
        value={ content }
        onChange={ setContent }
        onKeyDown={ handleKeyDown }
        autoFocus
        rows={ 3 }
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
          onClick={ onSave }
          disabled={ !canSave || !content.trim() }
          variant="primary"
          size="sm"
          leftIcon={ <CornerDownLeftIcon className="h-4 w-4" /> }
        >
          { labels.save }
        </Button>
      </div>
    </div>
  )
})

CommentEditDialog.displayName = 'CommentEditDialog'
