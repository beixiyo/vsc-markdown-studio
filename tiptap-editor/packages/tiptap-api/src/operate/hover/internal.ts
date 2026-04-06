import type { Node as PMNode, ResolvedPos } from '@tiptap/pm/model'

/**
 * 将叶子节点中的「硬换行」映射为 \\n，便于按逻辑行切分
 */
export function leafTextWithHardBreaks(node: PMNode): string {
  if (node.type.name === 'hardBreak')
    return '\n'
  return ''
}

/**
 * 块内扁平字符偏移 → 文档位置（与 `doc.textBetween` + leafTextWithHardBreaks 一致）
 */
export function docPosAtFlatOffset(
  doc: PMNode,
  blockFrom: number,
  blockTo: number,
  offset: number,
): number | null {
  if (offset < 0)
    return null

  let acc = 0
  let result: number | null = null

  doc.nodesBetween(blockFrom, blockTo, (node, pos) => {
    if (result !== null)
      return false

    if (node.isText && node.text) {
      const len = node.text.length
      if (offset < acc + len) {
        result = pos + (offset - acc)
        return false
      }
      acc += len
      return
    }

    if (node.type.name === 'hardBreak') {
      if (offset === acc) {
        result = pos
        return false
      }
      acc += 1
    }
  })

  if (result !== null)
    return result
  if (offset === acc)
    return blockTo
  return null
}

/**
 * 光标所在最内层块级节点深度（不含 doc）
 */
export function findInnermostBlockDepth($pos: ResolvedPos): number {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).isBlock)
      return d
  }
  return 0
}
