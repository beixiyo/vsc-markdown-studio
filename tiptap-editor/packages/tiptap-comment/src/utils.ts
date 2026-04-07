import type { Editor } from '@tiptap/react'
import type { Comment, CommentStore } from './comment-store'
import { commentPluginKey, type CommentRange } from './plugin'

/**
 * 从 Plugin 获取评论范围信息
 *
 * 此辅助函数用于从编辑器的 Plugin 状态中获取评论范围映射表。
 * 评论范围信息存储在 Comment Plugin 的 state 中。
 *
 * @param editor 编辑器实例
 * @returns 评论范围映射表，key 为 commentId，value 为范围信息
 *          如果编辑器未初始化或 Plugin 未加载，返回空的 Map
 *
 * @example
 * ```typescript
 * const ranges = getCommentRangesFromPlugin(editor)
 * const comments = commentStore.getCommentsByRange(ranges, 100, 200)
 * ```
 */
export function getCommentRangesFromPlugin(
  editor: Editor | null,
): Map<string, CommentRange> {
  if (!editor) {
    return new Map()
  }

  const pluginState = commentPluginKey.getState(editor.state)
  if (!pluginState) {
    return new Map()
  }

  return pluginState.ranges
}

/**
 * 便捷函数：根据文档位置范围查找评论
 *
 * 此函数组合了 `getCommentRangesFromPlugin` 和 `CommentStore.getCommentsByRange`，
 * 提供更便捷的调用方式。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param from 查询范围的起始位置（字符偏移，ProseMirror 位置）
 * @param to 查询范围的结束位置（字符偏移，ProseMirror 位置）
 * @returns 所有评论范围与给定范围有交集的评论列表
 *
 * @example
 * ```typescript
 * // 用户选中了一段文本，查找这段文本上的所有评论
 * const comments = getCommentsByRange(editor, commentStore, 100, 200)
 *
 * // 用户点击了文档的某个位置，查找这个位置附近的评论
 * const comments = getCommentsByRange(editor, commentStore, 150, 150)
 * ```
 */
export function getCommentsByRange(
  editor: Editor | null,
  commentStore: CommentStore,
  from: number,
  to: number,
): Comment[] {
  const ranges = getCommentRangesFromPlugin(editor)
  return commentStore.getCommentsByRange(ranges, from, to)
}
