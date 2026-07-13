import type { Node as PMNode } from '@tiptap/pm/model'
import type { SearchMatch } from './types'

/**
 * 在文档的各个文本块内查找字符串，并返回 ProseMirror 绝对坐标
 * 相邻 text node 可跨 mark 匹配，但不会跨段落等文本块匹配
 */
export function findTextMatches(
  doc: PMNode,
  query: string,
  caseSensitive = false,
): SearchMatch[] {
  if (!query) {
    return []
  }

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

    node.descendants((child, relativePos) => {
      if (!child.isText || !child.text) {
        return true
      }

      const absolutePos = blockPos + 1 + relativePos
      const previousPos = positions.at(-1)
      if (previousPos !== undefined && absolutePos !== previousPos + 1) {
        text += '\0'
        positions.push(-1)
      }

      for (let index = 0; index < child.text.length; index += 1) {
        text += child.text[index]
        positions.push(absolutePos + index)
      }

      return false
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
        matches.push({ from, to: lastPosition + 1 })
      }

      startIndex = matchIndex + Math.max(query.length, 1)
    }

    return false
  })

  return matches
}
