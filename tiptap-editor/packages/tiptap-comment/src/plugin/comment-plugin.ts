import type { Node } from '@tiptap/pm/model'
import type { EditorState } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { COMMENT_HIGHLIGHT_ACTIVE_CLASS, COMMENT_HIGHLIGHT_CLASS, DATA_COMMENT_ID } from '../constants'

/**
 * 评论范围信息
 */
export interface CommentRange {
  /** 评论 ID */
  commentId: string
  /** 文档起始位置（字符偏移，ProseMirror 位置） */
  from: number
  /** 文档结束位置（字符偏移，ProseMirror 位置） */
  to: number
  /** 多段范围（当评论被拆分为多个不连续片段时） */
  segments?: Array<{ from: number, to: number }>
}

/**
 * 评论 Plugin 状态
 */
export interface CommentPluginState {
  /** 评论范围映射表，key 为 commentId，value 为范围信息 */
  ranges: Map<string, CommentRange>
  /** 当前选中的活动评论 ID（用于高亮显示） */
  activeCommentId?: string | null
  /** 用于高亮显示的装饰集合 */
  decorations: DecorationSet
}

/**
 * 评论 Plugin 的 PluginKey
 * 用于从 EditorState 中获取 Plugin 状态
 */
export const commentPluginKey = new PluginKey<CommentPluginState>('comment')

/**
 * 创建评论 Plugin
 *
 * 此 Plugin 负责：
 * 1. 维护评论范围映射（Map<commentId, { from, to }>）
 * 2. 监听文档变更，使用 Mapping 自动更新评论范围
 * 3. 提供评论范围查询 API（通过 pluginKey.getState()）
 * 4. 创建装饰用于高亮显示评论区域
 *
 * 注意：Plugin 只维护范围信息，评论实体数据存储在 CommentStore 中
 *
 * @see plan/comment-system-architecture.md 了解架构详情
 */
export function createCommentPlugin(): Plugin<CommentPluginState> {
  return new Plugin<CommentPluginState>({
    key: commentPluginKey,

    state: {
      /**
       * 初始化 Plugin 状态
       * 在初始化时扫描文档，查找所有已存在的 comment mark
       * @param config 编辑器配置
       * @param instance 编辑器实例状态
       * @returns 初始状态
       */
      init(_, instance): CommentPluginState {
        /** 扫描文档，查找所有 comment mark */
        const ranges = scanCommentRanges(instance.doc)

        /** 计算装饰 */
        const decorations = computeDecorations(instance.doc, ranges)

        return {
          ranges,
          activeCommentId: null,
          decorations,
        }
      },

      /**
       * 应用事务，更新 Plugin 状态
       * 使用 ProseMirror 的 Mapping 机制自动更新评论范围
       * 同时检测新增和删除的 comment mark
       * 使用增量更新优化 Decoration 计算性能
       * @param tr 事务对象
       * @param oldState 旧状态
       * @returns 新状态
       */
      apply(tr, oldState): CommentPluginState {
        /**
         * 重新扫描文档，获取实际存在的 comment mark
         * 这可以捕获通过事务添加的新 mark，以及检测被删除的 mark
         */
        const scannedRanges = scanCommentRanges(tr.doc)

        /**
         * 检测是否有活动评论 ID 的更新
         */
        const activeCommentId = tr.getMeta('setActiveCommentId')
        const currentActiveCommentId = activeCommentId !== undefined
          ? activeCommentId
          : oldState.activeCommentId

        /**
         * 使用扫描结果作为最终的范围（因为它反映了文档的当前状态）
         * 这样可以确保删除评论时，对应的范围也会被正确移除
         * 注意：扫描结果已经包含了所有实际存在的 mark，包括新增的和位置更新的
         */
        const finalRanges = new Map<string, CommentRange>()
        for (const [commentId, scannedRange] of scannedRanges) {
          finalRanges.set(commentId, scannedRange)
        }

        /**
         * 基于 finalRanges 重新构建 decorations，确保 decorations 与 ranges 完全一致
         * 这样可以确保删除评论时，对应的 decorations 也会被正确清理
         */
        const decorations = computeDecorations(tr.doc, finalRanges, currentActiveCommentId)

        return {
          ranges: finalRanges,
          activeCommentId: currentActiveCommentId,
          decorations,
        }
      },
    },

    props: {
      /**
       * 返回装饰集合，用于在文档中高亮显示评论区域
       * @param state 编辑器状态
       * @returns 装饰集合
       */
      decorations(state: EditorState): DecorationSet {
        const pluginState = this.getState(state)
        return pluginState?.decorations || DecorationSet.empty
      },
    },
  })
}

/**
 * 扫描文档，查找所有 comment mark 及其位置范围
 * @param doc 文档节点
 * @returns 评论范围映射表
 */
function scanCommentRanges(doc: Node): Map<string, CommentRange> {
  const ranges = new Map<string, CommentRange>()

  /** 遍历文档的所有节点 */
  doc.descendants((node, pos) => {
    /** 只处理文本节点 */
    if (!node.isText) {
      return true
    }

    /** 检查节点的 marks */
    if (node.marks && node.marks.length > 0) {
      for (const mark of node.marks) {
        /** 查找 comment mark */
        if (mark.type.name === 'comment') {
          const commentId = mark.attrs?.commentId

          if (commentId && typeof commentId === 'string') {
            const from = pos
            const to = pos + node.nodeSize

            /** 收集并合并多段范围 */
            const existingRange = ranges.get(commentId)

            if (!existingRange) {
              ranges.set(commentId, {
                commentId,
                from,
                to,
                segments: [{ from, to }],
              })
            }
            else {
              const segments = existingRange.segments
                ? [...existingRange.segments, { from, to }]
                : [{ from: existingRange.from, to: existingRange.to }, { from, to }]

              const merged = mergeSegments(segments)
              const minFrom = merged[0].from
              const maxTo = merged[merged.length - 1].to

              ranges.set(commentId, {
                commentId,
                from: minFrom,
                to: maxTo,
                segments: merged,
              })
            }
          }
        }
      }
    }

    return true // 继续遍历
  })

  return ranges
}

/**
 * 根据评论范围计算装饰（用于高亮显示）
 * @param doc 文档节点
 * @param ranges 评论范围映射表
 * @param activeCommentId 当前活动的评论 ID
 * @returns 装饰集合
 */
function computeDecorations(
  doc: Node,
  ranges: Map<string, CommentRange>,
  activeCommentId?: string | null,
): DecorationSet {
  const decorations: Decoration[] = []

  for (const [commentId, range] of ranges) {
    const segments = range.segments && range.segments.length > 0
      ? range.segments
      : [{ from: range.from, to: range.to }]

    const isActive = activeCommentId === commentId

    for (const segment of segments) {
      /** 验证范围有效性 */
      if (segment.from >= segment.to || segment.from < 0 || segment.to > doc.content.size) {
        continue
      }

      /** 创建内联装饰，用于高亮显示评论区域 */
      const decoration = Decoration.inline(segment.from, segment.to, {
        class: isActive
          ? COMMENT_HIGHLIGHT_ACTIVE_CLASS
          : COMMENT_HIGHLIGHT_CLASS,
        [DATA_COMMENT_ID]: commentId,
      })

      decorations.push(decoration)
    }
  }

  return DecorationSet.create(doc, decorations)
}

/**
 * 合并重叠或相邻的段落，并按起点排序
 */
function mergeSegments(
  segments: Array<{ from: number, to: number }>,
): Array<{ from: number, to: number }> {
  const sorted = segments
    .map(seg => ({ ...seg }))
    .sort((a, b) => a.from - b.from)

  const merged: Array<{ from: number, to: number }> = []

  for (const seg of sorted) {
    if (merged.length === 0) {
      merged.push(seg)
      continue
    }

    const last = merged[merged.length - 1]
    if (seg.from <= last.to) {
      last.to = Math.max(last.to, seg.to)
    }
    else {
      merged.push(seg)
    }
  }

  return merged
}
