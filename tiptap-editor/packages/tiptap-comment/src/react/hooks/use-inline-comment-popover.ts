import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../../comment-store'
import { useEffect, useState } from 'react'
import { getSelectionRect } from 'tiptap-api'
import { commentPluginKey } from '../../plugin'

/**
 * 点击评论高亮时，展示贴合文本的评论浮层
 */
export function useInlineCommentPopover(params: {
  editor: Editor | null
  commentStore: CommentStore | null
  onInlineOpen?: (commentId: string) => void
  onInlineClose?: () => void
}) {
  const { editor, commentStore, onInlineOpen, onInlineClose } = params
  const [inlineCommentId, setInlineCommentId] = useState<string | null>(null)
  const [inlineCommentRect, setInlineCommentRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!editor) {
      return
    }

    const editorDom = editor.view.dom

    const handleCommentHighlightClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const commentElement = target?.closest<HTMLElement>('[data-comment-id]')
      const commentId = commentElement?.getAttribute('data-comment-id')

      if (!commentId || !commentStore?.getComment(commentId)) {
        return
      }

      const pluginState = commentPluginKey.getState(editor.state)
      const range = pluginState?.ranges.get(commentId)
      const rect = range
        ? getSelectionRect(editor, range.from, range.to)
        : getSelectionRect(editor)

      setInlineCommentId(commentId)
      setInlineCommentRect(rect)
      onInlineOpen?.(commentId)
    }

    editorDom.addEventListener('click', handleCommentHighlightClick)

    return () => {
      editorDom.removeEventListener('click', handleCommentHighlightClick)
    }
  }, [editor, commentStore, onInlineOpen])

  /** 当评论被删除或丢失时，自动收起浮层 */
  useEffect(() => {
    if (!inlineCommentId) {
      return
    }

    const exists = commentStore?.getComment(inlineCommentId)
    if (!exists) {
      setInlineCommentId(null)
      setInlineCommentRect(null)
      onInlineClose?.()
    }
  }, [inlineCommentId, commentStore, onInlineClose])

  const closeInlineComment = () => {
    setInlineCommentId(null)
    setInlineCommentRect(null)
    onInlineClose?.()
  }

  const inlineComment = inlineCommentId
    ? commentStore?.getComment(inlineCommentId) || null
    : null

  return {
    inlineCommentId,
    inlineCommentRect,
    inlineComment,
    closeInlineComment,
  }
}
