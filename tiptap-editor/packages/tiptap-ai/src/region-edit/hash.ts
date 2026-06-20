/**
 * 块寻址 —— 复用 tiptap-utils 的 hash 基元（与 block-sync 共用单一真相源）
 *
 * `fnv1a64` / `hashBlock` 收在 `tiptap-utils`；这里只保留 region-edit 独有的
 * 「顶层块索引 + 重复 #n 消歧 + 按 hash 寻址」
 */

import type { Node as PMNode } from '@tiptap/pm/model'
import { hashBlock } from 'tiptap-utils'

/**
 * 遍历 doc 顶层子节点，构建 hash 索引（重复 hash 追加 #n 后缀）
 */
export function buildBlockIndex(doc: PMNode): BlockEntry[] {
  const seen = new Map<string, number>()
  const entries: BlockEntry[] = []

  doc.forEach((node, offset, index) => {
    const base = hashBlock(node)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)

    entries.push({
      node,
      pos: offset,
      index,
      hash: count === 1
        ? base
        : `${base}#${count}`,
    })
  })

  return entries
}

/**
 * 按 hash（含后缀）查找目标块，未命中返回 undefined
 */
export function findBlock(doc: PMNode, target: string): BlockEntry | undefined {
  return buildBlockIndex(doc).find(entry => entry.hash === target)
}

/**
 * 文档顶层块索引项
 */
export type BlockEntry = {
  node: PMNode
  /** 块起始绝对位置（块范围 = [pos, pos + node.nodeSize]） */
  pos: number
  /** 顶层子节点下标 */
  index: number
  /** 含消歧后缀的最终 hash */
  hash: string
}
