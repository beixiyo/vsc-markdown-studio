import { Mark, mergeAttributes } from '@tiptap/core'
import { DATA_COMMENT_ID } from '../constants'
import { createCommentPlugin } from './comment-plugin'

export interface CommentMarkOptions {
  /**
   * 要添加到评论标记元素的HTML属性。
   * @default {}
   */
  HTMLAttributes: Record<string, any>
}

/**
 * 评论标记扩展
 *
 * 此标记扩展用于在文档中标记评论锚点。
 * 它仅在文档中存储commentId，而实际的评论数据
 * （内容、作者等）存储在外部的CommentStore中。
 *
 * 功能特性:
 * - 支持在同一文本上使用多个评论标记 (inclusive: false, spanning: false)
 * - 使用 `<span data-comment-id="...">` 进行HTML序列化/反序列化
 * - 通过 editor.getJSON() 自动包含在JSON导出中
 *
 * @see plan/comment-system-architecture.md 了解架构详情
 */
export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => {
          return element.getAttribute(DATA_COMMENT_ID) || null
        },
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {}
          }
          return {
            [DATA_COMMENT_ID]: attributes.commentId,
            class: 'comment-mark',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[${DATA_COMMENT_ID}]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      /**
       * 子内容的位置指示符
       * - 对于 Mark（标记），`0` 表示包裹其内部的文本内容
       * - 如果是 Node（节点），可以是：
       * - 数字（如 `0`）：表示子内容从该索引位置开始
       * - 数组：表示子元素，例如 `[['hr']]` 表示一个 `<hr>` 子元素
       * - 字符串：表示文本内容
       * - 省略：表示没有子内容或自闭合标签
       */
      0,
    ]
  },

  /** 支持在同一文本上使用多个评论标记 */
  // inclusive: false - 允许相同类型的多个标记
  // spanning: false - 标记不跨越块边界
  inclusive: false,
  spanning: false,

  /**
   * 添加 ProseMirror Plugin
   * 用于维护评论范围映射和装饰
   */
  addProseMirrorPlugins() {
    return [createCommentPlugin()]
  },
})
