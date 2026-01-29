import type React from 'react'
import { Button, Textarea } from 'comps'
import { useT } from 'i18n/react'
import { memo, useCallback, useEffect, useRef } from 'react'
import { CornerDownLeftIcon } from 'tiptap-comps/icons'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'

export type CommentMainProps = {
  /**
   * 评论内容
   */
  content: string
  /**
   * 设置评论内容
   */
  setContent: (content: string) => void
  /**
   * 创建评论
   */
  createComment: () => void
  /**
   * 取消创建评论
   */
  cancel: () => void
  /**
   * 是否可以提交
   */
  canCreate: boolean
  /**
   * 自定义容器类名
   */
  className?: string
}

export const CommentMain = memo((props: CommentMainProps) => {
  const t = useT()
  const {
    content,
    setContent,
    createComment,
    cancel,
    canCreate,
    className,
  } = props

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        if (canCreate && content.trim()) {
          createComment()
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
      }
    },
    [cancel, canCreate, content, createComment],
  )

  return (
    <div
      className={ cn(
        'relative z-50 min-w-[320px] max-w-[400px] rounded-xl border border-border bg-background shadow-card backdrop-blur-[12px] animate-in fade-in max-[480px]:min-w-[280px] max-[480px]:max-w-[320px]',
        className,
      ) }
      role="dialog"
      aria-label={ t('comment.addComment') }
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
    >
      <div className="flex flex-col gap-3 p-4 max-[480px]:p-3">
        <div className="text-sm font-semibold text-textPrimary flex justify-between">
          <span>{ t('comment.addComment') }</span>
        </div>
        <Textarea
          ref={ textareaRef }
          containerClassName="min-h-[80px] w-full"
          placeholder={ t('comment.placeholder') }
          value={ content }
          onChange={ setContent }
          onKeyDown={ handleKeyDown }
          autoFocus
          rows={ 3 }
        />
        <div className="text-xs text-textSecondary">
          { t('comment.submitHint') }
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-borderSecondary px-4 py-3 max-[480px]:px-3 max-[480px]:py-2.5">
        <div className="inline-flex items-center">
          <Button
            type="button"
            onClick={ createComment }
            tooltip={ t('comment.submitTooltip') }
            disabled={ !canCreate || !content.trim() }
            variant="primary"
            leftIcon={ <CornerDownLeftIcon className="h-4 w-4" /> }
            className="font-semibold"
          >
            { t('comment.submit') }
          </Button>
        </div>
      </div>
    </div>
  )
})

CommentMain.displayName = 'CommentMain'
