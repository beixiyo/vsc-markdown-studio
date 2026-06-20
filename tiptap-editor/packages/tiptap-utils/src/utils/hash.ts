/**
 * 块 hash —— region-edit（hash 锚点）与 block-sync（变更检测）共用的 FNV-1a 基元
 *
 * 单一真相源：
 * - region-edit 用 `hashBlock(node)`（含全部 attrs，任意变更含纯样式都改 hash）作不透明锚点
 * - block-sync 用 `hashBlock(node, { stripAttr: 'blockId' })`（剔除稳定 id，只表达内容）判变
 */

import type { Node as PMNode } from '@tiptap/pm/model'
import type { BlockSerializeOptions } from './block-serialize'
import { stripAttrDeep } from './block-serialize'

/**
 * FNV-1a 64-bit，输出 16 位 hex 字符串（同步、零依赖）
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
 * 计算单个顶层块的 hash（base hash，不含重复消歧后缀）
 * @param node 顶层块节点
 * @param options 选项；`stripAttr` 会在 hash 前递归剔除该 attr（如稳定 blockId），
 *   使 hash 只表达内容（同 id 块内容变才变）；不传则含全部 attrs（任意变更都改 hash）
 */
export function hashBlock(node: PMNode, options?: BlockSerializeOptions): string {
  const json = options?.stripAttr
    ? stripAttrDeep(node.toJSON(), options.stripAttr)
    : node.toJSON()
  return fnv1a64(`${node.type.name}\x00${JSON.stringify(json)}`)
}
