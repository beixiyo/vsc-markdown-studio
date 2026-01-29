/**
 * 评论系统 Store
 *
 * 此模块负责管理评论实体数据（内容、作者、时间、状态等）。
 * 评论的锚点信息存储在文档的 Mark 中，而评论的实体数据存储在此 Store 中。
 *
 * @see plan/comment-system-architecture.md 了解架构详情
 */

import type { Editor } from '@tiptap/react'
import { commentPluginKey, type CommentRange } from './plugin'

/**
 * 附件接口
 */
export interface Attachment {
  /** 附件 ID */
  id: string
  /** 附件类型 */
  type: 'image' | 'file'
  /** 附件 URL */
  url: string
  /** 附件名称 */
  name: string
  /** 附件大小（字节，可选） */
  size?: number
}

/**
 * 评论作者信息
 */
export interface CommentAuthor {
  /** 作者 ID */
  id: string
  /** 作者名称 */
  name: string
  /** 作者头像 URL（可选） */
  avatar?: string
}

/**
 * 评论实体接口
 *
 * 此接口定义了评论的完整数据结构，包括核心字段、状态字段、回复相关字段和扩展字段。
 * 评论的 ID 与文档中 Mark 的 commentId 对应。
 */
export interface Comment {
  /** 评论 ID，与 mark 的 commentId 对应 */
  id: string
  /** 评论内容（支持 Markdown） */
  content: string
  /** 作者信息 */
  author: CommentAuthor
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** 更新时间戳（可选） */
  updatedAt?: number

  /** 评论状态 */
  status: 'active' | 'resolved'

  /** 是否已删除（软删除，用于支持撤销/重做） */
  deleted?: boolean
  /** 删除时间戳（可选） */
  deletedAt?: number

  /** 被回复的评论 ID（如果存在，表示这是回复） */
  replyTo?: string
  /** 被回复的作者信息（用于展示引用） */
  replyToAuthor?: CommentAuthor
  /** 被回复的评论内容（用于展示引用，可选，可截断） */
  replyToContent?: string

  /** @提及的用户 ID 列表 */
  mentions?: string[]
  /** 标签列表 */
  tags?: string[]
  /** 附件列表 */
  attachments?: Attachment[]
}

/**
 * 评论 Store 类
 *
 * 负责管理评论实体的增删改查、查询和持久化。
 * 使用 Map 存储评论，以评论 ID 为键。
 */
export class CommentStore {
  /** 评论存储映射表，key 为评论 ID，value 为评论实体 */
  private comments: Map<string, Comment> = new Map()

  /** 评论范围查询缓存，key 为查询参数字符串（`${from}-${to}`），value 为查询结果 */
  private rangeQueryCache: Map<string, Comment[]> = new Map()

  /** 缓存的 ranges 版本（用于检测 ranges 是否变更） */
  private cachedRangesSignature: string = ''

  /** 订阅者回调列表 */
  private listeners: Set<() => void> = new Set()

  /** 快照缓存，用于 React useSyncExternalStore */
  private commentsSnapshot: Comment[] = Array.from(this.comments.values())

  /**
   * 清除查询缓存
   * 在评论变更或 ranges 变更时调用
   */
  private clearRangeQueryCache(): void {
    this.rangeQueryCache.clear()
  }

  /**
   * 计算 ranges 签名
   * 使用 commentId + 段落坐标（支持多段）构造稳定字符串，便于检测位置变化
   */
  private computeRangesSignature(ranges: Map<string, CommentRange>): string {
    const parts: string[] = []

    const sorted = Array.from(ranges.entries()).sort(([a], [b]) => a.localeCompare(b))
    for (const [commentId, range] of sorted) {
      if (range.segments && range.segments.length > 0) {
        const segmentSig = range.segments
          .map(seg => `${seg.from}-${seg.to}`)
          .join(',')
        parts.push(`${commentId}:${segmentSig}`)
      }
      else {
        parts.push(`${commentId}:${range.from}-${range.to}`)
      }
    }

    return parts.join('|')
  }

  /** 通知所有订阅者 */
  private notify(): void {
    this.listeners.forEach(listener => listener())
  }

  /** 重建快照 */
  private rebuildSnapshot(): void {
    this.commentsSnapshot = Array.from(this.comments.values()).filter(c => !c.deleted)
  }

  /**
   * 获取当前评论快照（稳定引用）
   */
  getSnapshot(): Comment[] {
    return this.commentsSnapshot
  }

  /**
   * 订阅评论变更
   * @returns 取消订阅函数
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 添加评论
   * @param comment 评论实体
   * @throws 如果评论 ID 已存在，抛出错误
   */
  addComment(comment: Comment): void {
    if (this.comments.has(comment.id)) {
      throw new Error(`评论 ID "${comment.id}" 已存在`)
    }
    this.comments.set(comment.id, comment)
    /** 清除查询缓存（因为评论列表变更） */
    this.clearRangeQueryCache()
    this.rebuildSnapshot()
    this.notify()
  }

  /**
   * 获取评论
   * @param id 评论 ID
   * @returns 评论实体，如果不存在则返回 undefined
   */
  getComment(id: string): Comment | undefined {
    return this.comments.get(id)
  }

  /**
   * 更新评论
   * @param id 评论 ID
   * @param updates 要更新的字段（部分评论对象）
   * @throws 如果评论不存在，抛出错误
   */
  updateComment(id: string, updates: Partial<Comment>): void {
    const comment = this.comments.get(id)
    if (!comment) {
      throw new Error(`评论 ID "${id}" 不存在`)
    }

    /** 更新评论，同时更新 updatedAt 时间戳 */
    const updatedComment: Comment = {
      ...comment,
      ...updates,
      updatedAt: Date.now(),
    }

    this.comments.set(id, updatedComment)
    /** 清除查询缓存（因为评论内容变更） */
    this.clearRangeQueryCache()
    this.rebuildSnapshot()
    this.notify()
  }

  /**
   * 删除评论（软删除）
   * @param id 评论 ID
   * @returns 是否删除成功（如果评论不存在，返回 false）
   */
  deleteComment(id: string): boolean {
    const comment = this.comments.get(id)
    if (comment) {
      this.comments.set(id, {
        ...comment,
        deleted: true,
        deletedAt: Date.now(),
      })
      /** 清除查询缓存（因为评论列表变更） */
      this.clearRangeQueryCache()
      this.rebuildSnapshot()
      this.notify()
      return true
    }
    return false
  }

  /**
   * 恢复评论
   * @param id 评论 ID
   * @returns 是否恢复成功
   */
  restoreComment(id: string): boolean {
    const comment = this.comments.get(id)
    if (comment && comment.deleted) {
      const { deleted, deletedAt, ...rest } = comment
      this.comments.set(id, rest)
      this.clearRangeQueryCache()
      this.rebuildSnapshot()
      this.notify()
      return true
    }
    return false
  }

  /**
   * 永久删除评论
   * @param id 评论 ID
   * @returns 是否删除成功
   */
  permanentlyDeleteComment(id: string): boolean {
    const deleted = this.comments.delete(id)
    if (deleted) {
      this.clearRangeQueryCache()
      this.rebuildSnapshot()
      this.notify()
    }
    return deleted
  }

  /**
   * 获取所有评论
   * @param includeDeleted 是否包含已删除的评论（默认 false）
   * @returns 评论数组
   */
  getAllComments(includeDeleted = false): Comment[] {
    const all = Array.from(this.comments.values())
    return includeDeleted
      ? all
      : all.filter(c => !c.deleted)
  }

  /**
   * 根据状态筛选评论
   * @param status 评论状态
   * @returns 匹配状态的评论数组
   */
  getCommentsByStatus(status: Comment['status']): Comment[] {
    return this.getAllComments().filter(comment => comment.status === status)
  }

  /**
   * 根据文档位置范围查找评论
   *
   * 此方法需要从 Plugin 获取评论范围信息，然后根据范围交集筛选出对应的评论实体。
   * 判断逻辑：评论范围 [commentFrom, commentTo] 与查询范围 [from, to] 有交集
   *           即：commentFrom < to && commentTo > from
   *
   * 优化：使用缓存机制提升查询性能。缓存会在评论变更或 ranges 变更时自动清除。
   *
   * @param ranges 评论范围映射表（从 Plugin 获取）
   * @param from 查询范围的起始位置（字符偏移，ProseMirror 位置）
   * @param to 查询范围的结束位置（字符偏移，ProseMirror 位置）
   * @returns 所有评论范围与给定范围有交集的评论列表
   *
   * @example
   * ```typescript
   * // 用户选中了一段文本（from: 100, to: 200），查找这段文本上的所有评论
   * const ranges = getCommentRangesFromPlugin(editor)
   * const comments = commentStore.getCommentsByRange(ranges, 100, 200)
   *
   * // 用户点击了文档的某个位置（pos: 150），查找这个位置附近的评论
   * const comments = commentStore.getCommentsByRange(ranges, 150, 150)
   * ```
   */
  getCommentsByRange(
    ranges: Map<string, CommentRange>,
    from: number,
    to: number,
  ): Comment[] {
    /** 检测 ranges 是否变更（通过签名比较，考虑位置与段落变化） */
    const currentSignature = this.computeRangesSignature(ranges)
    const rangesChanged = currentSignature !== this.cachedRangesSignature

    if (rangesChanged) {
      // ranges 变更，清除缓存并更新版本
      this.clearRangeQueryCache()
      this.cachedRangesSignature = currentSignature
    }

    /** 检查缓存 */
    const cacheKey = `${from}-${to}`
    const cachedResult = this.rangeQueryCache.get(cacheKey)
    if (cachedResult !== undefined) {
      return cachedResult
    }

    /** 缓存未命中，执行查询 */
    const matchingCommentIds: string[] = []

    /** 遍历所有评论范围，找出与查询范围有交集的评论（支持多段） */
    for (const [commentId, range] of ranges) {
      const segments = range.segments && range.segments.length > 0
        ? range.segments
        : [{ from: range.from, to: range.to }]

      const hasIntersect = segments.some(
        segment => segment.from < to && segment.to > from,
      )

      if (hasIntersect) {
        matchingCommentIds.push(commentId)
      }
    }

    /** 从 Store 中获取对应的评论实体 */
    const comments: Comment[] = []
    for (const commentId of matchingCommentIds) {
      const comment = this.getComment(commentId)
      if (comment) {
        comments.push(comment)
      }
    }

    /** 将查询结果存入缓存 */
    this.rangeQueryCache.set(cacheKey, comments)

    return comments
  }

  /**
   * 导出为 JSON
   * @returns 评论数组的 JSON 字符串
   */
  toJSON(): string {
    return JSON.stringify(this.getAllComments(), null, 2)
  }

  /**
   * 从 JSON 导入评论
   * @param json JSON 字符串或评论数组
   * @throws 如果 JSON 格式无效，抛出错误
   */
  fromJSON(json: string | Comment[]): void {
    let comments: Comment[]

    if (typeof json === 'string') {
      try {
        comments = JSON.parse(json) as Comment[]
      }
      catch (error) {
        throw new Error(`无效的 JSON 格式: ${error instanceof Error
          ? error.message
          : String(error)}`)
      }
    }
    else {
      comments = json
    }

    /** 验证数据格式 */
    if (!Array.isArray(comments)) {
      throw new TypeError('评论数据必须是数组')
    }

    /** 清空现有评论并导入新评论 */
    this.comments.clear()
    for (const comment of comments) {
      /** 基本验证 */
      if (!comment.id || !comment.content || !comment.author) {
        throw new Error(`无效的评论数据: 缺少必需字段`)
      }
      this.comments.set(comment.id, comment)
    }
    /** 导入后需清理缓存与版本，避免旧范围缓存污染 */
    this.clearRangeQueryCache()
    this.cachedRangesSignature = ''
    this.rebuildSnapshot()
    this.notify()
  }

  /**
   * 获取评论数量
   * @returns 评论总数
   */
  getCommentCount(): number {
    return this.comments.size
  }

  /**
   * 根据回复目标获取评论列表
   *
   * 获取所有回复指定评论的评论列表。
   *
   * @param replyToId 被回复的评论 ID
   * @returns 所有回复该评论的评论列表
   *
   * @example
   * ```typescript
   * // 获取 comment-1 的所有回复
   * const replies = commentStore.getCommentsByReplyTo('comment-1')
   * ```
   */
  getCommentsByReplyTo(replyToId: string): Comment[] {
    return this.getAllComments().filter(
      comment => comment.replyTo === replyToId,
    )
  }

  /**
   * 获取评论的回复数量
   *
   * 统计指定评论的回复数量。
   *
   * @param commentId 评论 ID
   * @returns 回复数量
   *
   * @example
   * ```typescript
   * // 获取 comment-1 的回复数量
   * const count = commentStore.getReplyCount('comment-1')
   * ```
   */
  getReplyCount(commentId: string): number {
    return this.getCommentsByReplyTo(commentId).length
  }

  /**
   * 获取完整的回复链（递归查找）
   *
   * 从指定评论开始，递归查找所有相关的回复，构建完整的回复链。
   * 返回的数组按时间顺序排列（从最早的回复到最新的回复）。
   *
   * @param commentId 起始评论 ID
   * @returns 完整的回复链（包括起始评论本身）
   *
   * @example
   * ```typescript
   * // 获取 comment-1 的完整回复链
   * // 如果 comment-2 回复 comment-1，comment-3 回复 comment-2
   * // 则返回 [comment-1, comment-2, comment-3]
   * const chain = commentStore.getReplyChain('comment-1')
   * ```
   */
  getReplyChain(commentId: string): Comment[] {
    const chain: Comment[] = []
    const visited = new Set<string>()

    /** 递归查找回复链 */
    const buildChain = (id: string) => {
      if (visited.has(id)) {
        /** 防止循环引用 */
        return
      }
      visited.add(id)

      const comment = this.getComment(id)
      if (!comment) {
        return
      }

      /** 先添加当前评论 */
      chain.push(comment)

      /** 查找所有回复当前评论的评论 */
      const replies = this.getCommentsByReplyTo(id)
      for (const reply of replies) {
        buildChain(reply.id)
      }
    }

    buildChain(commentId)

    /** 按创建时间排序 */
    return chain.sort((a, b) => a.createdAt - b.createdAt)
  }

  /**
   * 获取所有一级评论（非回复评论）
   *
   * 获取所有 `replyTo` 为空的评论，即不是回复其他评论的评论。
   *
   * @returns 所有一级评论的列表
   *
   * @example
   * ```typescript
   * // 获取所有一级评论
   * const topLevelComments = commentStore.getTopLevelComments()
   * ```
   */
  getTopLevelComments(): Comment[] {
    return this.getAllComments().filter(comment => !comment.replyTo)
  }

  /**
   * 清空所有评论
   */
  clear(): void {
    this.comments.clear()
    this.clearRangeQueryCache()
    this.cachedRangesSignature = ''
    this.rebuildSnapshot()
    this.notify()
  }
}

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
