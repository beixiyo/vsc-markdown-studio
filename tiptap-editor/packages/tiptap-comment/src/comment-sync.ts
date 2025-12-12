/**
 * 评论同步 API
 *
 * 此模块负责检测评论系统的边界情况，包括：
 * 1. 检测评论范围被删除的情况（文档中没有 mark，但 Store 中有评论）
 * 2. 检测评论范围被分割的情况（一个评论范围变成多个不连续的部分）
 * 3. 检测孤立的评论 mark（文档中有 mark，但 Store 中没有评论）
 *
 * 注意：此模块只负责检测，不执行任何自动操作。删除和 resolve 状态应由用户手动控制。
 *
 * @see plan/comment-system-implementation.md 了解实现详情
 */

import type { Editor } from '@tiptap/react'
import type { CommentStore } from './comment-store'
import { commentPluginKey, type CommentRange } from './plugin'

/**
 * 评论范围同步结果
 */
export interface CommentSyncResult {
  /** 被删除的评论 ID 列表（范围被完全删除） */
  deleted: string[]
  /** 被分割的评论 ID 列表（范围被分割成多个不连续的部分） */
  split: string[]
  /** 新增的评论 ID 列表（在文档中发现但 Store 中不存在） */
  orphaned: string[]
}

/**
 * 同步评论范围与 Store 状态
 *
 * 此函数会检测文档中的评论范围与 Store 中的评论是否一致，但不执行任何自动操作。
 * 检测结果包括：
 * 1. 检测评论范围被删除的情况（文档中没有 mark，但 Store 中有评论）
 * 2. 检测评论范围被分割的情况（一个评论范围变成多个不连续的部分）
 * 3. 检测孤立的评论 mark（文档中有 mark，但 Store 中没有评论）
 *
 * 注意：此函数只负责检测，不执行任何自动操作。删除和 resolve 状态应由用户手动控制。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @returns 同步结果
 *
 * @example
 * ```typescript
 * const result = syncCommentRanges(editor, commentStore)
 * console.log(`检测到 ${result.deleted.length} 个被删除的评论`)
 * ```
 */
export function syncCommentRanges(
  editor: Editor | null,
  commentStore: CommentStore,
): CommentSyncResult {
  if (!editor) {
    return { deleted: [], split: [], orphaned: [] }
  }

  const result: CommentSyncResult = {
    deleted: [],
    split: [],
    orphaned: [],
  }

  /** 获取 Plugin state 中的评论范围 */
  const pluginState = commentPluginKey.getState(editor.state)
  if (!pluginState) {
    return result
  }

  const ranges = pluginState.ranges
  const storeComments = commentStore.getAllComments()

  // 1. 检测被删除的评论（Store 中有，但文档中没有 mark）
  for (const comment of storeComments) {
    if (!ranges.has(comment.id)) {
      result.deleted.push(comment.id)
      /** 注意：不执行任何自动操作，只记录检测结果 */
    }
  }

  // 2. 检测孤立的评论 mark（文档中有 mark，但 Store 中没有评论）
  for (const commentId of ranges.keys()) {
    if (!commentStore.getComment(commentId)) {
      result.orphaned.push(commentId)
    }
  }

  // 3. 检测评论范围被分割的情况
  /** 需要扫描文档，查找同一个 commentId 是否出现在多个不连续的位置 */
  const commentIdPositions = new Map<string, CommentRange[]>()

  /** 扫描文档，收集每个 commentId 的所有位置 */
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.marks) {
      return true
    }

    for (const mark of node.marks) {
      if (mark.type.name === 'comment') {
        const commentId = mark.attrs?.commentId
        if (commentId && typeof commentId === 'string') {
          const range: CommentRange = {
            commentId,
            from: pos,
            to: pos + node.nodeSize,
          }

          if (!commentIdPositions.has(commentId)) {
            commentIdPositions.set(commentId, [])
          }
          commentIdPositions.get(commentId)!.push(range)
        }
      }
    }

    return true
  })

  /** 检测分割：如果一个 commentId 有多个不连续的范围，则认为是分割 */
  for (const [commentId, positions] of commentIdPositions) {
    if (positions.length === 0) {
      continue
    }

    /** 合并连续或重叠的范围 */
    const sortedPositions = positions.sort((a, b) => a.from - b.from)
    const mergedRanges: CommentRange[] = []

    for (const range of sortedPositions) {
      if (mergedRanges.length === 0) {
        mergedRanges.push({ ...range })
      }
      else {
        const lastRange = mergedRanges[mergedRanges.length - 1]
        /** 如果当前范围与上一个范围连续或重叠，则合并 */
        if (range.from <= lastRange.to) {
          lastRange.to = Math.max(lastRange.to, range.to)
        }
        else {
          /** 不连续，添加新范围 */
          mergedRanges.push({ ...range })
        }
      }
    }

    /** 如果合并后有多个不连续的范围，则认为是分割 */
    if (mergedRanges.length > 1) {
      result.split.push(commentId)
      /** 注意：不执行任何自动操作，只记录检测结果 */
    }
  }

  return result
}

/**
 * 清理孤立的评论 mark
 *
 * 移除文档中存在的、但 Store 中不存在的评论 mark（孤立的 mark）。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @returns 清理的评论 ID 列表
 *
 * @example
 * ```typescript
 * const cleaned = cleanupOrphanedCommentMarks(editor, commentStore)
 * console.log(`清理了 ${cleaned.length} 个孤立的评论 mark`)
 * ```
 */
export function cleanupOrphanedCommentMarks(
  editor: Editor | null,
  commentStore: CommentStore,
): string[] {
  if (!editor || !editor.isEditable) {
    return []
  }

  const cleaned: string[] = []
  const pluginState = commentPluginKey.getState(editor.state)
  if (!pluginState) {
    return cleaned
  }

  const ranges = pluginState.ranges
  const { state } = editor
  const commentMarkType = state.schema.marks.comment

  if (!commentMarkType) {
    return cleaned
  }

  /** 查找所有孤立的评论 mark */
  for (const [commentId] of ranges) {
    if (!commentStore.getComment(commentId)) {
      cleaned.push(commentId)

      /** 移除该 mark */
      const range = ranges.get(commentId)
      if (range) {
        const { tr } = state

        /** 遍历范围内的所有节点，移除带有该 commentId 的 mark */
        tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
          if (node.isText && node.marks) {
            const commentMark = node.marks.find(
              mark => mark.type === commentMarkType && mark.attrs.commentId === commentId,
            )

            if (commentMark) {
              const nodeFrom = pos
              const nodeTo = pos + node.nodeSize
              tr.removeMark(nodeFrom, nodeTo, commentMarkType)
            }
          }
        })

        if (tr.steps.length > 0) {
          editor.view.dispatch(tr)
        }
      }
    }
  }

  return cleaned
}

/**
 * 验证评论范围完整性
 *
 * 验证文档中的评论范围与 Store 中的评论是否一致。
 * 这是一个只读操作，不会修改任何数据。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @returns 验证结果
 *
 * @example
 * ```typescript
 * const isValid = validateCommentRanges(editor, commentStore)
 * if (!isValid.isValid) {
 *   console.warn('评论范围不一致:', isValid.issues)
 * }
 * ```
 */
export function validateCommentRanges(
  editor: Editor | null,
  commentStore: CommentStore,
): {
    isValid: boolean
    issues: {
      deleted: string[]
      orphaned: string[]
      split: string[]
    }
  } {
  const syncResult = syncCommentRanges(editor, commentStore)

  return {
    isValid:
      syncResult.deleted.length === 0
      && syncResult.orphaned.length === 0
      && syncResult.split.length === 0,
    issues: {
      deleted: syncResult.deleted,
      orphaned: syncResult.orphaned,
      split: syncResult.split,
    },
  }
}
