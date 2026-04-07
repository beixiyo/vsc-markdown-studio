import type { Editor } from '@tiptap/react'
import type { Comment, CommentStore } from '../../comment-store'
import { Popover, type PopoverRef } from 'comps'
import { memo, useEffect, useMemo, useRef } from 'react'
import { getSelectionRect } from 'tiptap-api'
import { useCommentLabels } from 'tiptap-api/react'
import { CloseIcon } from 'tiptap-comps/icons'
import { SELECTION_TOOLBAR_KEEP_OPEN_ATTR } from 'tiptap-utils'
import { cn } from 'utils'
import { CommentItem } from './comment-item'

export type InlineCommentPopoverProps = {
  /**
   * 当前激活的内联评论
   */
  inlineComment: Comment | null
  /**
   * 当前评论线程（包含父评论和直接回复）
   */
  inlineThread: Comment[]
  /**
   * 评论对应的 DOMRect，用于自动计算位置
   */
  inlineCommentRect: DOMRect | null
  /**
   * 评论对应的文档范围（实时计算定位，避免滚动时位置陈旧）
   */
  inlineCommentRange?: { from: number, to: number } | null
  /**
   * 关闭内联评论浮层
   */
  closeInlineComment: () => void
  /**
   * 编辑器实例
   */
  editor: Editor | null
  /**
   * 评论 Store
   */
  commentStore: CommentStore | null
  /**
   * 外部传入的浮层最大高度
   */
  maxHeight?: number
  /**
   * 自定义容器类名
   */
  className?: string
}

/**
 * 内联评论浮层组件
 *
 * - 如果宿主没有传入 left / top / maxHeight，则根据 inlineCommentRect 和视口自动计算安全位置
 * - 用于贴合选中文本展示当前评论线程
 */
export const InlineCommentPopover = memo((props: InlineCommentPopoverProps) => {
  const {
    inlineComment,
    inlineThread,
    inlineCommentRect,
    inlineCommentRange,
    closeInlineComment,
    editor,
    commentStore,
    maxHeight: maxHeightProp,
    className,
  } = props

  /** 计算最新的评论区域 rect，用于 Floating UI 定位 */
  const getCurrentRect = useMemo(() => {
    return () => {
      if (inlineCommentRange && editor) {
        const rect = getSelectionRect(editor, inlineCommentRange.from, inlineCommentRange.to)
        if (rect)
          return rect
      }
      return inlineCommentRect
    }
  }, [editor, inlineCommentRange, inlineCommentRect])

  const popoverRef = useRef<PopoverRef>(null)

  useEffect(() => {
    if (inlineComment && getCurrentRect() && editor && commentStore) {
      popoverRef.current?.open()
    }
    else {
      popoverRef.current?.close()
    }
  }, [inlineComment, getCurrentRect, editor, commentStore])

  const labels = useCommentLabels()

  const maxHeight = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        maxHeight: maxHeightProp ?? 0,
      }
    }

    const viewportPadding = 12
    const minPopupHeight = 180
    const maxPopupHeight = 520

    const safeRect = getCurrentRect() ?? new DOMRect(
      viewportPadding,
      viewportPadding,
      0,
      0,
    )

    const targetTop = safeRect.bottom + 8
    const preferredHeight = Math.max(
      minPopupHeight,
      Math.min(maxPopupHeight, window.innerHeight - viewportPadding * 2),
    )
    const maxAllowedTop = window.innerHeight - viewportPadding - preferredHeight
    const computedTop = Math.min(
      targetTop,
      Math.max(viewportPadding, maxAllowedTop),
    )

    const computedMaxHeight = window.innerHeight - computedTop - viewportPadding

    return {
      maxHeight: maxHeightProp ?? computedMaxHeight,
    }
  }, [getCurrentRect, maxHeightProp])

  return (
    <>
      { inlineComment && getCurrentRect() && editor && commentStore && (
        <Popover
          ref={ popoverRef }
          trigger="command"
          position="bottom"
          virtualReferenceRect={ getCurrentRect() }
          onClose={ closeInlineComment }
          clickOutsideToClose={ false }
          content={
            <div
              className={ cn(
                'bn-inline-comment-popover max-w-[360px] overflow-y-auto w-full min-w-[300px]',
                className,
              ) }
              style={ {
                maxHeight: maxHeight.maxHeight,
              } }
              { ...{ [SELECTION_TOOLBAR_KEEP_OPEN_ATTR]: 'true' } }
            >
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
                <span className="text-[13px] font-medium text-text">{ labels.currentComment }</span>
                <button
                  type="button"
                  onClick={ () => {
                    closeInlineComment()
                  } }
                  aria-label={ labels.closeCurrent }
                  className="flex size-6 items-center justify-center text-text3 transition-colors hover:bg-background2 hover:text-text rounded-md"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-2.5 space-y-2">
                { inlineThread.map(comment => (
                  <CommentItem
                    key={ comment.id }
                    comment={ comment }
                    editor={ editor }
                    commentStore={ commentStore }
                    isActive={ comment.id === inlineComment.id }
                  />
                )) }
              </div>
            </div>
          }
        >
          <div />
        </Popover>
      ) }
    </>
  )
})

InlineCommentPopover.displayName = 'InlineCommentPopover'
