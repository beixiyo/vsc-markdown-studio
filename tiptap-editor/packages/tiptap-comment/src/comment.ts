/**
 * 评论 API
 *
 * 此模块封装了评论操作的业务逻辑，包括创建、删除、更新评论等功能。
 * 处理评论与 mark 的关联，以及 Plugin state 的更新。
 *
 * @see plan/comment-system-architecture.md 了解架构详情
 */

import type { Editor } from '@tiptap/react'
import type { Comment, CommentAuthor, CommentStore } from './comment-store'
import { hasSelectedText } from 'tiptap-api'
import { commentPluginKey, type CommentRange } from './plugin'

/**
 * 创建评论的参数接口
 */
export interface CreateCommentParams {
  /** 评论内容 */
  content: string
  /** 作者信息 */
  author: CommentAuthor
  /** 选中的文本范围（可选，如果不提供则使用当前选中范围） */
  from?: number
  to?: number
  /** 扩展字段（可选） */
  mentions?: string[]
  tags?: string[]
}

/**
 * 更新评论的参数接口
 */
export interface UpdateCommentParams {
  /** 要更新的字段 */
  content?: string
  status?: Comment['status']
  mentions?: string[]
  tags?: string[]
}

/**
 * 创建评论
 *
 * 此函数会：
 * 1. 生成 commentId（格式：`comment-${crypto.randomUUID()}`）
 * 2. 在文档选中范围添加 comment mark
 * 3. 创建 Comment 实体并存储到 Store
 * 4. Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param params 创建评论的参数
 * @returns 创建的评论实体，如果创建失败则返回 null
 *
 * @example
 * ```typescript
 * const comment = createComment(editor, commentStore, {
 *   content: '这段代码需要优化',
 *   author: { id: 'user-1', name: '张三' }
 * })
 * ```
 */
export function createComment(
  editor: Editor | null,
  commentStore: CommentStore,
  params: CreateCommentParams,
): Comment | null {
  if (!editor || !editor.isEditable) {
    return null
  }

  /** 获取选中范围 */
  const { from, to } = editor.state.selection
  const selectedFrom = params.from ?? from
  const selectedTo = params.to ?? to

  /** 验证选中范围 */
  if (selectedFrom === selectedTo) {
    console.warn('创建评论失败：未选中文本')
    return null
  }

  /** 生成 commentId */
  const commentId = `comment-${crypto.randomUUID()}`

  try {
    /** 在文档选中范围添加 comment mark */
    const success = editor
      .chain()
      .focus()
      .setTextSelection({ from: selectedFrom, to: selectedTo })
      .setMark('comment', { commentId })
      .run()

    if (!success) {
      console.warn('创建评论失败：无法添加 comment mark')
      return null
    }

    /** 创建 Comment 实体 */
    const now = Date.now()
    const comment: Comment = {
      id: commentId,
      content: params.content,
      author: params.author,
      createdAt: now,
      status: 'active',
      mentions: params.mentions,
      tags: params.tags,
    }

    /** 存储到 Store */
    commentStore.addComment(comment)

    // Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）
    /** 因为我们已经通过 transaction 添加了 mark，Plugin 会在下次 apply 时检测到 */

    return comment
  }
  catch (error) {
    console.error('创建评论失败:', error)
    return null
  }
}

/**
 * 删除评论
 *
 * 此函数会：
 * 1. 从文档中移除 comment mark（查找所有带有该 commentId 的 mark）
 * 2. 从 Store 中删除评论实体
 * 3. Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param commentId 评论 ID
 * @returns 是否删除成功
 *
 * @example
 * ```typescript
 * const success = deleteComment(editor, commentStore, 'comment-123')
 * ```
 */
export function deleteComment(
  editor: Editor | null,
  commentStore: CommentStore,
  commentId: string,
): boolean {
  if (!editor || !editor.isEditable) {
    return false
  }

  try {
    /** 获取评论范围 */
    const range = getCommentRange(editor, commentId)
    if (!range) {
      console.warn(`删除评论失败：找不到评论范围，commentId: ${commentId}`)
      /** 即使找不到范围，也尝试从 Store 中删除 */
      return commentStore.deleteComment(commentId)
    }

    /** 从文档中移除 comment mark */
    const { state } = editor
    const commentMarkType = state.schema.marks.comment

    if (!commentMarkType) {
      console.warn('删除评论失败：找不到 comment mark 类型')
      return commentStore.deleteComment(commentId)
    }

    /**
     * 创建事务，移除特定 commentId 的 mark
     * 需要遍历整个文档，因为评论范围可能不准确（如果范围被修改过）
     */
    const { tr } = state
    const positionsToUpdate: Array<{ from: number, to: number, marks: any[] }> = []

    /** 遍历整个文档，查找所有带有该 commentId 的文本节点 */
    tr.doc.descendants((node, pos) => {
      if (node.isText && node.marks) {
        /** 查找带有该 commentId 的 mark */
        const hasTargetMark = node.marks.some(
          mark => mark.type === commentMarkType && mark.attrs.commentId === commentId,
        )

        if (hasTargetMark) {
          /** 创建新的 mark 集合，排除掉要删除的 mark */
          const newMarks = node.marks.filter(
            mark => !(mark.type === commentMarkType && mark.attrs.commentId === commentId),
          )

          positionsToUpdate.push({
            from: pos,
            to: pos + node.nodeSize,
            marks: newMarks,
          })
        }
      }

      return true
    })

    /** 应用更改：先移除所有 comment mark，然后重新添加其他 mark */
    for (const { from, to, marks } of positionsToUpdate) {
      /** 移除该范围内的所有 comment mark */
      tr.removeMark(from, to, commentMarkType)

      /** 重新添加其他 mark（包括其他 comment mark 和其他类型的 mark） */
      for (const mark of marks) {
        tr.addMark(from, to, mark)
      }
    }

    /** 应用事务 */
    if (positionsToUpdate.length > 0) {
      editor.view.dispatch(tr)
    }

    /** 从 Store 中删除评论实体 */
    const deleted = commentStore.deleteComment(commentId)

    // Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）

    return deleted
  }
  catch (error) {
    console.error('删除评论失败:', error)
    return false
  }
}

/**
 * 更新评论
 *
 * 此函数会：
 * 1. 更新 Store 中的评论实体
 * 2. 更新 updatedAt 时间戳
 *
 * @param commentStore 评论 Store 实例
 * @param commentId 评论 ID
 * @param updates 要更新的字段
 * @returns 是否更新成功
 *
 * @example
 * ```typescript
 * const success = updateComment(commentStore, 'comment-123', {
 *   content: '更新后的评论内容'
 * })
 * ```
 */
export function updateComment(
  commentStore: CommentStore,
  commentId: string,
  updates: UpdateCommentParams,
): boolean {
  try {
    commentStore.updateComment(commentId, updates)
    return true
  }
  catch (error) {
    console.error('更新评论失败:', error)
    return false
  }
}

/**
 * 获取评论范围
 *
 * 从 Plugin state 获取评论范围信息。
 *
 * @param editor 编辑器实例
 * @param commentId 评论 ID
 * @returns 评论范围信息，如果不存在则返回 null
 *
 * @example
 * ```typescript
 * const range = getCommentRange(editor, 'comment-123')
 * if (range) {
 *   console.log(`评论范围: ${range.from} - ${range.to}`)
 * }
 * ```
 */
export function getCommentRange(
  editor: Editor | null,
  commentId: string,
): CommentRange | null {
  if (!editor) {
    return null
  }

  const pluginState = commentPluginKey.getState(editor.state)
  if (!pluginState) {
    return null
  }

  return pluginState.ranges.get(commentId) || null
}

/**
 * 检查是否可以创建评论
 *
 * 检查编辑器是否有选中的文本，以及是否可编辑。
 *
 * @param editor 编辑器实例
 * @returns 是否可以创建评论
 */
export function canCreateComment(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) {
    return false
  }

  return hasSelectedText(editor)
}

/**
 * 获取评论的选中文本
 *
 * 根据评论 ID 获取评论对应的文档文本内容。
 *
 * @param editor 编辑器实例
 * @param commentId 评论 ID
 * @returns 评论对应的文本内容，如果不存在则返回空字符串
 */
export function getCommentText(editor: Editor | null, commentId: string): string {
  if (!editor) {
    return ''
  }

  const range = getCommentRange(editor, commentId)
  if (!range) {
    return ''
  }

  const segments = range.segments && range.segments.length > 0
    ? range.segments
    : [{ from: range.from, to: range.to }]

  const texts: string[] = []
  for (const segment of segments) {
    texts.push(editor.state.doc.textBetween(segment.from, segment.to, '\n'))
  }

  return texts.join('\n')
}

/**
 * 创建回复的参数接口
 */
export interface CreateReplyParams {
  /** 回复内容 */
  content: string
  /** 作者信息 */
  author: CommentAuthor
  /** 被回复的评论 ID */
  replyToId: string
  /** 选中的文本范围（可选，如果不提供则使用当前选中范围） */
  from?: number
  to?: number
  /** 扩展字段（可选） */
  mentions?: string[]
  tags?: string[]
}

/**
 * 创建回复评论
 *
 * 此函数会：
 * 1. 验证被回复的评论是否存在
 * 2. 生成 commentId（格式：`comment-${crypto.randomUUID()}`）
 * 3. 在文档选中范围添加 comment mark（如果提供了选中范围）
 * 4. 创建回复评论实体并存储到 Store，自动填充回复相关字段：
 *    - `replyTo`: 被回复的评论 ID
 *    - `replyToAuthor`: 被回复的作者信息
 *    - `replyToContent`: 被回复的评论内容（用于展示引用，可选，可截断）
 * 5. Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）
 *
 * **注意**：回复评论与普通评论使用相同的创建流程，只是多了回复相关字段。
 * 如果用户选中了新的文本范围，会创建新的 comment mark；如果没有选中文本，
 * 则复用被回复评论的文档范围（不创建新的 mark）。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param params 创建回复的参数
 * @returns 创建的回复评论实体，如果创建失败则返回 null
 *
 * @example
 * ```typescript
 * // 回复 comment-1
 * const reply = createReply(editor, commentStore, {
 *   content: '我也觉得不错',
 *   author: { id: 'user-2', name: '李四' },
 *   replyToId: 'comment-1'
 * })
 * ```
 */
export function createReply(
  editor: Editor | null,
  commentStore: CommentStore,
  params: CreateReplyParams,
): Comment | null {
  if (!editor || !editor.isEditable) {
    return null
  }

  /** 获取被回复的评论 */
  const parentComment = commentStore.getComment(params.replyToId)
  if (!parentComment) {
    console.warn(`创建回复失败：找不到被回复的评论，replyToId: ${params.replyToId}`)
    return null
  }

  /** 生成 commentId */
  const commentId = `comment-${crypto.randomUUID()}`

  try {
    /**
     * 回复不应覆盖原有标注，否则会导致父评论被替换。
     * 因此在创建回复时不对文档 mark 做任何修改，只创建回复实体。
     */

    /** 创建回复评论实体 */
    const now = Date.now()

    /** 截断被回复的评论内容（用于展示引用，超过 50 字符显示省略号） */
    const replyToContent = parentComment.content.length > 50
      ? `${parentComment.content.substring(0, 50)}...`
      : parentComment.content

    const reply: Comment = {
      id: commentId,
      content: params.content,
      author: params.author,
      createdAt: now,
      status: 'active',
      /** 回复相关字段 */
      replyTo: params.replyToId,
      replyToAuthor: parentComment.author,
      replyToContent,
      /** 扩展字段 */
      mentions: params.mentions,
      tags: params.tags,
    }

    /** 存储到 Store */
    commentStore.addComment(reply)

    // Plugin state 的 ranges 会自动更新（通过 Plugin 的 apply 方法）

    return reply
  }
  catch (error) {
    console.error('创建回复失败:', error)
    return null
  }
}
