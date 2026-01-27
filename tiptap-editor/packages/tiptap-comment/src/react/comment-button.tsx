import type { CommentButtonProps } from './comment-button.types'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { Button, Popover, type PopoverRef } from 'comps'
import { canCreateComment, createComment } from '../comment'
import { type CommentAuthor, CommentStore } from '../comment-store'
import { CommentMain } from './components/comment-main'

/**
 * 评论创建按钮组件
 */
export const CommentButton = forwardRef<HTMLButtonElement, CommentButtonProps>(
  (
    {
      commentStore: providedCommentStore,
      author: providedAuthor,
      onCommentCreated,
      onOpenChange,
      onClick: _onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor()
    const [content, setContent] = useState('')
    const popoverRef = useRef<PopoverRef>(null)

    const [tempStore] = useState(
      () => providedCommentStore || new CommentStore(),
    )
    const commentStore = providedCommentStore || tempStore

    const defaultAuthor: CommentAuthor = {
      id: 'user-1',
      name: '测试用户',
    }
    const author = providedAuthor || defaultAuthor

    const handleCreateComment = useCallback(() => {
      if (!editor) {
        console.warn('编辑器未初始化')
        return
      }

      if (!canCreateComment(editor)) {
        console.warn('无法创建评论：未选中文本')
        return
      }

      if (!content.trim()) {
        console.warn('评论内容不能为空')
        return
      }

      const comment = createComment(editor, commentStore, {
        content: content.trim(),
        author,
      })

      if (comment) {
        onCommentCreated?.({
          id: comment.id,
          content: comment.content,
        })
        setContent('')
        popoverRef.current?.close()
      }
      else {
        console.warn('评论创建失败')
      }
    }, [editor, commentStore, content, author, onCommentCreated])

    const handleCancel = useCallback(() => {
      setContent('')
      popoverRef.current?.close()
    }, [])

    const canCreate = editor
      ? canCreateComment(editor)
      : false

    useEffect(() => {
      if (editor && !canCreate) {
        popoverRef.current?.close()
      }
    }, [editor, canCreate])

    return (
      <Popover
        ref={ popoverRef }
        trigger="click"
        onOpen={ () => onOpenChange?.(true) }
        onClose={ () => onOpenChange?.(false) }
        content={
          <CommentMain
            content={ content }
            setContent={ setContent }
            createComment={ handleCreateComment }
            cancel={ handleCancel }
            canCreate={ canCreate && !!content.trim() }
          />
        }
      >
        <Button
          type="button"
          variant="ghost"
          role="button"
          tabIndex={ -1 }
          aria-label="添加评论"
          tooltip="添加评论（选中文本后点击）"
          disabled={ !canCreate }
          { ...buttonProps }
          ref={ ref }
          size="sm"
        >
          { children ?? <span>💬</span> }
        </Button>
      </Popover>
    )
  },
)

CommentButton.displayName = 'CommentButton'

CommentButton.displayName = 'CommentButton'
