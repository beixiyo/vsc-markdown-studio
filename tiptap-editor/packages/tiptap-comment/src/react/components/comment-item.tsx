import type { Editor } from '@tiptap/react'
import type { Comment, CommentAuthor, CommentStore } from '../../comment-store'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { scrollToRangeSelection } from 'tiptap-api'
import { BanIcon, TrashIcon } from 'tiptap-comps/icons'
import { cn } from 'tiptap-config'
import { createReply, deleteComment, updateComment } from '../../comment'
import { commentPluginKey } from '../../plugin'
import { CommentEditDialog } from './comment-edit-dialog'
import { ReplyDialog } from './reply-dialog'

const activeHighlightClasses = [
  'comment-highlight-active',
  'bg-[var(--tt-color-highlight-yellow-contrast)]',
  'border-b-[var(--tt-color-yellow-dec-2)]',
  'shadow-[0_0_0_2px_var(--tt-color-yellow-dec-3)]',
]

/**
 * 单条评论展示属性
 */
export type CommentItemProps = {
  comment: Comment
  editor: Editor | null
  commentStore: CommentStore
  onUpdate: () => void
}

export const CommentItem = memo(({
  comment,
  editor,
  commentStore,
  onUpdate,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const defaultAuthor: CommentAuthor = useMemo(() => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: `用户${Math.floor(Math.random() * 100)}`,
  }), [])

  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content)
    }
  }, [comment.content, isEditing])

  const handleJumpToComment = useCallback(() => {
    if (!editor)
      return

    const pluginState = commentPluginKey.getState(editor.state)
    const range = pluginState?.ranges.get(comment.id)

    if (range) {
      scrollToRangeSelection(editor, range.from, range.to, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      setTimeout(() => {
        const editorElement = editor.view.dom
        const commentElements = editorElement.querySelectorAll(
          `[data-comment-id="${comment.id}"]`,
        )

        commentElements.forEach((element) => {
          activeHighlightClasses.forEach(cls => element.classList.add(cls))
        })

        setTimeout(() => {
          commentElements.forEach((element) => {
            activeHighlightClasses.forEach(cls => element.classList.remove(cls))
          })
        }, 3000)
      }, 100)
    }
  }, [editor, comment.id])

  const handleDelete = useCallback(() => {
    if (!editor)
      return
    const preview = comment.content.substring(0, 20)
    const confirmed = confirm(`确定要删除评论 "${preview}..." 吗？`)
    if (!confirmed)
      return
    deleteComment(editor, commentStore, comment.id)
  }, [editor, commentStore, comment.id, comment.content])

  const handleEdit = useCallback(() => {
    setEditContent(comment.content)
    setIsEditing(true)
  }, [comment.content])

  const handleSaveEdit = useCallback(() => {
    if (!editContent.trim()) {
      console.warn('评论内容不能为空')
      return
    }

    const newContent = editContent.trim()

    const success = updateComment(commentStore, comment.id, {
      content: newContent,
    })

    if (success) {
      setIsEditing(false)
      onUpdate()
    }
    else {
      console.warn('更新评论失败')
    }
  }, [commentStore, comment.id, editContent, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditContent(comment.content)
    setIsEditing(false)
  }, [comment.content])

  const handleToggleStatus = useCallback(() => {
    const newStatus: Comment['status'] = comment.status === 'active'
      ? 'resolved'
      : 'active'
    const success = updateComment(commentStore, comment.id, {
      status: newStatus,
    })

    if (success) {
      onUpdate()
    }
    else {
      console.warn('更新评论状态失败')
    }
  }, [commentStore, comment.id, comment.status, onUpdate])

  const handleReply = useCallback(() => {
    setReplyContent('')
    setIsReplying(true)
  }, [])

  const handleCreateReply = useCallback(() => {
    if (!editor || !replyContent.trim()) {
      console.warn('无法创建回复：编辑器未初始化或回复内容为空')
      return
    }

    const reply = createReply(editor, commentStore, {
      content: replyContent.trim(),
      author: defaultAuthor,
      replyToId: comment.id,
    })

    if (reply) {
      setReplyContent('')
      setIsReplying(false)
      onUpdate()
    }
    else {
      console.warn('回复创建失败')
    }
  }, [editor, commentStore, replyContent, comment.id, defaultAuthor, onUpdate])

  const handleCancelReply = useCallback(() => {
    setReplyContent('')
    setIsReplying(false)
  }, [])

  const handleJumpToReplyTo = useCallback(() => {
    if (!editor || !comment.replyTo)
      return

    const pluginState = commentPluginKey.getState(editor.state)
    const range = pluginState?.ranges.get(comment.replyTo)

    if (range) {
      scrollToRangeSelection(editor, range.from, range.to, {
        behavior: 'smooth',
        block: 'center',
        setSelection: true,
      })

      setTimeout(() => {
        const editorElement = editor.view.dom
        const commentElements = editorElement.querySelectorAll(
          `[data-comment-id="${comment.replyTo}"]`,
        )

        commentElements.forEach((element) => {
          activeHighlightClasses.forEach(cls => element.classList.add(cls))
        })

        setTimeout(() => {
          commentElements.forEach((element) => {
            activeHighlightClasses.forEach(cls => element.classList.remove(cls))
          })
        }, 3000)
      }, 100)
    }
  }, [editor, comment.replyTo])

  const truncateReplyContent = useCallback((content: string | undefined): string => {
    if (!content)
      return ''
    return content.length > 50
      ? `${content.substring(0, 50)}...`
      : content
  }, [])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const containerClass = cn(
    'rounded-2xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] p-4 shadow-[var(--tt-shadow-elevated-md)] transition duration-[var(--tt-transition-duration-default)] hover:shadow-[var(--tt-shadow-elevated-md)]',
    comment.status === 'resolved'
    && 'border-[var(--tt-color-green-inc-3)] bg-[var(--tt-color-green-inc-5)]/70',
  )

  if (isEditing) {
    return (
      <div className={ containerClass }>
        <CommentEditDialog
          content={ editContent }
          setContent={ setEditContent }
          onSave={ handleSaveEdit }
          onCancel={ handleCancelEdit }
          canSave={ editContent.trim() !== comment.content.trim() }
        />
      </div>
    )
  }

  if (isReplying) {
    const replyToPreview = comment.content.length > 50
      ? `${comment.content.substring(0, 50)}...`
      : comment.content

    return (
      <div className={ containerClass }>
        <ReplyDialog
          content={ replyContent }
          setContent={ setReplyContent }
          onCreate={ handleCreateReply }
          onCancel={ handleCancelReply }
          canCreate={ !!replyContent.trim() }
          replyToPreview={ `@${comment.author.name}: ${replyToPreview}` }
        />
      </div>
    )
  }

  return (
    <div className={ containerClass }>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--tt-color-text-blue)]">
              { comment.author.name }
            </span>
            { comment.status === 'resolved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tt-color-green-inc-4)] px-2 py-0.5 text-[12px] font-semibold text-[var(--tt-color-green-dec-2)]">
                已解决
              </span>
            ) }
          </div>
          <span className="text-xs text-[var(--tt-color-text-gray)]">
            { formatDate(comment.createdAt) }
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={ handleJumpToComment }
            disabled={ comment.status === 'resolved' }
            className={ cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)] disabled:cursor-not-allowed disabled:opacity-50',
              comment.status === 'resolved' && 'cursor-not-allowed opacity-50',
            ) }
            aria-label="跳转到评论位置"
            title="跳转到评论位置"
          >
            <span className="text-[11px] font-semibold">定位</span>
          </button>

          { comment.status === 'active' && (
            <>
              <button
                type="button"
                onClick={ handleEdit }
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)]"
                aria-label="编辑评论"
                title="编辑评论"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={ handleReply }
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)]"
                aria-label="回复评论"
                title="回复评论"
              >
                回复
              </button>
            </>
          ) }

          <button
            type="button"
            onClick={ handleToggleStatus }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={ comment.status === 'active'
              ? '已解决'
              : '重新打开' }
            title={ comment.status === 'active'
              ? '标记为已解决'
              : '重新打开' }
          >
            { comment.status === 'active'
              ? (
                  <BanIcon className="h-4 w-4" />
                )
              : (
                  <TrashIcon className="h-4 w-4" />
                )}
          </button>

          <button
            type="button"
            onClick={ handleDelete }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--tt-border-color)] text-[var(--tt-color-text-gray)] transition duration-[var(--tt-transition-duration-default)] hover:border-[var(--tt-border-color-tint)] hover:bg-[var(--tt-border-color-tint)] hover:text-[var(--tt-brand-color-600)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="永久删除评论"
            title="永久删除评论"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      { comment.replyTo && comment.replyToAuthor && (
        <button
          type="button"
          onClick={ handleJumpToReplyTo }
          className="mt-3 flex w-full items-center gap-2 rounded-xl bg-[var(--tt-color-highlight-blue)] px-3 py-2 text-left text-sm text-[var(--tt-color-text-blue)] transition duration-[var(--tt-transition-duration-default)] hover:bg-[var(--tt-border-color-tint)]"
          aria-label={ `跳转到被回复的评论：${comment.replyToAuthor.name}` }
        >
          <span className="text-[12px] font-semibold">
            @
            { comment.replyToAuthor.name }
          </span>
          <span className="text-[var(--tt-color-text-gray)]">
            { comment.replyToContent
              ? truncateReplyContent(comment.replyToContent)
              : truncateReplyContent(commentStore.getComment(comment.replyTo)?.content) }
          </span>
        </button>
      ) }

      <div className="mt-3 rounded-xl bg-[var(--tt-color-highlight-gray)] px-3 py-2 text-sm leading-6 text-[var(--tt-color-text-gray)]">
        { comment.content }
      </div>
    </div>
  )
})

CommentItem.displayName = 'CommentItem'
