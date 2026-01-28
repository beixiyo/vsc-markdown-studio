import type { Editor } from '@tiptap/react'
import type { CommentStore } from '../../comment-store'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getSelectionRect } from 'tiptap-api'
import { DATA_COMMENT_ID } from '../../constants'
import { commentPluginKey } from '../../plugin'
import { useWatchRef } from '../../../../../../packages/hooks/dist'

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
  const onInlineOpenRef = useWatchRef(onInlineOpen)
  const onInlineCloseRef = useWatchRef(onInlineClose)

  const [inlineCommentId, setInlineCommentId] = useState<string | null>(null)
  const [inlineCommentRect, setInlineCommentRect] = useState<DOMRect | null>(null)
  const [inlineCommentRange, setInlineCommentRange] = useState<{ from: number, to: number } | null>(null)

  const commentSnapshot = useSyncExternalStore(
    listener => commentStore?.subscribe(listener) ?? (() => {}),
    () => commentStore?.getSnapshot() ?? [],
    () => commentStore?.getSnapshot() ?? [],
  )

  useEffect(() => {
    if (!editor) {
      return
    }

    const editorDom = editor.view.dom

    const handleCommentHighlightClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const commentElement = target?.closest<HTMLElement>(`[${DATA_COMMENT_ID}]`)
      const commentId = commentElement?.getAttribute(DATA_COMMENT_ID)

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
      setInlineCommentRange(range
        ? { from: range.from, to: range.to }
        : null)
      onInlineOpenRef.current?.(commentId)
    }

    editorDom.addEventListener('click', handleCommentHighlightClick)

    return () => {
      editorDom.removeEventListener('click', handleCommentHighlightClick)
    }
  }, [editor, commentStore])

  /** 当评论被删除或丢失时，自动收起浮层 */
  useEffect(() => {
    if (!inlineCommentId) {
      return
    }

    const exists = commentSnapshot.some(comment => comment.id === inlineCommentId)
    if (!exists) {
      setInlineCommentId(null)
      setInlineCommentRect(null)
      setInlineCommentRange(null)
      onInlineCloseRef.current?.()
    }
  }, [inlineCommentId, commentSnapshot])

  const closeInlineComment = () => {
    setInlineCommentId(null)
    setInlineCommentRect(null)
    setInlineCommentRange(null)
    onInlineCloseRef.current?.()
  }

  const inlineComment = useMemo(() => {
    if (!inlineCommentId) {
      return null
    }
    return commentSnapshot.find(comment => comment.id === inlineCommentId) || null
  }, [commentSnapshot, inlineCommentId])

  const inlineThread = useMemo(() => {
    if (!inlineCommentId) {
      return []
    }
    /** 将父评论放在首位，其余为直接回复 */
    return commentSnapshot
      .filter(comment => comment.id === inlineCommentId || comment.replyTo === inlineCommentId)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [commentSnapshot, inlineCommentId])

  return {
    inlineCommentId,
    inlineCommentRect,
    inlineCommentRange,
    inlineComment,
    inlineThread,
    closeInlineComment,
  }
}
