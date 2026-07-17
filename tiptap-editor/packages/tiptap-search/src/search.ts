import type { Node as PMNode } from '@tiptap/pm/model'
import type { LeafTextResolver, SearchMatch } from './types'

/**
 * 现成的叶子文本解析器：读取节点 schema 的 `spec.toText`（即 tiptap 节点的 `renderText`）
 *
 * 这是 tiptap 官方的纯文本序列化契约（`editor.getText()` 同源），
 * 不感知任何具体节点类型；节点没定义 renderText 就不参与匹配。
 * 本包不默认启用它——需要原子节点（如 speaker 芯片）可被搜索的宿主，
 * 自行 `Search.configure({ leafText: leafTextFromRenderText })` 接入
 */
export const leafTextFromRenderText: LeafTextResolver = ({ node, pos, parent, index }) =>
  node.type.spec.toText?.({ node, pos, parent, index })

/**
 * 在文档的各个文本块内查找字符串，并返回 ProseMirror 绝对坐标
 * 相邻 text node 可跨 mark 匹配，但不会跨段落等文本块匹配
 *
 * 默认只匹配纯文本节点；传入 `options.leafText` 后，叶子节点（原子节点等）
 * 的展示文本也参与匹配：其每个字符都映射回节点自身位置，因此命中折叠为
 * 整个节点 `[pos, pos + 1)`，高亮与跳转覆盖整个节点
 */
export function findTextMatches(
  doc: PMNode,
  query: string,
  caseSensitive = false,
  options: FindTextMatchesOptions = {},
): SearchMatch[] {
  if (!query) {
    return []
  }

  const { leafText } = options
  const needle = caseSensitive
    ? query
    : query.toLocaleLowerCase()
  const matches: SearchMatch[] = []

  doc.descendants((node, blockPos) => {
    if (!node.isTextblock) {
      return true
    }

    let text = ''
    const positions: number[] = []

    /** 与上一段已收集文本不相邻时插入哨兵，阻断跨间隙（如图片两侧）的误匹配 */
    const appendGapIfNeeded = (absolutePos: number) => {
      const previousPos = positions.at(-1)
      if (previousPos !== undefined && absolutePos !== previousPos + 1) {
        text += '\0'
        positions.push(-1)
      }
    }

    node.descendants((child, relativePos, parent, index) => {
      const absolutePos = blockPos + 1 + relativePos

      if (child.isText && child.text) {
        appendGapIfNeeded(absolutePos)

        for (let charIndex = 0; charIndex < child.text.length; charIndex += 1) {
          text += child.text[charIndex]
          positions.push(absolutePos + charIndex)
        }
        return false
      }

      /** 叶子节点：解析出的展示文本，所有字符都映射到节点自身位置 */
      if (child.isLeaf) {
        const resolved = leafText?.({ node: child, pos: absolutePos, parent, index })
        if (resolved) {
          appendGapIfNeeded(absolutePos)

          for (const char of resolved) {
            text += char
            positions.push(absolutePos)
          }
        }
        return false
      }

      return true
    })

    const haystack = caseSensitive
      ? text
      : text.toLocaleLowerCase()
    let startIndex = 0

    while (startIndex <= haystack.length - needle.length) {
      const matchIndex = haystack.indexOf(needle, startIndex)
      if (matchIndex === -1) {
        break
      }

      const from = positions[matchIndex]
      const lastPosition = positions[matchIndex + query.length - 1]
      if (from !== undefined && lastPosition !== undefined) {
        const to = lastPosition + 1
        const previousMatch = matches.at(-1)

        /** 同一原子节点内的多处命中折叠成同一区间，去重避免重复高亮与虚增计数 */
        if (!previousMatch || previousMatch.from !== from || previousMatch.to !== to) {
          matches.push({ from, to })
        }
      }

      startIndex = matchIndex + Math.max(query.length, 1)
    }

    return false
  })

  return matches
}

/** findTextMatches 的可选行为配置 */
export type FindTextMatchesOptions = {
  /**
   * 叶子节点展示文本解析器；不传则叶子节点不参与匹配。
   * 现成实现见 `leafTextFromRenderText`（读取节点 schema 的 spec.toText）
   * @default undefined
   */
  leafText?: LeafTextResolver
}
