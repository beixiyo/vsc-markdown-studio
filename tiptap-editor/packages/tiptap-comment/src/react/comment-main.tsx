import type React from 'react'
import { memo, useCallback } from 'react'
import { CloseIcon, CornerDownLeftIcon } from 'tiptap-comps/icons'
import { Button } from 'tiptap-comps'
import { cn } from 'tiptap-config'

export type CommentMainProps = {
  /**
   * 评论内容
   */
  content: string
  /**
   * 设置评论内容
   */
  setContent: React.Dispatch<React.SetStateAction<string>>
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
  const {
    content,
    setContent,
    createComment,
    cancel,
    canCreate,
    className,
  } = props

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
        'relative z-50 min-w-[320px] max-w-[400px] rounded-[var(--tt-radius-lg)] border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] shadow-[var(--tt-shadow-elevated-md)] backdrop-blur-[12px] animate-[fadeIn_var(--tt-transition-duration-default)_var(--tt-transition-easing-default)] max-[480px]:min-w-[280px] max-[480px]:max-w-[320px]',
        className,
      ) }
      role="dialog"
      aria-label="添加评论"
    >
      <div className="flex flex-col gap-3 p-4 max-[480px]:p-3">
        <div className="text-sm font-semibold text-[var(--tt-color-text-primary)]">添加评论</div>
        <textarea
          className="min-h-[80px] w-full resize-y rounded-[var(--tt-radius-md)] border border-[var(--tt-border-color)] bg-[var(--tt-color-surface-default)] p-3 text-sm leading-6 text-[var(--tt-color-text-primary)] transition-[border-color,box-shadow] duration-[var(--tt-transition-duration-default)] ease-[var(--tt-transition-easing-default)] placeholder:text-[var(--tt-color-text-tertiary)] focus:border-[var(--tt-brand-color-500)] focus:shadow-[0_0_0_3px_var(--tt-selection-color)] focus:outline-none"
          placeholder="输入评论内容..."
          value={ content }
          onChange={ event => setContent(event.target.value) }
          onKeyDown={ handleKeyDown }
          autoFocus
          rows={ 3 }
        />
        <div className="text-xs text-[var(--tt-color-text-secondary)]">
          按 Ctrl/Cmd + Enter 提交，Esc 取消
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-t-[var(--tt-border-color-tint)] px-4 py-3 max-[480px]:px-3 max-[480px]:py-2.5">
        <div className="inline-flex items-center">
          <Button
            type="button"
            onClick={ createComment }
            title="创建评论 (Ctrl/Cmd + Enter)"
            disabled={ !canCreate || !content.trim() }
            data-style="primary"
            className="inline-flex items-center gap-2 font-semibold"
          >
            <CornerDownLeftIcon className="h-4 w-4" />
            提交评论
          </Button>
        </div>

        <Button
          type="button"
          onClick={ cancel }
          title="取消 (Esc)"
          data-style="ghost"
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--tt-radius-md)] px-2.5 py-2"
        >
          <CloseIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

CommentMain.displayName = 'CommentMain'
