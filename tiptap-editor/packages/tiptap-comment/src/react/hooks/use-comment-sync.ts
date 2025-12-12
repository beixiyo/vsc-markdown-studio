/**
 * 评论同步 Hook
 *
 * 此 Hook 负责在编辑器状态变更时自动同步评论范围与 Store 状态。
 * 包括处理撤销/重做时的评论状态恢复。
 */

import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { CommentStore } from '../../comment-store'
import { syncCommentRanges } from '../../comment-sync'

/**
 * 评论同步选项
 */
export interface UseCommentSyncOptions {
  /** 是否启用自动同步（默认：true） */
  enabled?: boolean
  /** 是否在撤销/重做时自动同步（默认：true） */
  syncOnUndoRedo?: boolean
  /** 同步延迟（毫秒），用于防抖（默认：100） */
  debounceMs?: number
}

/**
 * 评论同步
 *
 * 在编辑器状态变更时自动同步评论范围与 Store 状态。
 * 包括处理撤销/重做时的评论状态恢复。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param options 同步选项
 *
 * @example
 * ```typescript
 * useCommentSync(editor, commentStore, {
 *   syncOnUndoRedo: true
 * })
 * ```
 */
export function useCommentSync(
  editor: Editor | null,
  commentStore: CommentStore,
  options: UseCommentSyncOptions = {}
): void {
  const {
    enabled = true,
    syncOnUndoRedo = true,
    debounceMs = 100,
  } = options

  useEffect(() => {
    if (!editor || !enabled) {
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    // 同步函数（带防抖）
    const sync = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        syncCommentRanges(editor, commentStore)
      }, debounceMs)
    }

    // 订阅编辑器更新事件
    // 注意：Tiptap 的 'update' 事件会在每次状态变更时触发，包括撤销/重做
    // ProseMirror 的 Mapping 机制已经处理了位置更新，我们只需要同步状态即可
    const handleUpdate = ({ transaction }: { transaction: any }) => {
      // 检查是否是撤销/重做操作
      const isUndoRedo = transaction.getMeta('undo') || transaction.getMeta('redo')

      if (isUndoRedo && syncOnUndoRedo) {
        // 撤销/重做后立即同步（不使用防抖）
        syncCommentRanges(editor, commentStore)
      } else {
        // 普通更新使用防抖
        sync()
      }
    }

    editor.on('update', handleUpdate)

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      editor.off('update', handleUpdate)
    }
  }, [editor, commentStore, enabled, syncOnUndoRedo, debounceMs])
}

