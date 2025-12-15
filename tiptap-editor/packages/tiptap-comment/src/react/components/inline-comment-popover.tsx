import type { Editor } from '@tiptap/react'
import type { Comment, CommentStore } from '../../comment-store'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import { memo, useEffect, useMemo } from 'react'
import { getSelectionRect } from 'tiptap-api'
import { CloseIcon } from 'tiptap-comps/icons'
import { cn } from 'tiptap-config'
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

  /**
   * 将评论对应的 DOMRect 转成 Floating UI 的虚拟元素
   * 这样就可以使用 autoUpdate，在滚动/窗口变化时自动更新位置，避免闪烁
   */
  const virtualElement = useMemo(() => {
    const rect = getCurrentRect()
    if (!rect) {
      return null
    }

    return {
      getBoundingClientRect: () => getCurrentRect() ?? new DOMRect(0, 0, 0, 0),
      contextElement: editor?.view?.dom,
    }
  }, [getCurrentRect, editor])

  /**
   * Floating UI 定位中间件
   * - offset: 与选中区域保持 8px 间距
   * - flip / shift: 自动避免遮挡视口边缘
   */
  const middleware = useMemo(
    () => [
      offset(8),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({
        padding: 8,
      }),
    ],
    [],
  )

  /**
   * 使用 Floating UI 进行智能定位
   * 交给 autoUpdate 监听滚动、窗口变化等，保证浮层跟随页面滚动且不闪烁
   */
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware,
  })

  /** 绑定虚拟元素为 reference */
  useEffect(() => {
    if (virtualElement) {
      refs.setReference(virtualElement)
    }
  }, [virtualElement, refs])

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

  if (!inlineComment || !getCurrentRect() || !editor || !commentStore) {
    return null
  }

  return (
    <FloatingPortal>
      <div
        ref={ refs.setFloating }
        className={ cn(
          'bn-inline-comment-popover z-[1000] max-w-[360px] overflow-y-auto',
          className,
        ) }
        style={ {
          ...floatingStyles,
          maxHeight: maxHeight.maxHeight,
        } }
      >
        <div className="rounded-2xl border border-[var(--tt-border-color)] bg-[var(--tt-card-bg-color)] shadow-[var(--tt-shadow-elevated-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--tt-border-color)] px-3 py-2 text-xs text-[var(--tt-color-text-gray)]">
            <span>当前评论</span>
            <button
              type="button"
              onClick={ () => {
                closeInlineComment()
              } }
              aria-label="关闭当前评论"
              className="flex size-6 items-center justify-center text-[var(--tt-color-text-gray)] transition hover:bg-[var(--tt-border-color-tint)] rounded-xl"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            { inlineThread.map(comment => (
              <CommentItem
                key={ comment.id }
                comment={ comment }
                editor={ editor }
                commentStore={ commentStore }
                onUpdate={ () => {} }
                isActive={ comment.id === inlineComment.id }
              />
            )) }
          </div>
        </div>
      </div>
    </FloatingPortal>
  )
})

InlineCommentPopover.displayName = 'InlineCommentPopover'
