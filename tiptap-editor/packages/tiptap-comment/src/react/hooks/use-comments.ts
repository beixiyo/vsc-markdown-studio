import type { Comment, CommentStore } from '../../comment-store'
import { useSyncExternalStore } from 'react'

/**
 * 订阅并获取评论 Store 的快照
 * 封装了 useSyncExternalStore 模式，以便在多个组件中复用
 *
 * @param commentStore 评论 Store 实例
 * @returns 评论实体数组快照
 */
export function useComments(commentStore: CommentStore | null | undefined): Comment[] {
  return useSyncExternalStore(
    listener => commentStore?.subscribe(listener) ?? (() => {}),
    () => commentStore?.getSnapshot() ?? [],
    () => commentStore?.getSnapshot() ?? [],
  )
}
