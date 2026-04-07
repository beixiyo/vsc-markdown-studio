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
    'rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:shadow-md group',
    comment.status === 'resolved'
    && 'border-systemGreen/20 bg-systemGreen/5',
    isActive && 'shadow-md',
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
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-text">
              { comment.author.name }
            </span>
            { comment.status === 'resolved' && (
              <span className="inline-flex items-center gap-1 rounded bg-systemGreen/10 px-1.5 py-0.5 text-[11px] font-medium text-systemGreen">
                { labels.resolved }
              </span>
            ) }
          </div>
          <span className="text-[11px] text-text3">
            { formatDate('YYYY-MM-dd HH:mm', new Date(comment.createdAt), { locales: language }) }
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          className="mt-2.5 flex w-full items-center gap-2 rounded bg-background2/50 px-2.5 py-1.5 text-left text-[12px] text-text2 transition-all hover:bg-background2"
        >
          <span className="font-medium text-text">
            @
            { comment.replyToAuthor.name }
          </span>
          <span className="truncate">
            { comment.replyToContent || '...' }
          </span>
        </button>
      ) }

      <div className="mt-2 text-[13px] leading-relaxed text-text2">
        { comment.content }
      </div>
    </div>
  )
})

CommentItem.displayName = 'CommentItem'
