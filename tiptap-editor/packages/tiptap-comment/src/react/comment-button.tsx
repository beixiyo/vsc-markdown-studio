import type React from 'react'
import type { CommentButtonProps } from './comment-button.types'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
} from '@floating-ui/react'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useTiptapEditor } from 'tiptap-api/react'
import { Button } from 'tiptap-comps'
import { canCreateComment, createComment } from '../comment'
import { type CommentAuthor, CommentStore } from '../comment-store'
import { CommentMain } from './comment-main'

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
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor()
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState('')
    const buttonRef = useRef<HTMLButtonElement>(null)

    const [tempStore] = useState(
      () => providedCommentStore || new CommentStore(),
    )
    const commentStore = providedCommentStore || tempStore

    const defaultAuthor: CommentAuthor = {
      id: 'user-1',
      name: '测试用户',
    }
    const author = providedAuthor || defaultAuthor

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: (open) => {
        setIsOpen(open)
        onOpenChange?.(open)
      },
      placement: 'bottom-start',
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(8),
        flip({
          padding: 8,
        }),
        shift({ padding: 8 }),
      ],
    })

    const dismiss = useDismiss(context)
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss])

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
        setIsOpen(false)
        onOpenChange?.(false)
      }
      else {
        console.warn('评论创建失败')
      }
    }, [editor, commentStore, content, author, onCommentCreated, onOpenChange])

    const handleCancel = useCallback(() => {
      setContent('')
      setIsOpen(false)
      onOpenChange?.(false)
    }, [onOpenChange])

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return

        if (!editor) {
          console.warn('编辑器未初始化')
          return
        }

        if (!canCreateComment(editor)) {
          console.warn('请先选中要评论的文本')
          return
        }

        const newIsOpen = !isOpen
        setIsOpen(newIsOpen)
        onOpenChange?.(newIsOpen)
      },
      [onClick, editor, isOpen, onOpenChange],
    )

    useEffect(() => {
      if (isOpen && editor) {
        if (!canCreateComment(editor)) {
          setIsOpen(false)
          onOpenChange?.(false)
        }
      }
    }, [isOpen, editor, onOpenChange])

    const canCreate = editor
      ? canCreateComment(editor)
      : false
    const mergedRef = useMergeRefs([ref, buttonRef, refs.setReference])

    return (
      <>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={ -1 }
          aria-label="添加评论"
          tooltip="添加评论（选中文本后点击）"
          onClick={ handleClick }
          disabled={ !canCreate }
          data-disabled={ !canCreate }
          data-active-state={ isOpen
            ? 'on'
            : 'off' }
          { ...buttonProps }
          { ...getReferenceProps() }
          ref={ mergedRef }
        >
          { children ?? <span>💬</span> }
        </Button>

        { isOpen && (
          <div
            ref={ refs.setFloating }
            style={ floatingStyles }
            { ...getFloatingProps() }
          >
            <CommentMain
              content={ content }
              setContent={ setContent }
              createComment={ handleCreateComment }
              cancel={ handleCancel }
              canCreate={ canCreate && !!content.trim() }
            />
          </div>
        ) }
      </>
    )
  },
)

CommentButton.displayName = 'CommentButton'
