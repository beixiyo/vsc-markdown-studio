import type React from 'react'
import { Button, Textarea } from 'comps'
import { useT } from 'i18n/react'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react'
import { CornerDownLeftIcon } from 'tiptap-comps/icons'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'

const InnerCommentMain = forwardRef<CommentMainRef, CommentMainProps>((props, ref) => {
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

  useImperativeHandle(ref, () => ({
    focus: () => {
      /** 延迟聚焦确保 Popover 动画完成后能够成功获取焦点 */
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    },
  }), [])

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
        'relative z-50 min-w-[320px] rounded-xl border border-border bg-background shadow-card backdrop-blur-md animate-in fade-in p-4 flex flex-col gap-3',
        className,
      ) }
      role="dialog"
      aria-label={ t('comment.addComment') }
      { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
    >
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

      <div className="flex items-center justify-between">
        <div className="text-xs text-text2">
          { t('comment.submitHint') }
        </div>
        <Button
          type="button"
          onClick={ createComment }
          tooltip={ t('comment.submitTooltip') }
          disabled={ !canCreate || !content.trim() }
          variant="primary"
          size="sm"
          leftIcon={ <CornerDownLeftIcon className="size-3" /> }
          className=""
        >
        </Button>
      </div>
    </div>
  )
})

InnerCommentMain.displayName = 'CommentMain'

export const CommentMain = memo(InnerCommentMain) as typeof InnerCommentMain

export type CommentMainRef = {
  focus: () => void
}

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
