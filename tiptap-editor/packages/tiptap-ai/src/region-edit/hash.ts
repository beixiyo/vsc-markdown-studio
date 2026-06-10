/**
 * 块 hash 生成与寻址
 *
 * hash 输入 = 节点类型 + ProseMirror JSON 序列化（无损，任何变更含纯样式变更都会改变 hash）
 * 算法 = FNV-1a 64-bit（同步、零依赖），输出 16 位 hex
 * 重复块按文档顺序追加 `#2` `#3` 后缀消歧
 */

import type { Node as PMNode } from '@tiptap/pm/model'

/**
 * FNV-1a 64-bit hash，输出 16 位 hex 字符串
 */
export function fnv1a64(input: string): string {
  const PRIME = 0x100000001B3n
  const MASK = 0xFFFFFFFFFFFFFFFFn
  let hash = 0xCBF29CE484222325n

  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i))
    hash = (hash * PRIME) & MASK
  }

  return hash.toString(16).padStart(16, '0')
}

/**
 * 计算单个顶层块的 base hash（不含重复消歧后缀）
 */
export function hashBlock(node: PMNode): string {
  return fnv1a64(`${node.type.name}\x00${JSON.stringify(node.toJSON())}`)
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
