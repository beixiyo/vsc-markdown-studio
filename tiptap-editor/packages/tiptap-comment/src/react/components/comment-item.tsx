import type { Editor } from '@tiptap/react'
import type { Comment, CommentAuthor, CommentStore } from '../../comment-store'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { scrollToRangeSelection } from 'tiptap-api'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'tiptap-comps'
import {
  useCommentLabels,
  useLanguage,
} from 'tiptap-api/react'
import { BanIcon, CornerDownLeftIcon, EditIcon, LocateIcon, TrashIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'
import { createReply, deleteComment, updateComment } from '../../comment'
import { commentPluginKey } from '../../plugin'
import { CommentEditDialog } from './comment-edit-dialog'
import { ReplyDialog } from './reply-dialog'

const activeHighlightClasses = [
  'comment-highlight-active',
  'bg-warning/20',
  'border-b-warning',
  'shadow-[0_0_0_2px_rgba(var(--warning),0.3)]',
]

/**
 * 单条评论展示属性
 */
export type CommentItemProps = {
  comment: Comment
  editor: Editor | null
  commentStore: CommentStore
  onUpdate: () => void
  isActive?: boolean
}

export const CommentItem = memo(({
  comment,
  editor,
  commentStore,
  onUpdate,
  isActive = false,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const labels = useCommentLabels()
  const { language } = useLanguage()

  const defaultAuthor: CommentAuthor = useMemo(() => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: `${labels.user}${Math.floor(Math.random() * 100)}`,
  }), [labels.user])

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
    const confirmed = confirm(labels.confirmDelete(preview))
    if (!confirmed)
      return
    deleteComment(editor, commentStore, comment.id)
  }, [editor, commentStore, comment.id, comment.content, labels])

  const handleEdit = useCallback(() => {
    setEditContent(comment.content)
    setIsEditing(true)
  }, [comment.content])

  const handleSaveEdit = useCallback(() => {
    if (!editContent.trim()) {
      console.warn(labels.contentEmpty)
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
      console.warn(labels.updateFailed)
    }
  }, [commentStore, comment.id, editContent, onUpdate, labels])

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
      console.warn(labels.updateStatusFailed)
    }
  }, [commentStore, comment.id, comment.status, onUpdate, labels.updateStatusFailed])

  const handleReply = useCallback(() => {
    setReplyContent('')
    setIsReplying(true)
  }, [])

  const handleCreateReply = useCallback(() => {
    if (!editor || !replyContent.trim()) {
      console.warn(labels.createReplyFailed)
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
      console.warn(labels.replyFailed)
    }
  }, [editor, commentStore, replyContent, comment.id, defaultAuthor, onUpdate, labels])

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
    return date.toLocaleString(language === 'zh-CN'
      ? 'zh-CN'
      : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const containerClass = cn(
    'rounded-2xl border border-border bg-background p-4 shadow-card transition-all hover:shadow-md',
    comment.status === 'resolved'
    && 'border-systemGreen/30 bg-systemGreen/5',
    isActive && 'border-brand shadow-lg',
  )
  const iconButtonClass = 'flex size-8 items-center justify-center rounded-lg border border-border text-textSecondary transition-all hover:border-borderSecondary hover:bg-backgroundSecondary disabled:cursor-not-allowed disabled:opacity-50'

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
    <div
      className={ containerClass }
      data-comment-id={ comment.id }
      data-active={ isActive
        ? 'true'
        : 'false' }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-systemBlue">
              { comment.author.name }
            </span>
            { comment.status === 'resolved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-systemGreen/10 px-2 py-0.5 text-[12px] font-semibold text-systemGreen">
                { labels.resolved }
              </span>
            ) }
          </div>
          <span className="text-xs text-textTertiary">
            { formatDate(comment.createdAt) }
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip delay={ 100 }>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={ handleJumpToComment }
                disabled={ comment.status === 'resolved' }
                className={ cn(
                  iconButtonClass,
                  comment.status === 'resolved' && 'cursor-not-allowed opacity-50',
                ) }
              >
                <LocateIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent portal={ false }>{ labels.locate }</TooltipContent>
          </Tooltip>

          { comment.status === 'active' && (
            <>
              <Tooltip delay={ 100 }>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={ handleEdit }
                    className={ iconButtonClass }
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent portal={ false }>{ labels.edit }</TooltipContent>
              </Tooltip>
              <Tooltip delay={ 100 }>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={ handleReply }
                    className={ iconButtonClass }
                  >
                    <CornerDownLeftIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent portal={ false }>{ labels.reply }</TooltipContent>
              </Tooltip>
            </>
          ) }

          <Tooltip delay={ 100 }>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={ handleToggleStatus }
                className={ iconButtonClass }
              >
                { comment.status === 'active'
                  ? (
                      <BanIcon className="h-4 w-4" />
                    )
                  : (
                      <TrashIcon className="h-4 w-4" />
                    )}
              </button>
            </TooltipTrigger>
            <TooltipContent portal={ false }>
              { comment.status === 'active'
                ? labels.markResolved
                : labels.reopen }
            </TooltipContent>
          </Tooltip>

          <Tooltip delay={ 100 }>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={ handleDelete }
                className={ iconButtonClass }
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent portal={ false }>{ labels.delete }</TooltipContent>
          </Tooltip>
        </div>
      </div>

      { comment.replyTo && comment.replyToAuthor && (
        <button
          type="button"
          onClick={ handleJumpToReplyTo }
          className="mt-3 flex w-full items-center gap-2 rounded-xl bg-backgroundSecondary px-3 py-2 text-left text-sm text-systemBlue transition-all hover:bg-borderSecondary"
        >
          <span className="text-[12px] font-semibold">
            @
            { comment.replyToAuthor.name }
          </span>
          <span className="text-textSecondary">
            { comment.replyToContent
              ? truncateReplyContent(comment.replyToContent)
              : truncateReplyContent(commentStore.getComment(comment.replyTo)?.content) }
          </span>
        </button>
      ) }

      <div className="mt-3 rounded-xl bg-backgroundSecondary px-3 py-2 text-sm leading-6 text-textSecondary">
        { comment.content }
      </div>
    </div>
  )
})

CommentItem.displayName = 'CommentItem'
