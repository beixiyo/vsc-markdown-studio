import type { Editor } from '@tiptap/react'
import type { Comment, CommentAuthor, CommentStore } from '../../comment-store'
import { useCallback, useState } from 'react'
import { scrollToRangeSelection } from 'tiptap-api'
import { createReply, deleteComment, updateComment } from '../../comment'
import { commentPluginKey } from '../../plugin'

export interface UseCommentItemLogicOptions {
  comment: Comment
  editor: Editor | null
  commentStore: CommentStore
  onUpdate?: () => void
  labels: any
}

export function useCommentItemLogic({
  comment,
  editor,
  commentStore,
  onUpdate,
  labels,
}: UseCommentItemLogicOptions) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const handleJumpToComment = useCallback((id: string = comment.id) => {
    if (!editor)
      return

    const pluginState = commentPluginKey.getState(editor.state)
    const range = pluginState?.ranges.get(id)

    if (range) {
      scrollToRangeSelection(editor, range.from, range.to, {
        behavior: 'smooth',
        block: 'center',
      })

      /** 使用 Plugin 装饰来高亮活动评论，而不是直接操作 DOM */
      editor.view.dispatch(
        editor.state.tr.setMeta('setActiveCommentId', id),
      )

      // 3秒后取消高亮
      setTimeout(() => {
        if (!editor.isDestroyed) { // 检查编辑器是否仍然存在
          editor.view.dispatch(
            editor.state.tr.setMeta('setActiveCommentId', null),
          )
        }
      }, 3000)
    }
  }, [editor, comment.id])

  const handleDelete = useCallback((confirmed: boolean) => {
    if (!editor || !confirmed)
      return
    deleteComment(editor, commentStore, comment.id)
    onUpdate?.()
  }, [editor, commentStore, comment.id, onUpdate])

  const handleEdit = useCallback(() => {
    setEditContent(comment.content)
    setIsEditing(true)
  }, [comment.content])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim()
    if (!trimmed) {
      console.warn(labels.contentEmpty)
      return
    }

    const success = updateComment(commentStore, comment.id, {
      content: trimmed,
    })

    if (success) {
      setIsEditing(false)
      onUpdate?.()
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
      onUpdate?.()
    }
    else {
      console.warn(labels.updateStatusFailed)
    }
  }, [commentStore, comment.id, comment.status, onUpdate, labels])

  const handleReply = useCallback(() => {
    setReplyContent('')
    setIsReplying(true)
  }, [])

  const handleCreateReply = useCallback((author: CommentAuthor) => {
    if (!editor || !replyContent.trim()) {
      console.warn(labels.createReplyFailed)
      return
    }

    const reply = createReply(editor, commentStore, {
      content: replyContent.trim(),
      author,
      replyToId: comment.id,
    })

    if (reply) {
      setReplyContent('')
      setIsReplying(false)
      onUpdate?.()
    }
    else {
      console.warn(labels.replyFailed)
    }
  }, [editor, commentStore, replyContent, comment.id, onUpdate, labels])

  const handleCancelReply = useCallback(() => {
    setReplyContent('')
    setIsReplying(false)
  }, [])

  return {
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
  }
}
