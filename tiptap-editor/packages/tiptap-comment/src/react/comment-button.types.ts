import type { ButtonProps } from 'tiptap-styles/ui'
import type { CommentAuthor } from '../comment-store'
import type { CommentStore } from '../comment-store'

/**
 * 评论按钮组件的属性
 */
export interface CommentButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * 评论 Store 实例
   * 如果不提供，会创建一个临时的 Store（仅用于测试）
   */
  commentStore?: CommentStore
  /**
   * 作者信息（可选，如果不提供则使用默认的模拟数据）
   */
  author?: CommentAuthor
  /**
   * 回调函数，当评论创建成功时调用
   */
  onCommentCreated?: (comment: { id: string; content: string }) => void
  /**
   * 回调函数，当 Popover 打开或关闭时调用
   */
  onOpenChange?: (isOpen: boolean) => void
}

