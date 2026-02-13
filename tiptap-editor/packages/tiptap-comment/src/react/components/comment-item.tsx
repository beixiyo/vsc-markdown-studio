import type { Editor } from '@tiptap/react'
import type { Comment, CommentAuthor, CommentStore } from '../../comment-store'
import { formatDate } from '@jl-org/tool'
import {
  Button,
  Modal,
} from 'comps'
import { memo, useMemo } from 'react'
import {
  useCommentLabels,
  useLanguage,
} from 'tiptap-api/react'
import { BanIcon, CornerDownLeftIcon, EditIcon, LocateIcon, TrashIcon } from 'tiptap-comps/icons'
import { cn } from 'utils'
import { useCommentItemLogic } from '../hooks/use-comment-item-logic'
import { CommentEditDialog } from './comment-edit-dialog'
import { ReplyDialog } from './reply-dialog'

/**
 * 单条评论展示属性
 */
export type CommentItemProps = {
  comment: Comment
  editor: Editor | null
  commentStore: CommentStore
  onUpdate?: () => void
  isActive?: boolean
}

export const CommentItem = memo(({
  comment,
  editor,
  commentStore,
  onUpdate,
  isActive = false,
}: CommentItemProps) => {
  const labels = useCommentLabels()
  const { language } = useLanguage()

  const logic = useCommentItemLogic({
    comment,
    editor,
    commentStore,
    onUpdate,
    labels,
  })

  const {
    isEditing,
    editContent,
    setEditContent,
    isReplying,
    replyContent,
    setReplyContent,
    handleJumpToComment,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleToggleStatus,
    handleReply,
    handleCreateReply,
    handleCancelReply,
  } = logic

  const defaultAuthor: CommentAuthor = useMemo(() => ({
    id: 'anonymous',
    name: labels.user || 'User',
  }), [labels.user])

  const confirmDelete = () => {
    const preview = comment.content.substring(0, 20)
    Modal.warning({
      titleText: labels.confirmDelete(preview),
      onOk: () => handleDelete(true),
    })
  }

  const containerClass = cn(
    'rounded-2xl border border-border bg-background p-4 shadow-card transition-all hover:shadow-md',
    comment.status === 'resolved'
    && 'border-systemGreen/30 bg-systemGreen/5',
    isActive && 'border-brand shadow-lg',
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
          onCreate={ () => handleCreateReply(defaultAuthor) }
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
          <span className="text-xs text-text3">
            { formatDate('YYYY-MM-dd HH:mm:ss', new Date(comment.createdAt), { locales: language }) }
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={ () => handleJumpToComment() }
            disabled={ comment.status === 'resolved' }
            variant="ghost"
            size="sm"
            tooltip={ labels.locate }
            className="size-8"
            leftIcon={ <LocateIcon className="size-4 text-icon" /> }
          />

          { comment.status === 'active' && (
            <>
              <Button
                type="button"
                onClick={ handleEdit }
                variant="ghost"
                size="sm"
                tooltip={ labels.edit }
                className="size-8"
                leftIcon={ <EditIcon className="size-4 text-icon" /> }
              />
              <Button
                type="button"
                onClick={ handleReply }
                variant="ghost"
                size="sm"
                tooltip={ labels.reply }
                className="size-8"
                leftIcon={ <CornerDownLeftIcon className="size-4 text-icon" /> }
              />
            </>
          ) }

          <Button
            type="button"
            onClick={ handleToggleStatus }
            variant="ghost"
            size="sm"
            tooltip={ comment.status === 'active'
              ? labels.markResolved
              : labels.reopen }
            className="size-8"
            leftIcon={ comment.status === 'active'
              ? (
                  <BanIcon className="size-4 text-icon" />
                )
              : (
                  <TrashIcon className="size-4 text-icon" />
                ) }
          />

          <Button
            type="button"
            onClick={ confirmDelete }
            variant="ghost"
            size="sm"
            tooltip={ labels.delete }
            className="size-8"
            leftIcon={ <TrashIcon className="size-4 text-icon" /> }
          />
        </div>
      </div>

      { comment.replyTo && comment.replyToAuthor && (
        <button
          type="button"
          onClick={ () => handleJumpToComment(comment.replyTo) }
          className="mt-3 flex w-full items-center gap-2 rounded-xl bg-background2 px-3 py-2 text-left text-sm text-systemBlue transition-all hover:bg-border2"
        >
          <span className="text-[12px] font-semibold">
            @
            { comment.replyToAuthor.name }
          </span>
          <span className="text-text2">
            { comment.replyToContent || '...' }
          </span>
        </button>
      ) }

      <div className="mt-3 rounded-xl bg-background2 px-3 py-2 text-sm leading-6 text-text2">
        { comment.content }
      </div>
    </div>
  )
})

CommentItem.displayName = 'CommentItem'
