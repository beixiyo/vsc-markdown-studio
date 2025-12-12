/**
 * 评论导出/导入 API
 *
 * 此模块提供统一的导出/导入功能，将文档 JSON 和评论数据组合在一起。
 * 由于 CommentMark 扩展已经实现了序列化，文档中的 comment mark 会
 * 自动包含在 editor.getJSON() 中，因此只需要组合文档和评论数据即可。
 *
 * @see plan/comment-system-architecture.md 了解架构详情
 */

import type { Editor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { CommentStore, type Comment } from './comment-store'
import { syncCommentRanges } from './comment-sync'

/**
 * 导出文档和评论的 JSON 结构
 */
export interface DocumentWithComments {
  /** 文档的 ProseMirror JSON 格式（包含 comment mark） */
  doc: JSONContent
  /** 评论数据数组 */
  comments: Comment[]
  /** 导出时间戳（可选） */
  exportedAt?: number
  /** 版本号（可选，用于兼容性检查） */
  version?: string
}

/**
 * 导出文档和评论
 *
 * 此函数会：
 * 1. 使用 `editor.getJSON()` 导出文档（自动包含 comment mark）
 * 2. 使用 `commentStore.toJSON()` 导出评论数据
 * 3. 组合成统一的 JSON 结构
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @returns 包含文档和评论的 JSON 对象
 *
 * @example
 * ```typescript
 * const json = exportDocumentWithComments(editor, commentStore)
 * const jsonString = JSON.stringify(json, null, 2)
 * // 保存到文件或发送到服务器
 * ```
 */
export function exportDocumentWithComments(
  editor: Editor | null,
  commentStore: CommentStore
): DocumentWithComments {
  if (!editor) {
    throw new Error('编辑器实例不能为空')
  }

  // 导出文档（自动包含 comment mark）
  const doc = editor.getJSON()

  // 导出评论数据
  const comments = commentStore.getAllComments()

  return {
    doc,
    comments,
    exportedAt: Date.now(),
    version: '1.0.0',
  }
}

/**
 * 导入文档和评论
 *
 * 此函数会：
 * 1. 使用 `editor.commands.setContent(json.doc)` 恢复文档（自动恢复 comment mark）
 * 2. 使用 `commentStore.fromJSON(json.comments)` 恢复评论数据
 * 3. Plugin 会自动重新扫描文档，更新评论范围（通过 Plugin 的 state.init() 和 state.apply()）
 *
 * **注意**：导入后，Plugin 会在下次事务时自动重新扫描文档，更新评论范围。
 * 如果需要立即触发重新扫描，可以手动触发一个空事务。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param json 包含文档和评论的 JSON 对象
 * @param options 导入选项
 * @param options.triggerRescan 是否立即触发 Plugin 重新扫描（默认：true）
 *
 * @example
 * ```typescript
 * const json = JSON.parse(jsonString)
 * importDocumentWithComments(editor, commentStore, json)
 * ```
 */
export function importDocumentWithComments(
  editor: Editor | null,
  commentStore: CommentStore,
  json: DocumentWithComments,
  options?: {
    /** 是否立即触发 Plugin 重新扫描（默认：true） */
    triggerRescan?: boolean
  }
): void {
  if (!editor) {
    throw new Error('编辑器实例不能为空')
  }

  // 验证 JSON 结构
  if (!json.doc || !Array.isArray(json.comments)) {
    throw new Error('无效的 JSON 格式：缺少 doc 或 comments 字段')
  }

  // 1. 恢复文档（自动恢复 comment mark）
  editor.commands.setContent(json.doc)

  // 2. 恢复评论数据
  commentStore.fromJSON(json.comments)

  // 3. 触发 Plugin 重新扫描评论范围
  // 由于 setContent 会触发事务，Plugin 的 state.apply() 会自动重新扫描
  // 但为了确保立即更新，我们可以手动触发一个空事务
  if (options?.triggerRescan !== false) {
    // 触发一个空事务，确保 Plugin 立即重新扫描
    const { tr } = editor.state
    editor.view.dispatch(tr)

    // 4. 同步评论范围与 Store 状态（检测边界情况）
    // 检测并清理孤立的评论 mark，检测被删除的评论状态
    syncCommentRanges(editor, commentStore)
  }
}

/**
 * 导出为 JSON 字符串
 *
 * 便捷函数，直接返回 JSON 字符串。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param indent 缩进空格数（默认：2）
 * @returns JSON 字符串
 *
 * @example
 * ```typescript
 * const jsonString = exportDocumentWithCommentsAsString(editor, commentStore)
 * // 保存到文件
 * ```
 */
export function exportDocumentWithCommentsAsString(
  editor: Editor | null,
  commentStore: CommentStore,
  indent: number = 2
): string {
  const json = exportDocumentWithComments(editor, commentStore)
  return JSON.stringify(json, null, indent)
}

/**
 * 从 JSON 字符串导入
 *
 * 便捷函数，从 JSON 字符串导入。
 *
 * @param editor 编辑器实例
 * @param commentStore 评论 Store 实例
 * @param jsonString JSON 字符串
 * @param options 导入选项
 *
 * @example
 * ```typescript
 * const jsonString = fs.readFileSync('document.json', 'utf-8')
 * importDocumentWithCommentsFromString(editor, commentStore, jsonString)
 * ```
 */
export function importDocumentWithCommentsFromString(
  editor: Editor | null,
  commentStore: CommentStore,
  jsonString: string,
  options?: {
    /** 是否立即触发 Plugin 重新扫描（默认：true） */
    triggerRescan?: boolean
  }
): void {
  let json: DocumentWithComments

  try {
    json = JSON.parse(jsonString) as DocumentWithComments
  } catch (error) {
    throw new Error(
      `无效的 JSON 格式: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  importDocumentWithComments(editor, commentStore, json, options)
}

